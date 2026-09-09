import express, { NextFunction, Response, Request } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpServer } from "./server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

// One McpServer per transport, never one per API key.
//
// The SDK's Protocol keeps a *single* `_transport` field per server and sends
// every response through it, so connecting one server to several transports
// makes whichever transport connected last receive all the traffic. Two
// concurrent sessions on one key are enough to trigger it: one of them
// receives both sets of replies while the other waits on responses that never
// arrive, until it gives up and reconnects.
type SseSession = {
  server: McpServer;
  transport: SSEServerTransport;
  res: Response;
};
type StreamableSession = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
  // Number of open standalone SSE streams. A session can sit idle for hours
  // with a healthy stream attached, so it must not be swept while this is > 0.
  openStreams: number;
  // Requests currently being handled. lastActivity is only refreshed either
  // side of a request, so a single call that outlasts the idle timeout would
  // otherwise look abandoned while it is still running. Nothing bounds how
  // long that can take: none of the upstream axios calls set a timeout.
  inFlight: number;
};

const sseSessions: Record<string, SseSession> = {};
const streamableSessions: Record<string, StreamableSession> = {};

// A Streamable HTTP session is only torn down by an explicit DELETE, because
// the SDK transport's disconnect handlers just drop the stream from its
// internal map and never fire `onclose`. Clients routinely go away without
// sending one: mcp-remote 0.8.3 abandons a connection-check session on every
// connection, and any client that is killed rather than closed leaves its
// session behind too. Each orphan pins an McpServer and the API key it closes
// over, so without a sweeper the map grows on every connect, forever.
const SESSION_IDLE_TIMEOUT_MS =
  Number(process.env.SESSION_IDLE_TIMEOUT_MS) || 30 * 60 * 1000;
const SESSION_SWEEP_INTERVAL_MS =
  Number(process.env.SESSION_SWEEP_INTERVAL_MS) || 5 * 60 * 1000;

const missingApiKeyError = {
  jsonrpc: '2.0',
  error: {
    code: -32000,
    message: 'Bad Request: No valid mmApiKey provided',
  },
  id: null,
};

const missingSessionIdError = {
  jsonrpc: '2.0',
  error: {
    code: -32000,
    message: 'Bad Request: No valid session ID provided',
  },
  id: null,
};

// Pulls the key out when it is there, but leaves the decision to reject to the
// route handlers: only requests that establish a new session need a key, while
// requests against an existing session are identified by their session ID.
const extractMmApiKey = (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    const header = req.headers['authorization'] as string | undefined
      || req.headers['mmapikey'] as string | undefined;
    const mmApiKey = header || req.query['mmapikey'] as string | undefined;

    if (mmApiKey) {
      (req as any)['mmapikey'] = mmApiKey.replace(/^Bearer /, "");
    }

    next();
  };

app.use(extractMmApiKey);

async function closeSession(
  session: { server: McpServer; transport: Transport }
): Promise<void> {
  try {
    await session.transport.close();
    await session.server.close();
  } catch (error) {
    console.error('Error closing session:', error);
  }
}

function sweepIdleSessions(): void {
  const now = Date.now();

  for (const [sessionId, session] of Object.entries(streamableSessions)) {
    if (session.openStreams > 0) continue;
    if (session.inFlight > 0) continue;
    if (now - session.lastActivity < SESSION_IDLE_TIMEOUT_MS) continue;

    console.log(`Sweeping idle Streamable HTTP session ${sessionId}`);
    delete streamableSessions[sessionId];
    void closeSession(session);
  }

  // Insurance against a 'close' event we never saw on a half-open connection.
  // Only ever removes a response that is already closed, so it cannot cut off
  // a live stream.
  for (const [sessionId, session] of Object.entries(sseSessions)) {
    if (!session.res.closed) continue;

    console.log(`Sweeping closed SSE session ${sessionId}`);
    delete sseSessions[sessionId];
    void closeSession(session);
  }
}

const sweepTimer = setInterval(sweepIdleSessions, SESSION_SWEEP_INTERVAL_MS);
sweepTimer.unref();

// Legacy HTTP+SSE transport: the stream is opened with GET /mcp and requests
// are posted to /messages. Kept for mcp-remote's SSE fallback and any client
// already pointed at this endpoint.
async function handleSseStream(req: Request, res: Response): Promise<void> {
  const mmApiKey = (req as any)['mmapikey'] as string | undefined;
  if (!mmApiKey) {
    res.status(400).json(missingApiKeyError);
    return;
  }

  const transport = new SSEServerTransport('/messages', res);
  const server = createMcpServer(mmApiKey);
  const sessionId = transport.sessionId;

  // Cleanup hangs off `res`, not off `transport.onclose`: `connect()` assigns
  // its own `onclose`, so chaining onto it after the await leaves a window in
  // which a client that disconnects mid-connect is never pruned.
  res.on('close', () => {
    if (sseSessions[sessionId]) {
      console.log(`SSE transport closed for session ${sessionId}`);
      delete sseSessions[sessionId];
      void server.close();
    }
  });

  // Registered before connect(): connect() writes the endpoint event carrying
  // this session ID, so the client may POST to /messages immediately after.
  sseSessions[sessionId] = { server, transport, res };
  await server.connect(transport);

  console.log(`Established SSE stream with session ID: ${sessionId}`);
}

// Streamable HTTP transport. POST /mcp with an initialize request opens a
// session; subsequent requests carry it in the mcp-session-id header.
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId) {
      const session = streamableSessions[sessionId];
      if (!session) {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null,
        });
        return;
      }
      session.lastActivity = Date.now();
      // Tracked on the response, not around the await: handleRequest returns
      // once it has dispatched the message, while the tool it triggered runs
      // on and writes to `res` later. Awaiting it therefore says nothing about
      // whether work is still in progress; `res` staying open does.
      session.inFlight += 1;
      res.on('close', () => {
        session.inFlight -= 1;
        session.lastActivity = Date.now();
      });
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    if (!isInitializeRequest(req.body)) {
      res.status(400).json(missingSessionIdError);
      return;
    }

    const mmApiKey = (req as any)['mmapikey'] as string | undefined;
    if (!mmApiKey) {
      res.status(400).json(missingApiKeyError);
      return;
    }

    const server = createMcpServer(mmApiKey);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        console.log(`Established Streamable HTTP session ${newSessionId}`);
        streamableSessions[newSessionId] = {
          server,
          transport,
          lastActivity: Date.now(),
          openStreams: 0,
          inFlight: 0,
        };
      },
    });

    await server.connect(transport);
    // Unlike the SSE path there is no single `res` to hang this off — a
    // Streamable session outlives the request that created it — so chain onto
    // the SDK's `onclose`, which `connect()` has already assigned by now.
    const sdkOnClose = transport.onclose;
    transport.onclose = () => {
      sdkOnClose?.();
      if (transport.sessionId) {
        console.log(`Streamable HTTP session closed: ${transport.sessionId}`);
        delete streamableSessions[transport.sessionId];
      }
    };

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling POST /mcp:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// GET /mcp serves both transports: Streamable HTTP clients identify themselves
// with an mcp-session-id header, everyone else gets a legacy SSE stream.
app.get('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    if (sessionId) {
      const session = streamableSessions[sessionId];
      if (!session) {
        res.status(404).send('Session not found');
        return;
      }
      // While this stream is open the client is demonstrably still there, so
      // the sweeper must leave the session alone however long it stays quiet.
      session.lastActivity = Date.now();
      session.openStreams += 1;
      res.on('close', () => {
        session.openStreams -= 1;
        // Reset the idle clock on the way out so a client that briefly drops
        // and reconnects is not swept in the window before it comes back.
        session.lastActivity = Date.now();
      });

      await session.transport.handleRequest(req, res);
      return;
    }

    console.log('Received GET request to /mcp (establishing SSE stream)');
    await handleSseStream(req, res);
  } catch (error) {
    console.error('Error establishing stream:', error);
    if (!res.headersSent) {
      res.status(500).send('Error establishing stream');
    }
  }
});

// Explicit session teardown for Streamable HTTP clients.
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(400).send('Missing mcp-session-id header');
    return;
  }

  const session = streamableSessions[sessionId];
  if (!session) {
    res.status(404).send('Session not found');
    return;
  }

  try {
    await session.transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling DELETE /mcp:', error);
    if (!res.headersSent) {
      res.status(500).send('Error terminating session');
    }
  }
});

// Messages endpoint for the legacy SSE transport.
app.post('/messages', async (req: Request, res: Response) => {
    console.log('Received POST request to /messages');

    // Extract session ID from URL query parameter
    // In the SSE protocol, this is added by the client based on the endpoint event
    const sessionId = req.query.sessionId as string | undefined;

    if (!sessionId) {
      console.error('No session ID provided in request URL');
      res.status(400).send('Missing sessionId parameter');
      return;
    }

    const session = sseSessions[sessionId];
    if (!session) {
      console.error(`No active transport found for session ID: ${sessionId}`);
      res.status(404).send('Session not found');
      return;
    }
    try {
      // Handle the POST message with the transport
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).send('Error handling request');
      }
    }
  });

app.listen(3000);

// Handle server shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    clearInterval(sweepTimer);

    const sessions = [
      ...Object.entries(sseSessions),
      ...Object.entries(streamableSessions),
    ];

    for (const [sessionId, session] of sessions) {
        console.log(`Closing session ${sessionId}`);
        await closeSession(session);
      }
    console.log('Server shutdown complete');
    process.exit(0);
  });
