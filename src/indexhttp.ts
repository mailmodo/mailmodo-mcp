import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server";


const app = express();
app.use(express.json());

// Map to store transports by session ID
const servers: { [mmApiKey: string]: McpServer } = {};
const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // set to undefined for stateless servers
});

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  const mmApiKey = req.headers['mmApiKey'] as string | undefined;
  if(!mmApiKey){
    res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid mmApiKey provided',
        },
        id: null,
      });
  }
  let server: McpServer; 
  if(!servers[mmApiKey!]){
    const localServer = createMcpServer(mmApiKey!);
    servers[mmApiKey!] = localServer;
    await localServer.connect(transport);
  }
  server = servers[mmApiKey!];
  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3000);

// Handle server shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
  
    await transport.close();
    for await (const server of Object.values(servers)) {
        await server.close();
    }
    console.log('Server shutdown complete');
    process.exit(0);
  });