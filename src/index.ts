import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fetchAllTemplates } from "./apicalls/fetchMailmodoTemplates";
import { config } from 'dotenv';
import { z } from "zod";
import { fetchAllCampaigns, fetchCampaignReport } from "./apicalls/fetchMailmodoCampaigns";
import { eventPropertiesSchema } from "./types/addCustomEventsTypes";
import { addMailmodoEvent } from "./apicalls/sendEvents";
import { addContactToList, bulkAddContactToList, deleteContact, getAllContactLists, getContactDetails, removeContactFromList, resubscribeContact, unsubscribeContact } from "./apicalls/contactManagement";
import { contactPropertiesSchema, datetimeSchema, timezoneRegex } from "./types/addContactsTypes";
import { triggerMailmodoCampaign } from "./apicalls/sendCampaign";

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

server.resource(
  "Mailmodo Contact Lists",
  "mailmodo://contact-lists",
  {"mimeType": "application/json"},
  async (uri) => {
    const contactLists = await getAllContactLists();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(contactLists.listDetails)
      }]
    }
  }
);

server.tool(
  "userDetails",
  "Tool to get all details of a contact ",
  {
    email: z.string(),
  },
  async ({ email }) => {
    const details = await getContactDetails(email);
    return{
    content: [{
      type: "text",
      text: JSON.stringify(details)
    }]
  }}
);

server.tool("MailmodoCampainReportTool", "Tool to get the campaign reports for a particular campaign like open, click submission count etc",
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

server.tool("currentDateTime", "Get Current Date and time",
  () => {
    const dateString = new Date().toISOString();
      return {
        content: [{
          type: "text",
          text: dateString,
      }]
    }
  }
);

server.tool(
  "sendEvent",
  "Send custom events with email, event name and event properties",
  {
      email: z.string(),
      event_name: z.string(),
      ts: z.number().optional(),
      event_properties: eventPropertiesSchema.optional(),
  },
  async (params) => {
    try {
      const respone = await addMailmodoEvent(params);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.success?`Successfully sent event '${params.event_name}' for email ${params.email} with payload: ${JSON.stringify(params.event_properties)} with reference id ${respone.ref}`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to send event",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "addContactToList",
  "Add Contact to list ",
  {
      email: z.string(),
      listName: z.string(),
      data: contactPropertiesSchema.optional(),
      created_at: datetimeSchema.optional(),
      last_click: datetimeSchema.optional(),
      last_open: datetimeSchema.optional(),
      timezone: z
        .string()
        .regex(
          timezoneRegex,
          { message: "Must be a valid region-format timezone string" }
        )
        .optional(),
  },
  async (params) => {
    try {
      const respone = await addContactToList(params);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.success?`Successfully added contact '${params.email}' to list ${params.listName} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to send event",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "addBulkContactToList",
  "Add Many Contact to a list in single API",
  {
      listName: z.string(),
      values: z.array(z.object({
        email: z.string(),
        data: contactPropertiesSchema.optional(),
        created_at: datetimeSchema.optional(),
        last_click: datetimeSchema.optional(),
        last_open: datetimeSchema.optional(),
        timezone: z
          .string()
          .regex(
            timezoneRegex,
            { message: "Must be a valid region-format timezone string" }
          )
          .optional(),
      }))
  },
  async (params) => {
    try {
      const respone = await bulkAddContactToList(params);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.listId != '' ?`Successfully added '${params.values.length}' contacts to list ${params.listName} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to send event",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "unsubscribeContact",
  "Unsubscribe or supress contact in mailmodo",
  {
      email: z.string()
  },
  async (params) => {
    try {
      const respone = await unsubscribeContact(params.email);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.success ?`Successfully unsubscribed '${params.email} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to unsubscribe",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "resubscribeContact",
  "Resubscribe contact in mailmodo",
  {
      email: z.string()
  },
  async (params) => {
    try {
      const respone = await resubscribeContact(params.email);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.success ?`Successfully resubscribed '${params.email} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to unsubscribe",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "archiveContact",
  "permanently archive contact in mailmodo",
  {
      email: z.string()
  },
  async (params) => {
    try {
      const respone = await deleteContact(params.email);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.success ?`Successfully deleted '${params.email} with message ${respone.message}`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to delete",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "removeContactFromList",
  "Remove a particular contact from the contact list",
  {
      email: z.string(),
      listName: z.string(),
      
  },
  async (params) => {
    try {
      const respone = await removeContactFromList(params.email, params.listName);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.message ?`Successfully reomved '${params.email} from the list ${params.listName} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to delete",
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "sendEmailToCampaign",
  "Trigger and email for email campaign trigger with personalization parameter added to the email template. ",
  {
    campaignId: z.string().describe('Camapign id of the campaign to be triggered'),
    email: z
      .string()
      .email({ message: "Invalid email address" })
      .describe("Email address of the contact to whom you want to send the email. This is required."),
  
    subject: z
      .string()
      .optional()
      .describe("Optional: Overrides the default subject line provided when creating the campaign."),
  
    replyTo: z
      .string()
      .optional()
      .describe("Optional: Overrides the default reply-to email address for the campaign."),
  
    fromName: z
      .string()
      .optional()
      .describe("Optional: Overrides the sender name for the campaign."),
  
    campaign_data: z
      .record(z.string())
      .optional()
      .describe("Optional: Transient personalization parameters, not stored in the contact profile."),
  
    data: z
      .record(z.string())
      .optional()
      .describe("Optional: Personalization parameters saved to the contact's profile."),
  
    addToList: z
      .string()
      .optional()
      .describe("Optional: List ID to which the contact should be added as part of triggering the campaign."),
  },
  async (params) => {
    try {
      const { campaignId, ...newparams } = params;
      const respone = await triggerMailmodoCampaign(params.campaignId, newparams);
      
      // Here you would typically integrate with your event sending system
      // For example: eventBus.emit(eventName, eventData)
      
      // For demonstration, we'll just return a success message
      return {
        content: [{
          type: "text",
          text: respone.message ?`Successfully sent email to '${params.email} for the campaignId ${params.campaignId} with message ${respone.message}.`: `Something went wrong. Please check if the email is correct`,
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: error instanceof Error ? error.message : "Failed to delete",
        }],
        isError: true
      };
    }
  }
);



// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => {
    //console.log('Server connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect server:', error);
    process.exit(1);
  });
