import { PortfolioHoldings, HoldingItem } from "./types";

const STORAGE_KEY = "etf_holdings";

export function getAllHoldings(): PortfolioHoldings[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as PortfolioHoldings[];
  } catch {
    return [];
  }
}

export function getHoldings(portfolioId: string): PortfolioHoldings | null {
  const all = getAllHoldings();
  return all.find((h) => h.portfolioId === portfolioId) || null;
}

export function saveHoldings(holdings: PortfolioHoldings): void {
  const all = getAllHoldings();
  const index = all.findIndex((h) => h.portfolioId === holdings.portfolioId);
  const updated = { ...holdings, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteHoldings(portfolioId: string): void {
  const all = getAllHoldings().filter((h) => h.portfolioId !== portfolioId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function createHoldingItem(
  fields: Omit<HoldingItem, "id">
): HoldingItem {
  return {
    id: `holding_${Date.now()}`,
    ...fields,
  };
}
