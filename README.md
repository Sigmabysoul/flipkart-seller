# Ecommerce Label, Printing, and Stock Manager

This Next.js application receives Flipkart, Meesho, Myntra, Amazon, and Snapdeal label PDFs, routes them into marketplace sections, extracts AWBs and SKUs, crops and sorts labels, calculates product quantities, updates stock, and manages printing.

## Local setup

1. Copy `.env.example` to `.env.local` and set secrets.
2. Run `npm install` and `npm run dev`.
3. Open Settings to configure daily collection times.
4. Open `/readiness` to see every missing deployment dependency.

## Automated intake

The deployed cron calls `/cron/ingestion` every five minutes. Each enabled marketplace runs after its configured Asia/Kolkata time. Marketplace feed endpoints can return either one PDF response or a JSON list of base64 PDFs.

Alternatively, a marketplace or middleware can send labels to `/ingestion/webhook/{marketplace}` using `Authorization: Bearer $INGESTION_WEBHOOK_SECRET`. Multipart files, direct PDF bodies, and base64 JSON are supported.

## Printing

Browser printing creates an auditable opened job. Operators confirm physical printing from Settings. An unattended printer agent can poll `/print-jobs?status=queued`, claim a job, download its `pdf_url`, and complete or fail the job through `/print-jobs/{id}` using `PRINT_AGENT_TOKEN`.

## Production checklist

- Mount `LABEL_MANAGER_DATA_DIR` on persistent storage.
- Set `CRON_SECRET`, `INGESTION_WEBHOOK_SECRET`, and `PRINT_AGENT_TOKEN`.
- Configure the five marketplace feed URLs and tokens.
- Configure real SKU mappings and opening stock.
- Run `npm run lint` and `npm run build`.
- Confirm `/readiness` reports `ready`.

The application must not be considered fully automated until `/readiness` reports no blockers.
