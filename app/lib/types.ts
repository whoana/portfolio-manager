export interface PortfolioStock {
  id: string;
  category: string;       // 구분 (배당, 고배당, 성장, 안전판 등)
  name: string;           // ETF 종목명
  code: string;           // 종목코드
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
}

export interface StockCalcResult {
  investAmount: number;
  quantity: number;
  actualAmount: number;
  monthlyDividend: number;
  annualDividend: number;
}
