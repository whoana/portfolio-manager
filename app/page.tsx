"use client";

import { useState, useEffect } from "react";
import { Portfolio, PortfolioStock } from "@/app/lib/types";
import {
  getPortfolios,
  savePortfolio,
  deletePortfolio,
  createPortfolio,
} from "@/app/lib/portfolioStorage";
import { useHelp } from "@/app/components/HelpProvider";
import { MAIN_STEPS } from "@/app/lib/helpSteps";
import IntroPage from "@/app/components/IntroPage";
import PortfolioTable from "@/app/components/PortfolioTable";
import AllocationTable from "@/app/components/AllocationTable";
import PortfolioSummary from "@/app/components/PortfolioSummary";
import GrowthReport from "@/app/components/GrowthReport";
import AddStockModal from "@/app/components/AddStockModal";
import BalloonTooltip from "@/app/components/BalloonTooltip";

const DEFAULT_STOCKS: PortfolioStock[] = [
  {
    id: "demo_1",
    category: "배당",
    name: "TIGER 미국배당다우존스",
    code: "458730",
    targetWeight: 0.3,
    dividendRate: 0.035,
    strategy: "미국 배당 성장주 ETF (SCHD 추종)",
    analysis: "안정적인 배당 수익 확보",
    rationale: "장기 배당 성장 이력을 가진 미국 우량주 중심, 월배당",
  },
  {
    id: "demo_2",
    category: "배당",
    name: "TIGER 코리아배당다우존스",
    code: "0052D0",
    targetWeight: 0.15,
    dividendRate: 0.045,
    strategy: "국내 배당 성장주 ETF",
    analysis: "국내 배당 수익 + 원화 자산 비중 확보",
    rationale: "배당 성장 기업 중심으로 안정성과 수익성 균형",
  },
  {
    id: "demo_3",
    category: "고배당",
    name: "KODEX 미국배당커버드콜액티브",
    code: "441640",
    targetWeight: 0.15,
    dividendRate: 0.08,
    strategy: "커버드콜 전략으로 고배당 실현",
    analysis: "월 고배당 현금흐름 창출",
    rationale: "옵션 프리미엄 활용으로 높은 배당수익률 달성",
  },
  {
    id: "demo_4",
    category: "성장",
    name: "KODEX 미국S&P500",
    code: "379800",
    targetWeight: 0.12,
    dividendRate: 0.012,
    strategy: "미국 S&P500 인덱스 추종",
    analysis: "장기 자본 성장",
    rationale: "미국 시장 전반에 노출, 장기 성장 기대",
  },
  {
    id: "demo_5",
    category: "성장",
    name: "TIGER 미국테크TOP10 INDXX",
    code: "381170",
    targetWeight: 0.08,
    dividendRate: 0.003,
    strategy: "미국 빅테크 집중 투자",
    analysis: "고성장 기술주 노출",
    rationale: "AI/기술 섹터 성장 수혜를 위한 집중 투자",
  },
  {
    id: "demo_6",
    category: "안전판",
    name: "KODEX CD금리액티브(합성)",
    code: "459580",
    targetWeight: 0.2,
    dividendRate: 0.035,
    strategy: "CD금리 연동 안전 자산",
    analysis: "자본 보전 + 유동성 확보",
    rationale: "금리 연동 상품으로 하방 리스크 최소화",
  },
];

export default function HomePage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);
  const [showNewPortfolioInput, setShowNewPortfolioInput] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { resetGuide } = useHelp();

  useEffect(() => {
    setMounted(true);
    const stored = getPortfolios();
    if (stored.length > 0) {
      setPortfolios(stored);
      setActiveId(stored[0].id);
    } else {
      // Create default demo portfolio
      const demo = createPortfolio("내 ETF 포트폴리오");
      demo.stocks = DEFAULT_STOCKS;
      demo.investmentAmount = 100000000;
      savePortfolio(demo);
      setPortfolios([demo]);
      setActiveId(demo.id);
    }
  }, []);

  const activePortfolio = portfolios.find((p) => p.id === activeId) || null;

  const updateActive = (updated: Portfolio) => {
    const updatedList = portfolios.map((p) =>
      p.id === updated.id ? updated : p
    );
    setPortfolios(updatedList);
    savePortfolio(updated);
  };

  const handleStocksChange = (stocks: PortfolioStock[]) => {
    if (!activePortfolio) return;
    updateActive({ ...activePortfolio, stocks, updatedAt: new Date().toISOString() });
  };

  const handleAmountChange = (amount: number) => {
    if (!activePortfolio) return;
    updateActive({
      ...activePortfolio,
      investmentAmount: amount,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddStock = (stock: PortfolioStock) => {
    if (!activePortfolio) return;
    handleStocksChange([...activePortfolio.stocks, stock]);
    setShowAddModal(false);
  };

  const handleEditStock = (stock: PortfolioStock) => {
    setEditingStock(stock);
  };

  const handleUpdateStock = (updated: PortfolioStock) => {
    if (!activePortfolio) return;
    handleStocksChange(
      activePortfolio.stocks.map((s) => (s.id === updated.id ? updated : s))
    );
    setEditingStock(null);
  };

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return;
    const p = createPortfolio(newPortfolioName.trim());
    const updated = [...portfolios, p];
    setPortfolios(updated);
    savePortfolio(p);
    setActiveId(p.id);
    setNewPortfolioName("");
    setShowNewPortfolioInput(false);
  };

  const handleDeletePortfolio = (id: string) => {
    if (!confirm("이 포트폴리오를 삭제하시겠습니까?")) return;
    deletePortfolio(id);
    const updated = portfolios.filter((p) => p.id !== id);
    setPortfolios(updated);
    setActiveId(updated.length > 0 ? updated[0].id : null);
  };

  const handleRenamePortfolio = (id: string) => {
    const portfolio = portfolios.find((p) => p.id === id);
    if (!portfolio) return;
    const newName = prompt("새 포트폴리오 이름:", portfolio.name);
    if (newName && newName.trim()) {
      updateActive({ ...portfolio, name: newName.trim() });
    }
  };

  const handleNext = () => {
    setShowIntro(false);
    resetGuide();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showIntro) {
    return <IntroPage onNext={handleNext} />;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-fg sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-badge/20 rounded-lg flex items-center justify-center font-bold text-sm">
                ETF
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">ETF 포트폴리오 매니저</h1>
                <p className="text-xs text-primary-fg-muted/60 leading-tight">
                  종목 검색 - 비중 설정 - 자동 계산 - Excel 내보내기
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Portfolio tabs */}
          <div data-help-step="main-tabs" className="flex items-center gap-2 flex-wrap">
            {portfolios.map((p) => (
              <div key={p.id} className="flex items-center">
                <button
                  onClick={() => setActiveId(p.id)}
                  onDoubleClick={() => handleRenamePortfolio(p.id)}
                  title="더블클릭으로 이름 변경"
                  className={`px-4 py-2 text-xs font-medium rounded-l-lg border transition-colors ${
                    activeId === p.id
                      ? "bg-primary text-primary-fg border-primary"
                      : "bg-card-bg text-muted-foreground border-card-border hover:bg-table-hover"
                  }`}
                >
                  {p.name}
                </button>
                <button
                  onClick={() => handleDeletePortfolio(p.id)}
                  className={`px-2 py-2 text-xs rounded-r-lg border-t border-r border-b transition-colors ${
                    activeId === p.id
                      ? "bg-primary/80 text-primary-fg-muted/60 border-primary hover:text-primary-fg"
                      : "bg-card-bg text-muted border-card-border hover:text-accent-red hover:bg-table-hover"
                  }`}
                  title="삭제"
                >
                  x
                </button>
              </div>
            ))}

            {showNewPortfolioInput ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePortfolio();
                    if (e.key === "Escape") {
                      setShowNewPortfolioInput(false);
                      setNewPortfolioName("");
                    }
                  }}
                  placeholder="포트폴리오 이름"
                  className="px-3 py-2 text-xs border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  onClick={handleCreatePortfolio}
                  className="px-3 py-2 text-xs bg-primary text-primary-fg rounded-lg hover:bg-primary/90"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setShowNewPortfolioInput(false);
                    setNewPortfolioName("");
                  }}
                  className="px-3 py-2 text-xs text-muted-foreground border border-card-border rounded-lg hover:bg-table-hover"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPortfolioInput(true)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground border border-dashed border-input-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                + 새 포트폴리오
              </button>
            )}
          </div>

          {activePortfolio ? (
            <>
              {/* Portfolio composition table */}
              <div data-help-step="main-table">
                <PortfolioTable
                  key={activePortfolio.id}
                  stocks={activePortfolio.stocks}
                  onUpdate={handleStocksChange}
                  onAddClick={() => setShowAddModal(true)}
                  onEditClick={handleEditStock}
                />
              </div>

              {/* Allocation calculation table */}
              <div data-help-step="main-allocation">
                <AllocationTable
                  portfolio={activePortfolio}
                  onInvestmentAmountChange={handleAmountChange}
                />
              </div>

              {/* Summary and export */}
              <div data-help-step="main-summary">
                <PortfolioSummary portfolio={activePortfolio} />
              </div>

              {/* Asset growth forecast report */}
              <div data-help-step="main-growth">
                <GrowthReport portfolio={activePortfolio} />
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-muted">
              <p className="text-sm mb-4">포트폴리오가 없습니다.</p>
              <button
                onClick={() => setShowNewPortfolioInput(true)}
                className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-colors"
              >
                포트폴리오 만들기
              </button>
            </div>
          )}
        </main>

        <footer className="mt-12 py-6 text-center text-xs text-muted border-t border-card-border">
          ETF 포트폴리오 매니저 - 시세는 네이버 증권 기준 (장 마감 후 갱신)
        </footer>
      </div>

      {showAddModal && (
        <AddStockModal
          onAdd={handleAddStock}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingStock && (
        <AddStockModal
          initialStock={editingStock}
          onAdd={handleUpdateStock}
          onClose={() => setEditingStock(null)}
        />
      )}

      <BalloonTooltip steps={MAIN_STEPS} />
    </>
  );
}
