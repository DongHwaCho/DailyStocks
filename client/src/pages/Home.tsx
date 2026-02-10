import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Calendar, RefreshCcw, TrendingUp } from "lucide-react";

import { useStocks, useAnalyzeStock } from "@/hooks/use-stocks";
import { StockCard } from "@/components/StockCard";
import { StockDetailDialog } from "@/components/StockDetailDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type StockWithNews } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<StockWithNews | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  
  const { data: stocks, isLoading, error, refetch } = useStocks(dateStr);
  const analyzeMutation = useAnalyzeStock();

  const crawlMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stocks/crawl");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      toast({
        title: "업데이트 완료",
        description: `${data.count}개의 종목을 새로 가져왔습니다.`,
      });
    },
    onError: () => {
      toast({
        title: "업데이트 실패",
        description: "데이터를 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const handleAnalyze = (id: number) => {
    analyzeMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "분석 완료",
          description: "AI가 상한가 이유를 요약했습니다.",
        });
      },
      onError: () => {
        toast({
          title: "분석 실패",
          description: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    });
  };

  const handleViewDetails = (stock: StockWithNews) => {
    setSelectedStock(stock);
    setIsDetailOpen(true);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-border/60 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-1">
                <Calendar className="w-4 h-4" />
                {format(today, "yyyy년 MM월 dd일 (EEEE)", { locale: ko })}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                오늘의 급등주 <span className="text-primary"><TrendingUp className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} /></span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                오늘 국내 주식 시장에서 <span className="font-bold text-[#ef4444]">20% 이상</span> 상승한 종목들의 이슈와 이유를 AI가 실시간으로 분석합니다.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => crawlMutation.mutate()} 
                disabled={crawlMutation.isPending}
                className="gap-2 shadow-sm"
              >
                <RefreshCcw className={`w-4 h-4 ${crawlMutation.isPending ? 'animate-spin' : ''}`} />
                데이터 수집 시작
              </Button>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="gap-2 shadow-sm hover:shadow active:scale-95 transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4 p-6 rounded-2xl border bg-white shadow-sm h-80">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <Skeleton className="h-12 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">데이터를 불러오는데 실패했습니다</h3>
            <p className="text-muted-foreground mt-2 mb-6">서버와의 연결 상태를 확인해주세요.</p>
            <Button onClick={() => refetch()}>다시 시도</Button>
          </div>
        ) : stocks && stocks.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            <AnimatePresence>
              {stocks.map((stock) => (
                <StockCard 
                  key={stock.id} 
                  stock={stock} 
                  onAnalyze={handleAnalyze}
                  isAnalyzing={analyzeMutation.isPending && analyzeMutation.variables === stock.id}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-border shadow-sm">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <TrendingUp className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">오늘의 급등 종목이 없습니다</h3>
            <p className="text-muted-foreground mt-2">아직 장이 시작되지 않았거나, 20% 이상 상승한 종목이 없을 수 있습니다.</p>
            <p className="text-sm text-muted-foreground mt-1 text-up">또는 금일 휴장일일 수 있습니다.</p>
          </div>
        )}
      </main>

      <StockDetailDialog 
        stock={selectedStock}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAnalyze={handleAnalyze}
        isAnalyzing={selectedStock ? (analyzeMutation.isPending && analyzeMutation.variables === selectedStock.id) : false}
      />
    </div>
  );
}
