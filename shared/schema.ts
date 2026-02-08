import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const upperLimitStocks = pgTable("upper_limit_stocks", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // YYYY-MM-DD
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Current price in KRW
  changeRate: numeric("change_rate", { precision: 5, scale: 2 }).default("30.00"),
  sector: text("sector"),
  reasonSummary: text("reason_summary"), // AI generated summary
  marketType: text("market_type").notNull(), // 'KOSPI' or 'KOSDAQ'
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").references(() => upperLimitStocks.id).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publisher: text("publisher"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const upperLimitStocksRelations = relations(upperLimitStocks, ({ many }) => ({
  news: many(newsArticles),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  stock: one(upperLimitStocks, {
    fields: [newsArticles.stockId],
    references: [upperLimitStocks.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertStockSchema = createInsertSchema(upperLimitStocks).omit({ id: true, createdAt: true });
export const insertNewsSchema = createInsertSchema(newsArticles).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Stock = typeof upperLimitStocks.$inferSelect;
export type News = typeof newsArticles.$inferSelect;

export type StockWithNews = Stock & { news: News[] };

export type CreateStockRequest = z.infer<typeof insertStockSchema>;
export type CreateNewsRequest = z.infer<typeof insertNewsSchema>;

export type AnalyzeStockRequest = { stockId: number };
