# mailmodo-mcp

[![smithery badge](https://smithery.ai/badge/@mailmodo/mailmodo-mcp)](https://smithery.ai/server/@mailmodo/mailmodo-mcp)

This is a TypeScript project that implements a Message Control Protocol (MCP) server for Mailmodo integration with Claude Desktop and other MCP supported client.

## Prerequisites

- Node.js (v20 or higher recommended)
- npm (comes with Node.js)

## Installation

### Installing via Smithery

To install Mailmodo Integration Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@mailmodo/mailmodo-mcp):

```bash
npx -y @smithery/cli install @mailmodo/mailmodo-mcp --client claude
```

### Manual Installation
1. Clone the repository:
```bash
git clone https://github.com/mailmodo/mailmodo-mcp.git
cd mailmodo-mcp
```

2. Install dependencies:
```bash
npm install
```

## Building the Project

To compile the TypeScript code to JavaScript, run:
```bash
npm run build
```

This will create a `dist` directory containing the compiled JavaScript files.

## Running the Project

After building, you can run the project using:
```bash
node dist/index.js
```

Or use the npm script:
```bash
npm start
```

## Claude Desktop Configuration

### Local Run from Code

To configure this project with Claude Desktop, add the following configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "mailmodo": {
      "command": "node",
      "args": [
        "/path/to/your/mailmodo-mcp/dist/index.js"
      ]
    }
  }
}
```

### Run from docker image 

```json
{
  "mcpServers": {
    "mailmodo": {
      "command": "docker",
      "args": [
        "run",
        "--platform", 
        "linux/amd64",
        "-i",
        "--rm",
        "-e",
        "MAILMODO_API_KEY",
        "avneesh001/mailmodo-mcp"
      ],
      "env": {
        "MAILMODO_API_KEY": "<GET MAILMODO KEY from https://manage.mailmodo.com/app/settings/apikey and insert here>"
      }
    }
  }
}
```

### Run from npx


```json
{
  "mcpServers": {
    "mailmodo": {
      "command": "npx",
      "args": [
        "-y",
        "@mailmodo/mcp"
      ],
      "env": {
        "MAILMODO_API_KEY": "<GET MAILMODO KEY from https://manage.mailmodo.com/app/settings/apikey and insert here>"
      }
    }
  }
}
```

### Connect via Remote Server 
```json
{
  "mcpServers": {
    "mailmodo": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.app.mailmodo.com/mcp",
        "--header",
        "mmApiKey:${MAILMODO_API_KEY}"
      ],
      "env": {
        "MAILMODO_API_KEY": "<GET MAILMODO KEY from https://manage.mailmodo.com/app/settings/apikey and insert here>"
      }
    }
  }
}
```

Make sure to adjust the file path in the `args` array to match your local project directory.

## Development

To run the project in development mode with automatic recompilation:

1. Install `ts-node` and `nodemon` as dev dependencies:
```bash
npm install --save-dev ts-node nodemon
```

2. Add a dev script to your package.json:
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

3. Run the development server:
```bash
npm run dev
```

## Project Structure

```
mailmodo-mcp/
├── src/             # TypeScript source files
├── dist/            # Compiled JavaScript files
├── package.json     # Project dependencies and scripts
└── tsconfig.json    # TypeScript configuration
```

## Tools and Resources

The Mailmodo MCP server provides several tools and resources for interacting with Mailmodo's functionality. Here's a comprehensive list:

### Resources

1. **Mailmodo Templates** (`mailmodo://templates`)
   - Returns a list of all available email templates in JSON format
   - MIME Type: application/json

2. **Mailmodo Campaigns** (`mailmodo://campaigns`)
   - Returns a list of all campaigns in JSON format
   - MIME Type: application/json

3. **Mailmodo Contact Lists** (`mailmodo://contact-lists`)
   - Returns all contact lists in JSON format
   - MIME Type: application/json

### Tools

1. **User Details**
   - Name: `userDetails`
   - Description: Get all details of a contact
   - Parameters:
     - `email` (string): Email address of the contact

2. **Campaign Report Tool**
   - Name: `MailmodoCampainReportTool`
   - Description: Get campaign reports including open, click, and submission counts
   - Parameters:
     - `campaignId` (UUID): ID of the campaign
     - `fromDate` (YYYY-MM-DD): Start date for the report
     - `toDate` (YYYY-MM-DD): End date for the report

3. **Current DateTime**
   - Name: `currentDateTime`
   - Description: Get current date and time
   - Parameters: None

4. **Send Event**
   - Name: `sendEvent`
   - Description: Send custom events with email and event properties
   - Parameters:
     - `email` (string): Contact's email address
     - `event_name` (string): Name of the event
     - `ts` (number, optional): Timestamp
     - `event_properties` (object, optional): Additional event properties

5. **Contact List Management**
   - **Add Contact to List**
     - Name: `addContactToList`
     - Description: Add a single contact to a list
     - Parameters:
       - `email` (string): Contact's email
       - `listName` (string): Name of the list
       - `data` (object, optional): Contact properties
       - Various optional fields for contact metadata

   - **Bulk Add Contacts**
     - Name: `addBulkContactToList`
     - Description: Add multiple contacts to a list in a single operation
     - Parameters:
       - `listName` (string): Name of the list
       - `values` (array): Array of contact objects

   - **Remove Contact from List**
     - Name: `removeContactFromList`
     - Description: Remove a contact from a specific list
     - Parameters:
       - `email` (string): Contact's email
       - `listName` (string): Name of the list

6. **Contact Status Management**
   - **Unsubscribe Contact**
     - Name: `unsubscribeContact`
     - Description: Unsubscribe or suppress a contact
     - Parameters:
       - `email` (string): Contact's email

   - **Resubscribe Contact**
     - Name: `resubscribeContact`
     - Description: Resubscribe a previously unsubscribed contact
     - Parameters:
       - `email` (string): Contact's email

   - **Archive Contact**
     - Name: `archiveContact`
     - Description: Permanently archive a contact
     - Parameters:
       - `email` (string): Contact's email

7. **Campaign Management**
   - **Send Email Campaign**
     - Name: `sendEmailToCampaign`
     - Description: Trigger an email campaign with personalization
     - Parameters:
       - `campaignId` (string): Campaign ID
       - `email` (string): Recipient's email
       - Various optional parameters for customization

   - **Broadcast Campaign**
     - Name: `broadcastCampaignToList`
     - Description: Trigger campaigns to an entire contact list
     - Parameters:
       - `campaignId` (string): Campaign ID
       - `listId` (string): Target list ID
       - Optional parameters for campaign customization

## License

[MIT License](LICENSE)
