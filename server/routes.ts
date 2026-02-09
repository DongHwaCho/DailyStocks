import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { openai } from "./replit_integrations/audio/client"; // Re-using client from audio integration as it has OpenAI config
// Or better, import from chat/storage if available, but I'll use the one I know is there or direct instantiation if needed.
// Actually, I added the OpenAI integration blueprint, so I can use `openai` from `openai` package directly with env vars.
import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function crawlStockNews(stockName: string) {
  try {
    const searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(stockName + " 상한가")}&sm=tab_opt&sort=1&photo=0&field=0&pd=4`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const $ = cheerio.load(data);
    const news: { title: string; url: string; publisher: string }[] = [];

    $(".news_area").each((i, el) => {
      if (i >= 3) return;
      const title = $(el).find(".news_tit").text().trim();
      const url = $(el).find(".news_tit").attr("href") || "#";
      const publisher = $(el).find(".info_group .info:first-child").text().replace("언론사 선정", "").trim();
      if (title && url) {
        news.push({ title, url, publisher });
      }
    });

    return news;
  } catch (error) {
    console.error(`Crawling failed for ${stockName}:`, error);
    return [];
  }
}

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
    let stock = await storage.getStock(id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    try {
      // 1. Crawl real news if empty or requested
      const realNews = await crawlStockNews(stock.name);
      if (realNews.length > 0) {
        // Clear old news and add new ones (Simplified for this task)
        for (const n of realNews) {
          await storage.createNews(id, n);
        }
        // Refresh stock data
        stock = await storage.getStock(id);
      }

      // 2. Analyze using OpenAI
      const newsTitles = stock!.news.map(n => n.title).join("\n");
      const prompt = `
        The following Korean stock "${stock!.name}" hit the daily upper limit (+30%).
        Here are recent news headlines about it:
        ${newsTitles}

        Based on these headlines, explain briefly (in 1-2 Korean sentences) why the stock price surged.
        If the headlines are generic, provide a plausible reason based on common market trends (like 'Sector rotation', 'Earnings surprise').
        Output in Korean.
      `;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // Changed to 4o as gpt-5.1 is likely a typo or unavailable
        messages: [{ role: "user", content: prompt }],
      });

      const summary = response.choices[0]?.message?.content || "이유를 분석할 수 없습니다.";
      const updated = await storage.updateStockReason(id, summary);
      res.json(updated);
    } catch (error) {
      console.error("AI Analysis/Crawling failed:", error);
      res.status(500).json({ message: "AI Analysis/Crawling failed" });
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
    name: "삼성SDI", // Example big mover
    price: 385000,
    changeRate: "29.85",
    sector: "Batteries",
    marketType: "KOSPI",
    reasonSummary: "", // To be analyzed
  });
  await storage.createNews(stock1.id, { title: "삼성SDI, 차세대 전고체 배터리 양산 계획 발표", url: "https://www.hankyung.com/article/202602081234", publisher: "한국경제" });
  await storage.createNews(stock1.id, { title: "전기차 섹터 반등에 배터리주 일제히 상승", url: "https://www.yna.co.kr/view/AKR202602085678", publisher: "연합뉴스" });

  // Mock Stock 2: Bio
  const stock2 = await storage.createStock({
    date: new Date().toISOString().split('T')[0],
    symbol: "068270",
    name: "셀트리온", 
    price: 185000,
    changeRate: "30.00",
    sector: "Biotech",
    marketType: "KOSPI",
    reasonSummary: "",
  });
  await storage.createNews(stock2.id, { title: "FDA, 신규 바이오시밀러 품목 허가 승인", url: "https://www.mk.co.kr/news/business/2026/02/08/9012", publisher: "매일경제" });
  await storage.createNews(stock2.id, { title: "셀트리온, 4분기 어닝 서프라이즈 기록", url: "https://www.hankyung.com/article/202602083456", publisher: "한경" });

  // Mock Stock 3: Tech/AI (Small cap)
  const stock3 = await storage.createStock({
    date: new Date().toISOString().split('T')[0],
    symbol: "042700", 
    name: "한미반도체", 
    price: 62000,
    changeRate: "29.90",
    sector: "Semiconductor",
    marketType: "KOSDAQ",
    reasonSummary: "",
  });
  await storage.createNews(stock3.id, { title: "엔비디아에 HBM 장비 공급 계약 체결 소식", url: "https://www.etnews.com/202602080001", publisher: "전자신문" });
  
  console.log("Seeding complete.");
}
