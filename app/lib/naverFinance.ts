import { StockSearchResult } from "./types";

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const response = await fetch(
    `/api/stock/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    throw new Error("종목 검색에 실패했습니다.");
  }
  const data = await response.json() as { items: StockSearchResult[] };
  return data.items;
}

export interface StockPriceResult {
  code: string;
  name: string;
  price: number;           // KRW 가격 (해외는 환율 변환된 값)
  dividendYield?: number;
  priceOriginal?: number;  // 해외 주식 원래 통화 가격
  currency?: string;       // 해외 주식 통화 (USD, JPY 등)
  exchangeRate?: number;   // 적용 환율
}

export async function getStockPrice(code: string): Promise<StockPriceResult> {
  const response = await fetch(`/api/stock/price/${code}`);
  if (!response.ok) {
    throw new Error("현재가 조회에 실패했습니다.");
  }
  return response.json() as Promise<StockPriceResult>;
}
