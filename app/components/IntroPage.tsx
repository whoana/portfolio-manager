"use client";

import BalloonTooltip from "./BalloonTooltip";
import InvestmentCards from "./InvestmentCards";
import { INTRO_STEPS } from "@/app/lib/helpSteps";

interface IntroPageProps {
  onNext: () => void;
}

const COMPOUND_DATA = [
  { year: 10, amount: "1억 2,969만원", growth: "+159%" },
  { year: 20, amount: "3억 3,637만원", growth: "+573%" },
  { year: 30, amount: "8억 7,247만원", growth: "+1,645%" },
];

export default function IntroPage({ onNext }: IntroPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-fadeIn">
      {/* Investment Cards Hero */}
      <InvestmentCards />

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-8">
        {/* Compound interest simulation */}
        <section data-help-step="intro-simulation" className="bg-card-bg rounded-2xl sm:rounded-xl sm:border border-card-border p-5 shadow-sm sm:shadow-none">
          <h2 className="font-bold text-[15px] sm:text-sm mb-1 text-foreground">
            복리 시뮬레이션
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            5,000만원을 연 10%(배당 재투자) 복리로 투자했을 때
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COMPOUND_DATA.map((d) => (
              <div
                key={d.year}
                className="text-center bg-table-hover rounded-xl sm:rounded-lg py-4 px-2"
              >
                <div className="text-xs text-muted-foreground mb-1">{d.year}년 후</div>
                <div className="font-bold text-sm text-foreground">
                  {d.amount}
                </div>
                <div className="text-xs text-primary font-medium mt-1">
                  {d.growth}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div data-help-step="intro-cta" className="text-center pt-2 pb-8 sm:pb-8">
          <button
            onClick={onNext}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-primary text-primary-fg rounded-xl sm:rounded-lg font-bold sm:font-medium text-base sm:text-sm hover:bg-primary/90 transition-colors"
          >
            포트폴리오 시작하기
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            ETF 포트폴리오를 구성하고 장기 성장을 시뮬레이션하세요
          </p>
        </div>
      </main>

      <BalloonTooltip steps={INTRO_STEPS} />
    </div>
  );
}
