# Maharashtra Distributors — V2

Static billing / stock / customer-ledger web app.

Files:
- index.html
- style.css
- app.js
- wrangler.jsonc

Cloudflare Workers Static Assets is configured to serve the project root.
The app stores data in the browser's localStorage; it is not a cloud database.

For a Cloudflare Workers deployment using the repository, the recommended deploy command is:
npx wrangler deploy

Cloudflare documents the `assets.directory` setting for serving static HTML/CSS/JS through Workers.
