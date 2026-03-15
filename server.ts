import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

function generateCPF() {
  const n = 9;
  const n1 = Math.floor(Math.random() * n);
  const n2 = Math.floor(Math.random() * n);
  const n3 = Math.floor(Math.random() * n);
  const n4 = Math.floor(Math.random() * n);
  const n5 = Math.floor(Math.random() * n);
  const n6 = Math.floor(Math.random() * n);
  const n7 = Math.floor(Math.random() * n);
  const n8 = Math.floor(Math.random() * n);
  const n9 = Math.floor(Math.random() * n);
  
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // API Route for PIX Generation
  const pixHandler = async (req: any, res: any) => {
    console.log(`PIX Request received [${req.method}] to ${req.path}`, req.body);
    try {
      const { amount, name, email, cpf } = req.body;

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const apiKey = process.env.GHOST_PAY_API_KEY;
      const companyId = process.env.GHOST_PAY_COMPANY_ID;
      let apiUrl = process.env.GHOST_PAY_API_URL || "https://api.ghostpay.com.br/v1/pix";
      
      // Ensure URL has protocol
      if (apiUrl && !apiUrl.startsWith('http')) {
        apiUrl = `https://${apiUrl}`;
      }

      console.log("API Key present:", !!apiKey);
      console.log("Company ID present:", !!companyId);
      console.log("API URL being used:", apiUrl);

      if (!apiKey) {
        console.warn("GHOST_PAY_API_KEY is missing - using mock mode");
        const mockAmount = Number(amount) || 0;
        return res.json({
          success: true,
          mock: true,
          qr_code: "00020101021226850014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + mockAmount.toFixed(2) + "5802BR5913GhostPay Demo6008BRASILIA62070503***6304E2CA",
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226850014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405${mockAmount.toFixed(2)}5802BR5913GhostPay Demo6008BRASILIA62070503***6304E2CA`,
          payment_id: "ghost_" + Date.now()
        });
      }

      const headers: any = {
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey, // Added for compatibility with some gateway versions
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      if (companyId) {
        headers["X-Company-Id"] = companyId;
      }

      console.log("Sending request to Ghost Pay...");
      const response = await axios.post(apiUrl, {
        amount: Math.round(Number(amount) * 100),
        name: name || "Doador SOS",
        email: email || "contato@exemplo.com",
        cpf: cpf || generateCPF(),
        description: "Doação SOS Minas Gerais",
        external_id: "order_" + Date.now()
      }, { headers });

      console.log("Ghost Pay Raw Response:", JSON.stringify(response.data, null, 2));

      const data = response.data;
      
      // Extensive normalization to catch any possible field name
      const qrCode = data.qr_code || data.pix_code || data.copy_paste || data.emv || 
                     (data.data && (data.data.qr_code || data.data.pix_code || data.data.emv || data.data.qrcode));
      
      const qrCodeUrl = data.qr_code_url || data.pix_url || data.qrcode_url || data.url ||
                        (data.data && (data.data.qr_code_url || data.data.qrcode_url || data.data.url));

      const paymentId = data.payment_id || data.id || data.transaction_id ||
                        (data.data && (data.data.id || data.data.payment_id));

      if (!qrCode) {
        console.error("PIX Code not found in response structure:", data);
        return res.status(500).json({ 
          error: "API Response Error", 
          details: "A API respondeu, mas o código PIX não foi encontrado no formato esperado.",
          raw: data // This will help us see the real error in the browser console
        });
      }

      res.json({
        qr_code: qrCode,
        qr_code_url: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`,
        payment_id: paymentId
      });
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error("Ghost Pay API Error:", JSON.stringify(errorData, null, 2));
      res.status(500).json({ 
        error: "Ghost Pay API Failure",
        details: typeof errorData === 'object' ? JSON.stringify(errorData) : errorData,
        raw: errorData
      });
    }
  };

  app.post("/api/generate-pix", pixHandler);
  app.post("/api/pix/generate", pixHandler); // Fallback for cached frontend

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
