import { z } from 'zod';
import { insertStockSchema, upperLimitStocks, newsArticles } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  stocks: {
    list: {
      method: 'GET' as const,
      path: '/api/stocks' as const,
      input: z.object({
        date: z.string().optional(), // YYYY-MM-DD
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof upperLimitStocks.$inferSelect & { news: typeof newsArticles.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/stocks/:id' as const,
      responses: {
        200: z.custom<typeof upperLimitStocks.$inferSelect & { news: typeof newsArticles.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/stocks/:id/analyze' as const,
      responses: {
        200: z.custom<typeof upperLimitStocks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
