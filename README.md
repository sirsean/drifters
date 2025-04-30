# Drifters

This site is for looking at your nice Fringe Drifters, but in a prettier
interface than you get from the marketplaces that are trying to sell them.

## Run Locally

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

```bash
# Install dependencies
npm install

# Run both frontend and backend concurrently
npm run dev:all
```

This will start:
- Vite development server (frontend) at http://localhost:5173 with hot module reloading
- Cloudflare Pages development server (backend API) at http://localhost:8788

Alternatively, you can run them separately:

```bash
# Run only the frontend (Vite)
npm run dev

# Run only the backend API (Cloudflare Pages Functions)
npm run dev:api
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development instructions.

## Deployment

This project is deployed to Cloudflare Pages which automatically deploys when changes are pushed to the main branch.

Make sure to set the `ETHEREUM_RPC_URL` environment variable in your Cloudflare Pages project settings.

## Download Metadata & Images

If you need to refresh the metadata JSON and the drifter images, you can
use this handy script to fetch them all. It helpfully downscales the images,
which are quite large, so they'll be faster to load in the browser.

```bash
node src/scripts/downloader.js
```