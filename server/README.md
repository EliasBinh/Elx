# 🌐 Elx Global Edge Gateway

Production-grade serverless audio stream resolving & edge caching gateway for the Elx Music streaming client.

## Features
- **Global Edge Caching**: 20ms response time served across 300+ cities via Cloudflare Edge / V8 isolate runtime.
- **5.5-Hour Audio Stream Cache**: YouTube stream URLs are cached at the edge, reducing upstream requests by 95%.
- **Bypass Anti-Bot & Rate Limits**: Mobile devices query the Edge Gateway; requests never get blocked by mobile carrier IP limits.
- **Multi-Client Failover**: InnerTube Android Music + iOS client fallback.

## 🚀 1-Click Deployment (Cloudflare Workers - Free Tier)

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to your free Cloudflare account:
   ```bash
   wrangler login
   ```

3. Deploy in 10 seconds:
   ```bash
   wrangler deploy
   ```

4. You will get a live URL such as `https://elx-edge-gateway.<your-subdomain>.workers.dev`.
   Add this URL to `src/constants/config.ts` under `EDGE_GATEWAY_URL`.
