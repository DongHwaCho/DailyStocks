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
import cron from "node-cron";

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function performCrawlAndAnalyze() {
  try {
    console.log("Starting scheduled crawl process (17:00)...");
    const topStocks = await crawlTopStocks();
    console.log(`Found ${topStocks.length} stocks with 20%+ rise.`);

    for (const stockData of topStocks) {
      // Create or Update Stock
      const stock = await storage.createStock(stockData);
      
      // Crawl News
      const news = await crawlStockNews(stock.name);
      for (const n of news) {
        await storage.createNews(stock.id, n);
      }

      // Automatically perform AI analysis for the new stocks
      const newsTitles = news.map(n => n.title).join("\n");
      if (newsTitles) {
        const prompt = `
          The following Korean stock "${stock.name}" surged by more than 20% today.
          Here are recent news headlines about it:
          ${newsTitles}

          Based on these headlines, explain briefly (in 1-2 Korean sentences) why the stock price surged.
          If the headlines are generic, provide a plausible reason based on common market trends (like 'Sector rotation', 'Earnings surprise').
          Output in Korean.
        `;

        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
        });

        const summary = response.choices[0]?.message?.content || "이유를 분석할 수 없습니다.";
        await storage.updateStockReason(stock.id, summary);
      }
    }
    console.log("Scheduled crawl and analysis completed.");
  } catch (error) {
    console.error("Scheduled crawl process failed:", error);
  }
}

// Schedule task to run at 17:00 (5 PM) KST
// Note: Replit servers usually run in UTC. 17:00 KST is 08:00 UTC.
cron.schedule('0 17 * * 1-5', () => {
  performCrawlAndAnalyze();
}, {
  timezone: "Asia/Seoul"
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

async function crawlTopStocks() {
  try {
    const url = "https://finance.naver.com/sise/sise_upper.naver";
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      responseType: 'arraybuffer'
    });
    
    // Naver Finance uses EUC-KR, so we need to decode it
    const iconv = await import('iconv-lite');
    const decodedData = iconv.decode(Buffer.from(data), 'EUC-KR');
    const $ = cheerio.load(decodedData);
    
    const stocks: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Naver Finance "상한가" page table structure
    // We also want to look at "급등" stocks if possible, but "상한가" page is a good start.
    // For more comprehensive 20%+ stocks, we'd need sise_quant.naver or similar.
    // Let's stick to the current request: 20%+ from top rising.
    
    $("table.type_2 tr").each((i, el) => {
      const name = $(el).find("a.tltle").text().trim();
      if (!name) return;

      const cells = $(el).find("td");
      const priceText = $(cells[2]).text().replace(/,/g, "").trim();
      const changeRateText = $(cells[4]).find("span").text().trim().replace(/%/g, "");
      
      const price = parseInt(priceText);
      const changeRate = parseFloat(changeRateText);
      const symbolMatch = $(el).find("a.tltle").attr("href")?.match(/code=(\d+)/);
      const symbol = symbolMatch ? symbolMatch[1] : "";

      if (changeRate >= 20) {
        stocks.push({
          date: today,
          symbol,
          name,
          price,
          changeRate: changeRate.toString(),
          sector: "Unknown", // Naver doesn't provide sector in this list
          marketType: "KOSPI/KOSDAQ", // Need more logic to distinguish
          reasonSummary: ""
        });
      }
    });

    return stocks;
  } catch (error) {
    console.error("Failed to crawl top stocks:", error);
    return [];
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/stocks/crawl", async (req, res) => {
    try {
      console.log("Starting full crawl process...");
      const topStocks = await crawlTopStocks();
      console.log(`Found ${topStocks.length} stocks with 20%+ rise.`);

      for (const stockData of topStocks) {
        // Create or Update Stock
        const stock = await storage.createStock(stockData);
        
        // Crawl News
        const news = await crawlStockNews(stock.name);
        for (const n of news) {
          await storage.createNews(stock.id, n);
        }
      }

      res.json({ message: "Crawl completed", count: topStocks.length });
    } catch (error) {
      console.error("Crawl process failed:", error);
      res.status(500).json({ message: "Crawl process failed" });
    }
  });

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
        The following Korean stock "${stock!.name}" surged by more than 20% today.
        Here are recent news headlines about it:
        ${newsTitles}

        Based on these headlines, explain briefly (in 1-2 Korean sentences) why the stock price surged.
        If the headlines are generic, provide a plausible reason based on common market trends (like 'Sector rotation', 'Earnings surprise').
        Output in Korean.
      `;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o",
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
