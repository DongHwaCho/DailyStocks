import { db } from "./db";
import { upperLimitStocks, newsArticles, type Stock, type News, type StockWithNews, type CreateStockRequest } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getStocks(date?: string): Promise<StockWithNews[]>;
  getStock(id: number): Promise<StockWithNews | undefined>;
  updateStockReason(id: number, reason: string): Promise<Stock>;
  // For seeding/internal use
  createStock(stock: CreateStockRequest): Promise<Stock>;
  createNews(stockId: number, news: { title: string; url: string; publisher: string }): Promise<News>;
}

export class DatabaseStorage implements IStorage {
  async getStocks(date?: string): Promise<StockWithNews[]> {
    const stocks = await db.select().from(upperLimitStocks).orderBy(desc(upperLimitStocks.price));
    // Ideally filter by date if provided, but for MVP/Seed we might just return all valid "latest" ones
    // fetching relations manually or using query builder if configured, but keeping it simple:
    
    const results = await Promise.all(stocks.map(async (stock) => {
      const news = await db.select().from(newsArticles).where(eq(newsArticles.stockId, stock.id));
      return { ...stock, news };
    }));
    
    return results;
  }

  async getStock(id: number): Promise<StockWithNews | undefined> {
    const [stock] = await db.select().from(upperLimitStocks).where(eq(upperLimitStocks.id, id));
    if (!stock) return undefined;
    
    const news = await db.select().from(newsArticles).where(eq(newsArticles.stockId, id));
    return { ...stock, news };
  }

  async updateStockReason(id: number, reason: string): Promise<Stock> {
    const [updated] = await db.update(upperLimitStocks)
      .set({ reasonSummary: reason })
      .where(eq(upperLimitStocks.id, id))
      .returning();
    return updated;
  }

  async createStock(stock: CreateStockRequest): Promise<Stock> {
    const [newStock] = await db.insert(upperLimitStocks).values(stock).returning();
    return newStock;
  }

  async createNews(stockId: number, news: { title: string; url: string; publisher: string }): Promise<News> {
    const [newNews] = await db.insert(newsArticles).values({
      stockId,
      ...news,
      publishedAt: new Date(),
    }).returning();
    return newNews;
  }
}

export const storage = new DatabaseStorage();
