# Dimmlo Web

Monorepo for Dimmlo's main application (marketing site + admin/GTM engine) and client websites.

## Structure

```
dimmlo-web/
├── app/                 # Main application (marketing site + admin/GTM engine)
├── client-sites/        # Client website template + configs
└── scripts/             # Automation scripts (Node.js)
```

## Deployments

- **Main application (marketing site + admin/GTM engine)**: `dimmlo.com` (Vercel)
- **Client sites**: `{client}.dimmlo.com` (Vercel wildcard subdomain)

## Quick Start

### Main application (marketing site + admin/GTM engine)
```bash
cd app
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
