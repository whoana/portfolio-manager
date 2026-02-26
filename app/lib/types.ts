export interface PortfolioStock {
  id: string;
  category: string;       // 구분 (배당, 고배당, 성장, 안전판 등)
  name: string;           // ETF 종목명
  code: string;           // 종목코드
  reutersCode?: string;   // 해외 주식: "AAPL.O", 국내 주식: undefined
  targetWeight: number;   // 목표비중 (0~1)
  dividendRate: number;   // 연배당률 (0~1)
  strategy: string;       // 전략특성
  analysis: string;       // 핵심역할 (종목분석 시트용)
  rationale: string;      // 선정근거 (종목분석 시트용)
  currentPrice?: number;  // 현재가 (API에서 조회)
}

export interface Portfolio {
  id: string;
  name: string;
  stocks: PortfolioStock[];
  investmentAmount: number; // 투자 원금 (원)
  createdAt: string;
  updatedAt: string;
}

export interface StockSearchResult {
  name: string;
  code: string;
  reutersCode?: string;   // 해외 주식: "AAPL.O", 국내 주식: undefined
}

export interface HoldingItem {
  id: string;              // holding_${Date.now()}
  category: string;        // 구분 (배당, 고배당, 성장, 안전판, 채권, 원자재, 기타)
  name: string;            // 종목명
  code: string;            // 종목코드
  reutersCode?: string;    // 해외 주식: "AAPL.O", 국내 주식: undefined
  quantity: number;        // 보유수량
  avgPrice: number;        // 평균매수단가 (원)
  currentPrice?: number;   // 현재가 (API 조회)
}

export interface PortfolioHoldings {
  portfolioId: string;     // Portfolio.id와 매칭
  items: HoldingItem[];
  updatedAt: string;
}

export interface StockCalcResult {
  investAmount: number;
  quantity: number;
  actualAmount: number;
  monthlyDividend: number;
  annualDividend: number;
}
