# Walrus Sites Deployment Guide

This guide walks you through deploying your React + Vite dApp to Walrus Sites, a decentralized hosting platform using Walrus storage and Sui blockchain.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Viewing Your Site](#viewing-your-site)
- [Troubleshooting](#troubleshooting)
- [Updating Your Site](#updating-your-site)

## Prerequisites

Before deploying, ensure you have:

1. **Sui Wallet configured for testnet**
   - Wallet config located at `~/.sui/sui_config/client.yaml`
   - Wallet set to testnet environment

2. **Testnet SUI tokens**
   - Get from faucet: https://faucet.sui.io/
   - Check balance: `sui client gas`

3. **Bun runtime** (for running local portal)
   - Install: `curl -fsSL https://bun.sh/install | bash`

## Initial Setup

### 1. Install site-builder CLI

Download the site-builder binary for your system:

```bash
# For macOS ARM (M1/M2/M3)
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-macos-arm64 -o site-builder

# For macOS Intel
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-macos-x86_64 -o site-builder

# For Ubuntu
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-ubuntu-x86_64 -o site-builder

# Make it executable
chmod +x site-builder
```

### 2. Download site-builder configuration

```bash
# Create config directory
mkdir -p ~/.config/walrus

# Download testnet config
curl https://raw.githubusercontent.com/MystenLabs/walrus-sites/refs/heads/testnet/sites-config.yaml -o ~/.config/walrus/sites-config.yaml
```

### 3. Get WAL tokens

Walrus requires WAL tokens to store blobs. Exchange SUI for WAL at a 1:1 rate on testnet:

```bash
# Check current WAL balance and system info
walrus info

# Exchange 0.5 SUI for WAL tokens
walrus get-wal
```

**Note**: Storage costs on testnet:
- ~0.02 WAL per epoch for a typical small dApp
- Testnet allows storing for up to 53 epochs ahead
- Each epoch = ~1 day on testnet

## Deployment Process

### Step 1: Build Your Application

Build your React app for production:

```bash
pnpm build
```

This creates a `dist/` directory with your static files (HTML, CSS, JS).

### Step 2: Deploy to Walrus Sites

Deploy your built files to Walrus:

```bash
./site-builder deploy --epochs 10 --ws-resources ./ws-resources.json dist/
```

**Parameters**:
- `--epochs 10`: Store blobs for 10 epochs (~10 days on testnet)
- Maximum: 53 epochs on testnet
- `--ws-resources ./ws-resources.json`: Use the tracked Walrus config file at repo root
- `dist/`: Directory containing your built files

**What happens during deployment**:
1. Parses directory and computes blob IDs locally
2. Uploads files to Walrus storage network
3. Creates/updates Sui smart contract with site metadata
4. Saves site object ID to `ws-resources.json`

**Expected output**:
```
Created new site!
New site object ID: 0x53c001d797363b4049fc44e3d9a2f7c9a6fe2e3adf2fb90545feea716a4c2d87
```

### Step 3: Note Your Site Details

After deployment, save these details:

- **Site Object ID**: Found in `ws-resources.json`
- **Subdomain**: Base36-encoded version of object ID (shown in output)
- **Blob IDs**: Listed for each resource file

## Viewing Your Site

### Option 1: Local Portal (Testnet Only)

Since testnet sites aren't accessible via public portals, run a local portal:

#### First-time Portal Setup

```bash
# Clone Walrus Sites repository
git clone https://github.com/MystenLabs/walrus-sites.git
cd walrus-sites

# Checkout testnet branch
git checkout testnet

# Setup portal
cd portal
cp server/.env.testnet.example server/.env.local
bun install
```

#### Run the Portal

```bash
cd walrus-sites/portal
bun run server
```

The portal runs on `localhost:3000`.

#### Access Your Site

Open in browser:
```
http://[your-subdomain].localhost:3000
```

Example:
```
http://2358rh7i15wua8g62hmj4c2h44o1hmf8d1du9akgc2igg8ofpj.localhost:3000
```

### Option 2: Deploy to Mainnet (Production)

For public access without running a portal:

1. **Switch wallet to mainnet**:
   ```bash
   sui client switch --env mainnet
   ```

2. **Get mainnet SUI and WAL tokens**

3. **Use mainnet site-builder**:
   ```bash
   # Download mainnet binary
   curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-macos-arm64 -o site-builder-mainnet
   chmod +x site-builder-mainnet

   # Deploy (mainnet allows more epochs)
   ./site-builder-mainnet deploy --epochs 365 --ws-resources ./ws-resources.json dist/
   ```

4. **Access via wal.app**:
   ```
   https://[your-subdomain].wal.app
   ```

## Troubleshooting

### "could not find WAL coins with sufficient balance"

**Solution**: Exchange SUI for WAL tokens
```bash
walrus get-wal
```

### "blobs can only be stored for up to 53 epochs ahead"

**Solution**: Reduce epochs to 53 or less on testnet
```bash
./site-builder deploy --epochs 53 --ws-resources ./ws-resources.json dist/
```

### 404 Error When Accessing Site

**Possible causes**:
1. **Blobs not propagated yet**: Wait 2-5 minutes after deployment
2. **Blobs expired**: Redeploy with more epochs
3. **Portal not running**: Ensure `bun run server` is active

**Verify blob exists**:
```bash
# Get blob ID from deployment output
curl -I "https://aggregator.walrus-testnet.walrus.space/v1/[blob-id]"
```

Should return `200 OK`, not `404`.

### Portal Configuration Issues

If portal shows errors, check `.env.local`:

```bash
cat walrus-sites/portal/server/.env.local
```

Ensure these match testnet:
- `AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space`
- `SITE_PACKAGE=0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799`
- `RPC_URL_LIST=https://fullnode.testnet.sui.io`

## Updating Your Site

### Update Existing Site

When `ws-resources.json` includes an `object_id`, updates use the same command:

```bash
# Make changes to your code
# Rebuild
pnpm build

# Deploy (automatically updates existing site)
./site-builder deploy --epochs 10 --ws-resources ./ws-resources.json dist/
```

The site-builder detects the object ID in `ws-resources.json` (passed by `--ws-resources`) and updates instead of creating new.

### Force New Deployment

To create a completely new site:

```bash
# Remove only the "object_id" field from ws-resources.json
# (keep routes/headers/ignore settings)

# Deploy as new
./site-builder deploy --epochs 10 --ws-resources ./ws-resources.json dist/
```

### Update Single Resource

Update just one file without redeploying everything:

```bash
./site-builder update-resource --epochs 10 \
  0x[your-site-object-id] \
  /index.html \
  dist/index.html
```

## Site Management Commands

### View Site Resources

See all files in your deployed site:

```bash
./site-builder sitemap 0x[your-site-object-id]
```

### Convert Object ID to Subdomain

Get the Base36 subdomain from hex object ID:

```bash
./site-builder convert 0x[your-site-object-id]
```

### Destroy Site

Completely remove site and reclaim resources:

```bash
./site-builder destroy 0x[your-site-object-id]
```

**Warning**: This is irreversible and deletes all site data.

## Current Deployment Info

- **Network**: Testnet
- **Site Object ID**: `0x53c001d797363b4049fc44e3d9a2f7c9a6fe2e3adf2fb90545feea716a4c2d87`
- **Subdomain**: `2358rh7i15wua8g62hmj4c2h44o1hmf8d1du9akgc2igg8ofpj`
- **Portal URL**: http://2358rh7i15wua8g62hmj4c2h44o1hmf8d1du9akgc2igg8ofpj.localhost:3000

## Additional Resources

- **Walrus Sites Documentation**: https://docs.wal.app/walrus-sites/intro.html
- **Site Builder Commands**: https://docs.wal.app/walrus-sites/commands.html
- **Walrus GitHub**: https://github.com/MystenLabs/walrus-sites
- **Sui Testnet Faucet**: https://faucet.sui.io/
