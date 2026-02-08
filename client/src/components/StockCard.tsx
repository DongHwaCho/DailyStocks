import { motion } from "framer-motion";
import { ArrowUp, Bot, FileText, TrendingUp, Newspaper } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type StockWithNews } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StockCardProps {
  stock: StockWithNews;
  onAnalyze: (id: number) => void;
  isAnalyzing: boolean;
  onViewDetails: (stock: StockWithNews) => void;
}

export function StockCard({ stock, onAnalyze, isAnalyzing, onViewDetails }: StockCardProps) {
  // Format price to KRW format (e.g. 15,300)
  const formattedPrice = new Intl.NumberFormat('ko-KR').format(stock.price);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-5 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn(
                  "font-medium border text-xs px-2 py-0.5",
                  stock.marketType === 'KOSPI' 
                    ? "border-blue-200 text-blue-700 bg-blue-50" 
                    : "border-green-200 text-green-700 bg-green-50"
                )}>
                  {stock.marketType}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{stock.symbol}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => onViewDetails(stock)}>
                {stock.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end text-[#ef4444] font-bold text-lg">
                <ArrowUp className="w-5 h-5 mr-1" strokeWidth={3} />
                {stock.changeRate}%
              </div>
              <div className="text-2xl font-black text-[#ef4444] tracking-tight">
                {formattedPrice} <span className="text-sm font-medium text-muted-foreground">원</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 pt-2">
          <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
              <Bot className="w-4 h-4" />
              <span className="text-sm">AI 상승 요인 분석</span>
            </div>
            
            {stock.reasonSummary ? (
              <p className="text-sm leading-relaxed text-foreground/80 break-keep">
                {stock.reasonSummary}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">아직 분석된 내용이 없습니다.</p>
                <Button 
                  size="sm" 
                  onClick={() => onAnalyze(stock.id)}
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      AI 분석 실행
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Newspaper className="w-3 h-3" />
                <span>관련 뉴스</span>
              </div>
              <span className="text-[10px]">{stock.news.length}건</span>
            </div>
            
            {stock.news.slice(0, 2).map((news) => (
              <a 
                key={news.id} 
                href={news.url} 
                target="_blank" 
                rel="noreferrer"
                className="block text-sm text-foreground/80 hover:text-primary hover:underline truncate transition-colors"
              >
                • {news.title}
              </a>
            ))}
            
            {stock.news.length === 0 && (
              <div className="text-xs text-muted-foreground italic pl-2">관련 뉴스를 찾을 수 없습니다.</div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-3 bg-muted/30 border-t border-border/50 flex justify-between items-center">
          <div className="text-xs text-muted-foreground font-medium">
            {stock.sector || "섹터 정보 없음"}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 hover:text-primary hover:bg-primary/5"
            onClick={() => onViewDetails(stock)}
          >
            자세히 보기 <TrendingUp className="w-3 h-3 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
