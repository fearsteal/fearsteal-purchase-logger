# FearSteal Discord Purchase Logger

This Node.js service sends a Discord embed for a **verified successful purchase**.

## Setup
1. Install Node.js 20+.
2. Create a Discord `#purchase-logs` channel.
3. In that channel, create a webhook and copy its URL.
4. Copy `.env.example` to `.env`. Add the real webhook URL and a long random `PURCHASE_LOG_SECRET`.
5. Run `npm install`, then `npm start`.
6. Deploy this service to an HTTPS backend host and set the same environment variables there.

## How the notification is triggered
Your trusted store/payment backend must verify the transaction first, then POST to:
`https://YOUR-BACKEND-DOMAIN/api/purchase-log`

Headers:
- `Content-Type: application/json`
- `x-purchase-log-secret: YOUR_PURCHASE_LOG_SECRET`

JSON example:
```json
{
  "playerName": "ExamplePlayer",
  "itemName": "FEARSTEAL Rank",
  "price": 25,
  "currency": "USD",
  "paymentMethod": "PayPal",
  "transactionId": "FS-TRANSACTION-123",
  "status": "SUCCESS"
}
```

Required fields: `playerName`, `itemName`, `price`, `transactionId`.
`status` must be `SUCCESS`.

## Security / production notes
- Do not call this endpoint from the public browser directly.
- Never place the webhook URL or shared secret in `index.html`, GitHub, or client-side JavaScript.
- Connect it to your real payment provider's signed webhook or secure store backend; verify payment there.
- Add transaction-ID deduplication, rate limiting, HTTPS, and monitoring before production.
- This starter does not process payments, grant Minecraft ranks, or independently verify transactions.
