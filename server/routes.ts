import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { openai } from "./replit_integrations/audio/client"; // Re-using client from audio integration as it has OpenAI config
// Or better, import from chat/storage if available, but I'll use the one I know is there or direct instantiation if needed.
// Actually, I added the OpenAI integration blueprint, so I can use `openai` from `openai` package directly with env vars.
import OpenAI from "openai";

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.stocks.list.path, async (req, res) => {
    const stocks = await storage.getStocks();
    res.json(stocks);
  });

  app.get(api.stocks.get.path, async (req, res) => {
    const stock = await storage.getStock(Number(req.params.id));
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  });

  app.post(api.stocks.analyze.path, async (req, res) => {
    const id = Number(req.params.id);
    const stock = await storage.getStock(id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    try {
      // Analyze using OpenAI
      const newsTitles = stock.news.map(n => n.title).join("\n");
      const prompt = `
        The following Korean stock "${stock.name}" hit the daily upper limit (+30%).
        Here are recent news headlines about it:
        ${newsTitles}

        Based on these headlines, explain briefly (in 1-2 Korean sentences) why the stock price surged.
        If the headlines are generic, provide a plausible reason based on common market trends (like 'Sector rotation', 'Earnings surprise').
        Output in Korean.
      `;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
      });

      const summary = response.choices[0]?.message?.content || "이유를 분석할 수 없습니다.";
      const updated = await storage.updateStockReason(id, summary);
      res.json(updated);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ message: "AI Analysis failed" });
    }
  });

  // Seed Data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getStocks();
  if (existing.length > 0) return;

  console.log("Seeding database with mock upper limit stocks...");

  // Mock Stock 1: Battery
  const stock1 = await storage.createStock({
    date: new Date().toISOString().split('T')[0],
    symbol: "006400",
    name: "Samsung SDI", // Example big mover
    price: 385000,
    changeRate: "29.85",
    sector: "Batteries",
    marketType: "KOSPI",
    reasonSummary: "", // To be analyzed
  });
  await storage.createNews(stock1.id, { title: "Samsung SDI announces next-gen solid state battery production", url: "#", publisher: "Korea Economic Daily" });
  await storage.createNews(stock1.id, { title: "EV sector rally drives battery stocks up", url: "#", publisher: "Yonhap News" });

  // Mock Stock 2: Bio
  const stock2 = await storage.createStock({
    date: new Date().toISOString().split('T')[0],
    symbol: "068270",
    name: "Celltrion", 
    price: 185000,
    changeRate: "30.00",
    sector: "Biotech",
    marketType: "KOSPI",
    reasonSummary: "",
  });
  await storage.createNews(stock2.id, { title: "FDA approves new biosimilar drug", url: "#", publisher: "Maeil Business" });
  await storage.createNews(stock2.id, { title: "Celltrion earnings surprise in Q4", url: "#", publisher: "Hankyung" });

  // Mock Stock 3: Tech/AI (Small cap)
  const stock3 = await storage.createStock({
    date: new Date().toISOString().split('T')[0],
    symbol: "000660", // Actually SK Hynix but let's pretend it's a smaller supplier for the 'upper limit' narrative or just use a generic name
    name: "Hanmi Semiconductor", 
    price: 62000,
    changeRate: "29.90",
    sector: "Semiconductor",
    marketType: "KOSDAQ",
    reasonSummary: "",
  });
  await storage.createNews(stock3.id, { title: "HBM equipment supply deal with NVIDIA rumored", url: "#", publisher: "Electronic Times" });
  
  console.log("Seeding complete.");
}
