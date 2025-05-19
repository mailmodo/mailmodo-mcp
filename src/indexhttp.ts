import express, { NextFunction, Response, Request } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpServer } from "./server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";


const app = express();
app.use(express.json());

// Map to store transports by session ID
const servers: { [mmApiKey: string]: McpServer } = {};
const transports: Record<string, SSEServerTransport> = {};

const validateMmApiKey = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const mmApiKey = req.headers['authorization'] as string | undefined || req.headers['mmapikey'] as string;
  
    if (!mmApiKey) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid mmApiKey provided',
        },
        id: null,
      });
      return;
    }
    (req as any)['mmapikey'] = mmApiKey.replace("Bearer ", "");
  
    next();
  };

// app.use(validateMmApiKey);

async function getMcpServer(req: Request, transport: Transport){
    let server: McpServer; 
    let mmApiKey = (req as any)['mmapikey'] as string;
  if(!servers[mmApiKey!]){
    const localServer = createMcpServer(mmApiKey!);
    servers[mmApiKey!] = localServer;
  }
  server = servers[mmApiKey!];
  try {
    await server.connect(transport);
  } catch (err) {
    console.error("Ignored error:", err)
  }
  return server;
}


// Reusable handler for GET and DELETE requests
// SSE endpoint for establishing the stream
app.get('/mcp', async (req: Request, res: Response) => {
    console.log('Received GET request to /sse (establishing SSE stream)');
  
    try {
      // Create a new SSE transport for the client
      // The endpoint for POST messages is '/messages'
      const transport = new SSEServerTransport('/messages', res);
  
      // Store the transport by session ID
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;
  
      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        console.log(`SSE transport closed for session ${sessionId}`);
        delete transports[sessionId];
      };
      // Connect the transport to the MCP server
      await getMcpServer(req, transport);
      //await server.connect(transport);
  
      // Start the SSE transport to begin streaming
      // This sends an initial 'endpoint' event with the session ID in the URL
      // await transport.start();
  
      console.log(`Established SSE stream with session ID: ${sessionId}`);
    } catch (error) {
      console.error('Error establishing SSE stream:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE stream');
      }
    }
  });
  
// Messages endpoint for receiving client JSON-RPC requests
app.post('/messages',validateMmApiKey, async (req: Request, res: Response) => {
    console.log('Received POST request to /messages');
  
    // Extract session ID from URL query parameter
    // In the SSE protocol, this is added by the client based on the endpoint event
    const sessionId = req.query.sessionId as string | undefined;
  
    if (!sessionId) {
      console.error('No session ID provided in request URL');
      res.status(400).send('Missing sessionId parameter');
      return;
    }
  
    const transport = transports[sessionId];
    if (!transport) {
      console.error(`No active transport found for session ID: ${sessionId}`);
      res.status(404).send('Session not found');
      return;
    }
  
    try {
      // Handle the POST message with the transport
      await transport.handlePostMessage(req, res, req.body);
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
  
    for (const sessionId in transports) {
        try {
          console.log(`Closing transport for session ${sessionId}`);
          await transports[sessionId].close();
          delete transports[sessionId];
        } catch (error) {
          console.error(`Error closing transport for session ${sessionId}:`, error);
        }
      }
    for await (const server of Object.values(servers)) {
        await server.close();
    }
    console.log('Server shutdown complete');
    process.exit(0);
  });