# Drifters Local Development

This guide explains how to run the Drifters project locally for development.

## Setup

### Prerequisites

1. You need an Ethereum RPC provider URL to run this project. You can get one from:
   - [Alchemy](https://www.alchemy.com/) (recommended)
   - [Infura](https://infura.io/)
   - Or any other Ethereum node provider

2. Create a `.dev.vars` file in the project root with your RPC URL:
   ```
   ETHEREUM_RPC_URL=https://your-ethereum-rpc-url
   ```

### Starting the Development Environment

The project is configured with multiple development options to suit your workflow:

#### Option 1: Run Everything Together (Recommended)

```bash
# Install dependencies
npm install

# Run both frontend and backend concurrently
npm run dev:all
```

This runs:
- Vite dev server for the frontend at http://localhost:5173 with hot module reloading
- Wrangler Pages dev server for the backend at http://localhost:8788
- Frontend API requests are proxied to the backend automatically

#### Option 2: Run Frontend and Backend Separately

```bash
# In terminal 1 - Run frontend Vite server
npm run dev

# In terminal 2 - Run backend API server
npm run dev:api
```

The frontend will be available at http://localhost:5173 with full hot module reloading support.

#### Option 3: Backend API Only

```bash
# Run only the backend API
npm run dev:api
```

This starts the Cloudflare Pages Functions at http://localhost:8788 with R2 storage and environment variables.

## API Endpoints

The API is available at the following endpoints:

- `/api/ping` - Simple healthcheck endpoint
- `/api/narrative` - Get all drifter narratives
- `/api/narrative/:drifterId` - Get or create a narrative for a specific drifter

## Troubleshooting

### Debugging the Ethereum Provider

If you encounter errors with the Ethereum provider, check the logs for:

1. "ETHEREUM_RPC_URL environment variable is not set" - Make sure you have created a `.dev.vars` file with a valid URL
2. "Failed to connect to Ethereum provider" - The RPC endpoint might be down or restricted
3. "Network error" - Could be CORS or network connectivity issues

### R2 Storage Issues

Local R2 storage is simulated by Wrangler. Data is stored in memory and lost when the server restarts.

### Setting Environment Variables

#### For Local Development

Environment variables for local development are managed through the `.dev.vars` file:

```
ETHEREUM_RPC_URL=https://your-ethereum-rpc-url
```

Any changes to this file require restarting the development servers.

#### For Production

For Cloudflare Pages, you can set environment variables in the Cloudflare dashboard:

1. Go to Workers & Pages > Your Pages project
2. Go to Settings > Environment variables
3. Add variable `ETHEREUM_RPC_URL` with your production Ethereum RPC URL
4. Make sure to set it for the "Production" environment

Alternatively, you can set it using the Wrangler CLI:

```bash
npx wrangler pages secret put ETHEREUM_RPC_URL --project-name drifters
```

You will be prompted to enter the value securely.

### Building for Production

To build the project for production deployment:

```bash
npm run build:all
```

This will:
1. Build the frontend with Vite
2. Copy the Functions to the dist folder for deployment

The `dist` directory will contain everything needed for deployment to Cloudflare Pages.