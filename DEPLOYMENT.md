# Introvee Website Deployment

This folder is a static Cloudflare Pages site.

## Cloudflare Pages

- Project name: `introvee-website`
- Build command: leave empty
- Build output directory: `.`
- Production branch: `main`
- Root directory: repository root for this website repo

The `_redirects` file contains Cloudflare Pages redirects for clean legacy URLs and static page rewrites.

## Custom Domains

Attach both custom domains to the same Cloudflare Pages project:

- `introvee.com`
- `www.introvee.com`

Use a Cloudflare Redirect Rule to make `introvee.com` canonical:

- When hostname equals `www.introvee.com`
- Redirect to `https://introvee.com${uri.path}`
- Status code: `301`
- Preserve query string: enabled

## DNS

Remove old Vercel DNS targets from Cloudflare DNS before attaching the Pages custom domains:

- `A @ 76.76.21.21`
- `CNAME www cname.vercel-dns.com`
- any other record for `@` or `www` that points to Vercel

After Cloudflare Pages custom domains are active, Cloudflare manages the required proxied DNS records. If the dashboard asks for a CNAME target, use the Pages project hostname shown under:

Cloudflare Dashboard -> Workers & Pages -> `introvee-website` -> Custom domains.
