import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fetchAllTemplates } from "./apicalls/fetchMailmodoTemplates";
import { config } from 'dotenv';
import { z } from "zod";
import { fetchAllCampaigns, fetchCampaignReport } from "./apicalls/fetchMailmodoCampaigns";

config({ path: `.env` });
// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});


// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

server.resource(
  "Mailmodo Templates",
  "mailmodo://templates",
  {"mimeType": "application/json"},
  async (uri) => {
    const templates = await fetchAllTemplates();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(templates.templateDetails)
      }]
    }
  }
);

server.resource(
  "Mailmodo Campaigns",
  "mailmodo://campaigns",
  {"mimeType": "application/json"},
  async (uri) => {
    const campaigns = await fetchAllCampaigns();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(campaigns.campaigns)
      }]
    }
  }
);

server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);
server.tool("Get Campaign Report for a campaign",
  {
    campaignId: z.string().uuid(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'fromDate must be in YYYY-MM-DD format',
    }),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'toDate must be in YYYY-MM-DD format',
    }),
  },
  async ({ campaignId, fromDate, toDate  }) => {
    const campaigns = await fetchCampaignReport(campaignId,fromDate,toDate);
    return {
      content: [{
        type: "text",
        text: campaigns.success? JSON.stringify(campaigns.data): "Something went wrong. Please check if correct campaign ID is being passed"
      }]
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => {
    console.log('Server connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect server:', error);
    process.exit(1);
  });
