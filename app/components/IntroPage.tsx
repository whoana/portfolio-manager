"use client";

import Image from "next/image";
import BalloonTooltip from "./BalloonTooltip";
import { INTRO_STEPS } from "@/app/lib/helpSteps";

interface IntroPageProps {
  onNext: () => void;
}

const COMPOUND_DATA = [
  { year: 10, amount: "1억 6,289만원", growth: "+63%" },
  { year: 20, amount: "2억 6,533만원", growth: "+165%" },
  { year: 30, amount: "4억 3,219만원", growth: "+332%" },
];

const CARDS = [
  {
    icon: "📈",
    title: "복리의 힘",
    description:
      "아인슈타인이 '세계 8번째 불가사의'라 불렀던 복리. 수익이 다시 수익을 만들어내는 눈덩이 효과로 자산이 기하급수적으로 성장합니다.",
  },
  {
    icon: "⏳",
    title: "시간이 가장 큰 자산",
    description:
      "복리의 진정한 마법은 시간이 만듭니다. 10년보다 20년, 20년보다 30년. 일찍 시작할수록 시간이 당신의 편에서 일합니다.",
  },
  {
    icon: "🎯",
    title: "체계적인 포트폴리오 관리",
    description:
      "목표 비중에 맞춘 분산 투자, 배당 재투자, 정기 리밸런싱. 체계적 관리가 장기 수익률의 핵심입니다.",
  },
];

export default function IntroPage({ onNext }: IntroPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-fadeIn">
      {/* Header — Toss style clean on mobile, colored on desktop */}
      <header>
        {/* Desktop header */}
        <div className="hidden sm:block bg-primary text-primary-fg">
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 shadow-lg">
              <Image src="/logo.jpg" alt="ETF 포트폴리오 매니저" width={96} height={96} className="w-full h-full object-cover mix-blend-multiply" priority />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              복리의 마법, 장기 투자의 힘
            </h1>
            <p className="text-primary-fg-muted/70 text-base leading-relaxed">
              작은 시작이 큰 자산으로. 시간과 복리가 만들어내는 놀라운 성장을
              경험하세요.
            </p>
          </div>
        </div>
        {/* Mobile header — Toss style */}
        <div className="sm:hidden bg-card-bg px-5 pt-12 pb-8 text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-5 shadow-sm">
            <Image src="/logo.jpg" alt="ETF 포트폴리오 매니저" width={80} height={80} className="w-full h-full object-cover mix-blend-multiply" priority />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            복리의 마법
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            작은 시작이 큰 자산으로.<br />
            시간과 복리가 만드는 놀라운 성장
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-8">
        {/* 3 Cards — vertical on mobile */}
        <section data-help-step="intro-cards" className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-card-bg rounded-2xl sm:rounded-xl sm:border border-card-border p-5 shadow-sm sm:shadow-none"
            >
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-[15px] sm:text-sm mb-2 text-foreground">
                {card.title}
              </h3>
              <p className="text-sm sm:text-xs text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        {/* Compound interest simulation */}
        <section data-help-step="intro-simulation" className="bg-card-bg rounded-2xl sm:rounded-xl sm:border border-card-border p-5 shadow-sm sm:shadow-none">
          <h2 className="font-bold text-[15px] sm:text-sm mb-1 text-foreground">
            복리 시뮬레이션
          </h2>
          <p className="text-xs text-muted mb-4">
            1억원을 연 5% 복리로 투자했을 때
          </p>
          <div className="grid grid-cols-3 gap-3">
            {COMPOUND_DATA.map((d) => (
              <div
                key={d.year}
                className="text-center bg-table-hover rounded-xl sm:rounded-lg py-4 px-2"
              >
                <div className="text-xs text-muted mb-1">{d.year}년 후</div>
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

        {/* CTA — Toss BottomCTA style on mobile */}
        <div data-help-step="intro-cta" className="text-center pt-2 pb-8 sm:pb-8">
          <button
            onClick={onNext}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-primary text-primary-fg rounded-xl sm:rounded-lg font-bold sm:font-medium text-base sm:text-sm hover:bg-primary/90 transition-colors"
          >
            포트폴리오 시작하기
          </button>
          <p className="text-xs text-muted mt-3">
            ETF 포트폴리오를 구성하고 장기 성장을 시뮬레이션하세요
          </p>
        </div>
      </main>

      <BalloonTooltip steps={INTRO_STEPS} />
    </div>
  );
}
