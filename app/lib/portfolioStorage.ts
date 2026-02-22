import { Portfolio } from "./types";

const STORAGE_KEY = "etf_portfolios";

export function getPortfolios(): Portfolio[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Portfolio[];
  } catch {
    return [];
  }
}

export function getPortfolio(id: string): Portfolio | null {
  const portfolios = getPortfolios();
  return portfolios.find((p) => p.id === id) || null;
}

export function savePortfolio(portfolio: Portfolio): void {
  const portfolios = getPortfolios();
  const index = portfolios.findIndex((p) => p.id === portfolio.id);
  if (index >= 0) {
    portfolios[index] = { ...portfolio, updatedAt: new Date().toISOString() };
  } else {
    portfolios.push(portfolio);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
}

export function deletePortfolio(id: string): void {
  const portfolios = getPortfolios().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
}

export function createPortfolio(name: string): Portfolio {
  const now = new Date().toISOString();
  return {
    id: `portfolio_${Date.now()}`,
    name,
    stocks: [],
    investmentAmount: 100000000,
    createdAt: now,
    updatedAt: now,
  };
}
