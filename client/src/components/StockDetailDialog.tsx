import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bot, Calendar, ExternalLink, Tag, TrendingUp, X } from "lucide-react";
import { type StockWithNews } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface StockDetailDialogProps {
  stock: StockWithNews | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: (id: number) => void;
  isAnalyzing: boolean;
}

export function StockDetailDialog({ stock, open, onOpenChange, onAnalyze, isAnalyzing }: StockDetailDialogProps) {
  if (!stock) return null;

  const formattedPrice = new Intl.NumberFormat('ko-KR').format(stock.price);
  const formattedDate = stock.date ? format(new Date(stock.date), "yyyy년 MM월 dd일 (EEE)", { locale: ko }) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur text-xs font-mono">
                  {stock.symbol}
                </Badge>
                <Badge 
                  className={stock.marketType === 'KOSPI' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-green-100 text-green-800 hover:bg-green-200"}
                  variant="secondary"
                >
                  {stock.marketType}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formattedDate}
                </span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-gray-900 mb-1">
                {stock.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-3 h-3" />
                {stock.sector || "섹터 미분류"}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-[#ef4444] font-bold flex items-center justify-end gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-100 mb-2">
                <TrendingUp className="w-4 h-4" />
                상한가 {stock.changeRate}%
              </div>
              <div className="text-4xl font-black text-gray-900 tracking-tighter">
                {formattedPrice}<span className="text-lg font-medium text-gray-500 ml-1">원</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[60vh] md:h-auto md:max-h-[600px] bg-white">
          <div className="p-6 space-y-8">
            {/* AI Analysis Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                  <Bot className="w-5 h-5" />
                  AI 상승 요인 분석
                </h3>
                {!stock.reasonSummary && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAnalyze(stock.id)}
                    disabled={isAnalyzing}
                    className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/5"
                  >
                    {isAnalyzing ? "분석 중..." : "지금 분석하기"}
                  </Button>
                )}
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm">
                {stock.reasonSummary ? (
                  <p className="text-base leading-7 text-slate-700 break-keep font-medium">
                    {stock.reasonSummary}
                  </p>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">아직 AI 분석 결과가 없습니다.</p>
                    <p className="text-xs">뉴스 기사를 바탕으로 상한가 이유를 분석해보세요.</p>
                  </div>
                )}
              </div>
            </section>

            {/* News List Section */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">N</span>
                관련 뉴스 ({stock.news.length})
              </h3>
              
              <div className="grid gap-3">
                {stock.news.map((news) => (
                  <a 
                    key={news.id}
                    href={news.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">
                        {news.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-gray-700">{news.publisher || "언론사"}</span>
                        <span>•</span>
                        <span>{news.publishedAt ? format(new Date(news.publishedAt), "a h:mm", { locale: ko }) : "시간 정보 없음"}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </a>
                ))}
                
                {stock.news.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">관련된 뉴스 기사가 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
