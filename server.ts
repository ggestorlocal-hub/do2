import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for PIX Generation
  app.post("/api/pix/generate", async (req, res) => {
    try {
      const { amount, name, email, cpf } = req.body;

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const apiKey = process.env.GHOST_PAY_API_KEY;
      const apiUrl = process.env.GHOST_PAY_API_URL || "https://api.ghostpay.com.br/v1/pix";

      if (!apiKey) {
        console.error("GHOST_PAY_API_KEY is missing");
        // For demo purposes, if key is missing, return a mock response
        // but in production this should be an error.
        return res.json({
          success: true,
          mock: true,
          qr_code: "00020101021226850014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + amount.toFixed(2) + "5802BR5913GhostPay Demo6008BRASILIA62070503***6304E2CA",
          qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=mock_pix_payload",
          payment_id: "ghost_" + Date.now()
        });
      }

      // Ghost Pay API Call (Adjust based on actual documentation)
      const response = await axios.post(apiUrl, {
        amount: Math.round(amount * 100), // Many gateways use cents
        name,
        email,
        cpf,
        description: "Doação SOS Minas Gerais",
        external_id: "order_" + Date.now()
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Ghost Pay API Error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to generate PIX",
        details: error.response?.data || error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
