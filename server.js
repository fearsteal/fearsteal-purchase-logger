import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "20kb" }));
const PORT = Number(process.env.PORT || 3000);

app.get("/", (_req, res) => res.send("FearSteal purchase logger is running."));

app.post("/api/purchase-log", async (req, res) => {
  try {
    const { DISCORD_WEBHOOK_URL, PURCHASE_LOG_SECRET } = process.env;
    if (!DISCORD_WEBHOOK_URL || !PURCHASE_LOG_SECRET)
      return res.status(500).json({ error: "Backend environment is not configured." });

    // Only trusted backend/payment webhook calls should reach this endpoint.
    // Never expose this secret or Discord webhook URL in browser-side HTML/JS.
    if (req.get("x-purchase-log-secret") !== PURCHASE_LOG_SECRET)
      return res.status(401).json({ error: "Unauthorized." });

    const {
      playerName, itemName, price, currency = "USD",
      paymentMethod = "Not specified", transactionId, status = "SUCCESS"
    } = req.body || {};

    if (String(status).toUpperCase() !== "SUCCESS")
      return res.status(400).json({ error: "Only verified successful purchases can be logged." });

    const missing = Object.entries({ playerName, itemName, price, transactionId })
      .filter(([, v]) => v === undefined || v === null || String(v).trim() === "")
      .map(([k]) => k);
    if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });

    const clean = (v, max = 180) => String(v).replace(/[\r\n]/g, " ").slice(0, max);
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0)
      return res.status(400).json({ error: "Price must be a non-negative number." });

    const embed = {
      title: "⚔️ FEARSTEAL | PURCHASE LOG",
      description: "🛒 A verified purchase has been completed!",
      color: 0xF43F5E,
      fields: [
        { name: "👤 Player", value: clean(playerName), inline: true },
        { name: "📦 Item Purchased", value: clean(itemName), inline: true },
        { name: "💰 Price", value: `${amount.toFixed(2)} ${clean(currency, 12)}`, inline: true },
        { name: "💳 Payment Method", value: clean(paymentMethod), inline: true },
        { name: "🟢 Status", value: "Successfully Purchased", inline: true },
        { name: "🆔 Transaction ID", value: clean(transactionId), inline: false },
        { name: "🕒 Time (UTC)", value: new Date().toISOString(), inline: false }
      ],
      footer: { text: "FearSteal Network • Purchase records" }
    };

    const discord = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "FearSteal Purchase Logs", embeds: [embed] })
    });
    if (!discord.ok) {
      console.error("Discord webhook returned", discord.status);
      return res.status(502).json({ error: "Discord delivery failed." });
    }
    return res.json({ ok: true, message: "Purchase log sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => console.log(`FearSteal logger listening on ${PORT}`));
