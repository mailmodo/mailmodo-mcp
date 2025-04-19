# mailmodo-mcp

This is a TypeScript project that implements a Message Control Protocol (MCP) server for Mailmodo integration with Claude Desktop and other MCP supported client.

## Prerequisites

- Node.js (v20 or higher recommended)
- npm (comes with Node.js)

## Installation

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

## License

[MIT License](LICENSE)
