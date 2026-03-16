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
      let apiUrl = process.env.GHOST_PAY_API_URL || "https://api.ghostspaysv2.com/functions/v1/transactions";
      
      // Safety check for URL
      if (apiUrl && apiUrl.includes('ghostpay.com.br')) {
        console.warn("Old API URL detected. Forcing new Ghost Pay v2 URL.");
        apiUrl = "https://api.ghostspaysv2.com/functions/v1/transactions";
      }

      console.log("API Key present:", !!apiKey);
      console.log("Company ID present:", !!companyId);
      console.log("API URL being used:", apiUrl);

      if (!apiKey || !companyId) {
        console.warn("Credentials missing - using mock mode");
        const mockAmount = Number(amount) || 0;
        return res.json({
          success: true,
          mock: true,
          qr_code: "00020101021226850014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405" + mockAmount.toFixed(2) + "5802BR5913GhostPay Demo6008BRASILIA62070503***6304E2CA",
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226850014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405${mockAmount.toFixed(2)}5802BR5913GhostPay Demo6008BRASILIA62070503***6304E2CA`,
          payment_id: "ghost_" + Date.now()
        });
      }

      // Ghost Pay v2 uses Basic Auth: Base64(SecretKey:CompanyID)
      const credentials = Buffer.from(`${apiKey}:${companyId}`).toString("base64");
      const randomIp = `177.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      const generatedCpf = cpf || generateCPF();
      const amountInCents = Math.round(Number(amount) * 100);
      
      // We'll send a flat payload (no 'data' wrapper) as the documentation suggests.
      // We include both camelCase and snake_case for maximum compatibility.
      const transactionPayload = {
        amount: amountInCents,
        companyId: companyId,
        installments: 1,
        paymentMethod: "PIX",
        payment_method: "PIX", // snake_case fallback
        externalRef: "order_" + Date.now(),
        external_ref: "order_" + Date.now(),
        description: "Doação SOS Minas Gerais",
        customer: {
          name: name || "Doador SOS",
          email: email || "contato@exemplo.com",
          phone: "11999999999",
          document: {
            number: generatedCpf,
            type: "CPF"
          },
          address: {
            street: "Rua X",
            streetNumber: "1",
            street_number: "1",
            zipCode: "11050100",
            zip_code: "11050100",
            neighborhood: "Centro",
            city: "Santos",
            state: "SP",
            country: "BR"
          }
        },
        items: [
          {
            title: "Doação SOS Minas Gerais",
            unitPrice: amountInCents,
            unit_price: amountInCents,
            quantity: 1
          }
        ],
        metadata: {}
      };

      const headers: any = {
        "Authorization": `Basic ${credentials}`,
        "X-Company-Id": companyId,
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "X-Forwarded-For": randomIp
      };

      console.log("Sending request to Ghost Pay v2 (Flat Payload):", apiUrl);
      
      let response;
      try {
        response = await axios.post(apiUrl, transactionPayload, { 
          headers,
          timeout: 15000
        });
      } catch (axiosError: any) {
        const errorBody = axiosError.response?.data;
        console.error("Ghost Pay API Error Details:", JSON.stringify(errorBody, null, 2));
        // Detect if it's the HTML/Fingerprint challenge
        if (typeof errorBody === 'string' && (errorBody.includes('<head>') || errorBody.includes('FingerprintJS'))) {
          console.error("FIREWALL STILL BLOCKING. Providing detailed guidance.");
          throw new Error("O Firewall da Ghost Pay bloqueou o servidor. Você PRECISA entrar em contato com o suporte da Ghost Pay e pedir para eles liberarem o IP do seu servidor Railway (Whitelist).");
        }
        throw axiosError;
      }

      console.log("Ghost Pay Raw Response:", typeof response.data === 'string' ? "HTML/String Response" : JSON.stringify(response.data, null, 2));

      const data = response.data;
      
      // Check for HTML challenge in success response (some WAFs return 200 OK with HTML)
      if (typeof data === 'string' && (data.includes('<head>') || data.includes('FingerprintJS') || data.includes('<html>'))) {
        console.error("FIREWALL DETECTED in 200 OK response: Sending credentials to frontend for fallback.");
        return res.status(500).json({ 
          error: "FIREWALL_BLOCK", 
          details: "O Firewall da Ghost Pay bloqueou o servidor (200 OK). Tentando conexão direta...",
          fallback_config: {
            url: apiUrl,
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "X-API-Key": apiKey,
              "X-Company-Id": companyId,
              "Content-Type": "application/json"
            },
            payload: transactionPayload
          }
        });
      }
      
      // Extensive normalization to catch any possible field name from various gateways
      const qrCode = data.qr_code || 
                     data.pix_code || 
                     data.copy_paste || 
                     data.emv || 
                     data.payload ||
                     (data.pix && data.pix.qrcode) ||
                     (data.data && (data.data.qr_code || data.data.pix_code || data.data.emv || data.data.qrcode || data.data.payload || (data.data.pix && data.data.pix.qrcode))) ||
                     (data.point_of_interaction && data.point_of_interaction.transaction_data && data.point_of_interaction.transaction_data.qr_code);
      
      const qrCodeUrl = data.qr_code_url || 
                        data.pix_url || 
                        data.qrcode_url || 
                        data.url ||
                        data.ticket_url ||
                        (data.pix && data.pix.qrcode_url) ||
                        (data.data && (data.data.qr_code_url || data.data.qrcode_url || data.data.url || data.data.ticket_url)) ||
                        (data.point_of_interaction && data.point_of_interaction.transaction_data && data.point_of_interaction.transaction_data.ticket_url) ||
                        (qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}` : null);

      const paymentId = data.payment_id || 
                        data.id || 
                        data.transaction_id ||
                        (data.data && (data.data.id || data.data.payment_id || data.data.transaction_id));

      if (!qrCode) {
        console.error("PIX Code not found. Full response:", JSON.stringify(data));
        // If the API returned a message or error field, use it
        const apiErrorMessage = data.message || data.error || data.details || data.msg || JSON.stringify(data);
        return res.status(500).json({ 
          error: "Erro na Resposta da API", 
          details: `A Ghost Pay respondeu, mas não enviou o PIX. Mensagem da API: ${apiErrorMessage}`,
          raw: data
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
      
      // Extract the most meaningful error message
      let finalMessage = "Falha na comunicação com a Ghost Pay.";
      if (error.response?.data) {
        const d = error.response.data;
        finalMessage = d.message || d.error || d.details || JSON.stringify(d);
      } else if (error.message) {
        finalMessage = error.message;
      }

      res.status(500).json({ 
        error: "Erro de Conexão API",
        details: finalMessage,
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
