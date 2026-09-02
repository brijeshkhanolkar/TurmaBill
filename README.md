# TurmaBill

TurmaBill is a browser-based billing and inventory system for turmeric traders. It manages farmers, buyers, products, inward (awak) entries, farmer pattis, tax invoices, inventory, and reports.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The production build is written to `dist/`.

## Deploy to Vercel

1. Create a new GitHub repository and push this project to it.
2. In Vercel, select **Add New → Project**, import the repository, and deploy.
3. Keep the detected settings: framework **Vite**, build command `npm run build`, and output directory `dist`.

`vercel.json` includes a single-page-app rewrite, so bookmarked routes such as `/farmer-patti/1` and `/buyer-invoice/1` work after deployment.

## Data and privacy

Data is stored in each browser's IndexedDB database. It persists through refreshes on that device and is not sent to a server. For a shared, multi-device business installation, add authenticated cloud storage before relying on it as the sole system of record.

## Included sample data

The first run includes sample farmers, buyers, products, an awak entry, a farmer patti, and a buyer invoice. The seed process is guarded so React development mode cannot create duplicate samples.
