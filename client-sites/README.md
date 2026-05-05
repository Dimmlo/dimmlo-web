# Dimmlo Client Sites

Template-based static site generator for client websites.

## How It Works

1. **Template** (`_template/`) contains the base HTML/CSS/JS
2. **Client configs** (`clients/{name}/config.json`) override with branding/content
3. **Build script** merges template + config → static HTML in `build/` directory
4. **Vercel** serves each client at `{clientname}.dimmlo.com`

## Adding a New Client

```bash
# 1. Create client folder
mkdir clients/newclient

# 2. Create config.json (copy from existing client)
cp clients/cafecolmado/config.json clients/newclient/config.json

# 3. Edit config with client details
nano clients/newclient/config.json

# 4. Build
npm run build

# 5. Deploy (automatic via Vercel webhook, or manual)
npm run deploy
```

## Config File Structure

```json
{
  "businessName": "Client Name",
  "tagline": "Short tagline",
  "description": "Meta description for SEO",
  "phone": "(555) 123-4567",
  "email": "hello@client.com",
  "address": "123 Main St, City, State ZIP",
  "heroImage": "https://...",
  "aboutText": "About the business...",
  "hours": {
    "Monday": "9:00 AM - 5:00 PM",
    ...
  },
  "colors": {
    "primary": "#267D85",
    "secondary": "#1F2124"
  },
  "galleryImages": [],
  "social": {
    "instagram": "@handle",
    "facebook": "pagename"
  }
}
```

## Template Modification

Edit files in `_template/` to change design for ALL clients.
Always test with existing clients before deploying template changes.

## Dynamic Content (Gallery)

Gallery images are loaded from `config.json` at runtime.
Update `config.galleryImages` array via your automation scripts when client sends WhatsApp messages.

## Deployment

### Vercel Setup
1. Connect this repo to Vercel
2. Set build settings:
   - Build Command: `node build.js`
   - Output Directory: `build`
3. Configure wildcard domain: `*.dimmlo.com`
4. Each client gets subdomain automatically

### Manual Build
```bash
npm run build
```

Outputs to `build/{clientname}/index.html`
