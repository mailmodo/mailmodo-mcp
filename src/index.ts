import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { config } from 'dotenv';
import { createMcpServer } from "./server";

config({ path: `.env` });
// Create an MCP server




// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
const server = createMcpServer(process.env.MAILMODO_API_KEY || '');
server.connect(transport)
  .then(() => {
    //console.log('Server connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect server:', error);
    process.exit(1);
  });
