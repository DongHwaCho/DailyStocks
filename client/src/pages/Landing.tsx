import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">DailyStocks</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>대시보드 미리보기</Button>
          <Button onClick={() => setLocation("/dashboard")} className="rounded-full px-6">로그인</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Zap className="w-4 h-4 fill-current" />
            <span>AI 기반 실시간 시장 분석 플랫폼</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            급등주의 이유를<br />
            <span className="text-primary italic">가장 명확하게</span> 분석합니다
          </h1>
          <p className="text-xl text-slate-500 mb-10 leading-relaxed">
            매일 쏟아지는 수많은 정보 속에서 당신이 필요한 핵심만 짚어드립니다.
            네이버 금융 기반 실시간 데이터와 AI 분석으로 시장의 흐름을 한눈에 파악하세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => setLocation("/dashboard")} className="h-14 px-8 text-lg rounded-full gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              지금 시작하기 <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/dashboard")} className="h-14 px-8 text-lg rounded-full w-full sm:w-auto bg-white/50 backdrop-blur-sm">
              서비스 둘러보기
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">실시간 수집</h3>
            <p className="text-slate-500">네이버 금융의 데이터를 바탕으로 20% 이상 상승한 종목을 실시간으로 포착합니다.</p>
          </div>
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI 인사이트</h3>
            <p className="text-slate-500">관련 뉴스를 크롤링하여 상승 원인을 GPT-4o가 명확한 문장으로 요약해드립니다.</p>
          </div>
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">데일리 자동화</h3>
            <p className="text-slate-500">장 마감 후 매일 오후 5시, 당신을 위해 준비된 시장 분석 리포트가 자동으로 생성됩니다.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>© 2026 DailyStocks. All rights reserved.</p>
      </footer>
    </div>
  );
}
