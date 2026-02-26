import { PortfolioHoldings, HoldingItem } from "./types";

const STORAGE_KEY = "etf_holdings";

const CATEGORY_MIGRATION: Record<string, string> = {
  "배당": "배당성장",
  "성장": "성장동력",
};

function migrateHoldingCategories(all: PortfolioHoldings[]): PortfolioHoldings[] {
  let changed = false;
  const migrated = all.map((h) => ({
    ...h,
    items: h.items.map((item) => {
      const newCat = CATEGORY_MIGRATION[item.category];
      if (newCat) {
        changed = true;
        return { ...item, category: newCat };
      }
      return item;
    }),
  }));
  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

export function getAllHoldings(): PortfolioHoldings[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return migrateHoldingCategories(JSON.parse(data) as PortfolioHoldings[]);
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
