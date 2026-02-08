import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type StockWithNews } from "@shared/schema";

// GET /api/stocks
export function useStocks(date?: string) {
  return useQuery({
    queryKey: [api.stocks.list.path, date],
    queryFn: async () => {
      const url = date 
        ? buildUrl(api.stocks.list.path) + `?date=${date}`
        : api.stocks.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stocks");
      return api.stocks.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/stocks/:id
export function useStock(id: number) {
  return useQuery({
    queryKey: [api.stocks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.stocks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return api.stocks.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/stocks/:id/analyze
export function useAnalyzeStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.stocks.analyze.path, { id });
      const res = await fetch(url, { 
        method: api.stocks.analyze.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Stock not found");
        throw new Error("Analysis failed");
      }
      return api.stocks.analyze.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the list so the new analysis shows up
      queryClient.invalidateQueries({ queryKey: [api.stocks.list.path] });
      // Also update the specific stock cache if it exists
      queryClient.invalidateQueries({ queryKey: [api.stocks.get.path, data.id] });
    },
  });
}
