# Dimmlo Web

Monorepo for Dimmlo's marketing site and client websites.

## Structure

```
dimmlo-web/
├── marketing-site/      # Main dimmlo.com website
├── client-sites/        # Client website template + configs
└── scripts/            # Automation scripts (Node.js)
```

## Deployments

- **Marketing site**: `dimmlo.com` (Vercel)
- **Client sites**: `{client}.dimmlo.com` (Vercel wildcard subdomain)

## Quick Start

### Marketing Site
```bash
cd marketing-site
# Open index.html or deploy to Vercel
```

### Client Sites
```bash
cd client-sites
npm install
npm run build
# Deploys all client sites to Vercel
```

### Automation Scripts
```bash
cd scripts
npm install
# Run individual scripts as needed
```

## Adding a New Client

1. Create folder: `client-sites/clients/{clientname}/`
2. Add `config.json` with client branding
3. Deploy: Vercel automatically picks it up

## Development

- Keep the template generic
- Client-specific changes go in their config.json only
- Test template changes with existing clients before deploying
