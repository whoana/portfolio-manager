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

export async function getStockPrice(
  code: string
): Promise<{ code: string; name: string; price: number; dividendYield?: number }> {
  const response = await fetch(`/api/stock/price/${code}`);
  if (!response.ok) {
    throw new Error("현재가 조회에 실패했습니다.");
  }
  return response.json() as Promise<{ code: string; name: string; price: number; dividendYield?: number }>;
}
