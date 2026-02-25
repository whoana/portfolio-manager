import { HoldingItem, PortfolioStock } from "./types";

export interface HoldingEvaluation {
  item: HoldingItem;
  investAmount: number;    // 투자원금 (quantity * avgPrice)
  evalAmount: number;      // 평가액 (quantity * currentPrice)
  profitLoss: number;      // 손익
  returnRate: number;      // 수익률 (0~1 소수)
}

export interface CategoryEvaluation {
  category: string;
  investAmount: number;
  evalAmount: number;
  profitLoss: number;
  returnRate: number;
}

export interface WeightComparison {
  label: string;
  targetWeight: number;    // 목표비중 (0~1)
  actualWeight: number;    // 실제비중 (0~1)
  diff: number;            // 차이 (actual - target)
}

export function evaluateHolding(item: HoldingItem): HoldingEvaluation {
  const investAmount = item.quantity * item.avgPrice;
  const evalAmount = item.quantity * (item.currentPrice || 0);
  const profitLoss = evalAmount - investAmount;
  const returnRate = investAmount > 0 ? profitLoss / investAmount : 0;
  return { item, investAmount, evalAmount, profitLoss, returnRate };
}

export function evaluateAllHoldings(items: HoldingItem[]): {
  evaluations: HoldingEvaluation[];
  totalInvest: number;
  totalEval: number;
  totalProfitLoss: number;
  totalReturnRate: number;
} {
  const evaluations = items.map(evaluateHolding);
  const totalInvest = evaluations.reduce((sum, e) => sum + e.investAmount, 0);
  const totalEval = evaluations.reduce((sum, e) => sum + e.evalAmount, 0);
  const totalProfitLoss = totalEval - totalInvest;
  const totalReturnRate = totalInvest > 0 ? totalProfitLoss / totalInvest : 0;
  return { evaluations, totalInvest, totalEval, totalProfitLoss, totalReturnRate };
}

export function calcCategoryEvaluations(items: HoldingItem[]): CategoryEvaluation[] {
  const map = new Map<string, { investAmount: number; evalAmount: number }>();
  items.forEach((item) => {
    const curr = map.get(item.category) || { investAmount: 0, evalAmount: 0 };
    curr.investAmount += item.quantity * item.avgPrice;
    curr.evalAmount += item.quantity * (item.currentPrice || 0);
    map.set(item.category, curr);
  });
  return Array.from(map.entries()).map(([category, data]) => ({
    category,
    investAmount: data.investAmount,
    evalAmount: data.evalAmount,
    profitLoss: data.evalAmount - data.investAmount,
    returnRate: data.investAmount > 0 ? (data.evalAmount - data.investAmount) / data.investAmount : 0,
  }));
}

export function compareWeightsByCategory(
  stocks: PortfolioStock[],
  holdings: HoldingItem[]
): WeightComparison[] {
  const totalTargetWeight = stocks.reduce((s, st) => s + st.targetWeight, 0);
  const targetMap = new Map<string, number>();
  stocks.forEach((s) => {
    targetMap.set(s.category, (targetMap.get(s.category) || 0) + s.targetWeight);
  });

  const totalEval = holdings.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);
  const actualMap = new Map<string, number>();
  holdings.forEach((h) => {
    actualMap.set(h.category, (actualMap.get(h.category) || 0) + h.quantity * (h.currentPrice || 0));
  });

  const categories = new Set([...Array.from(targetMap.keys()), ...Array.from(actualMap.keys())]);
  return Array.from(categories).map((cat) => {
    const rawTarget = targetMap.get(cat) || 0;
    const targetWeight = totalTargetWeight > 0 ? rawTarget / totalTargetWeight : 0;
    const rawActual = actualMap.get(cat) || 0;
    const actualWeight = totalEval > 0 ? rawActual / totalEval : 0;
    return {
      label: cat,
      targetWeight,
      actualWeight,
      diff: actualWeight - targetWeight,
    };
  });
}

export function compareWeightsByStock(
  stocks: PortfolioStock[],
  holdings: HoldingItem[]
): WeightComparison[] {
  const totalTargetWeight = stocks.reduce((s, st) => s + st.targetWeight, 0);
  const totalEval = holdings.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);

  const holdingEvalMap = new Map<string, number>();
  holdings.forEach((h) => {
    holdingEvalMap.set(h.code, (holdingEvalMap.get(h.code) || 0) + h.quantity * (h.currentPrice || 0));
  });

  const codes = new Set([...stocks.map((s) => s.code), ...holdings.map((h) => h.code)]);
  return Array.from(codes).map((code) => {
    const stock = stocks.find((s) => s.code === code);
    const label = stock?.name || holdings.find((h) => h.code === code)?.name || code;
    const targetWeight = stock && totalTargetWeight > 0 ? stock.targetWeight / totalTargetWeight : 0;
    const rawActual = holdingEvalMap.get(code) || 0;
    const actualWeight = totalEval > 0 ? rawActual / totalEval : 0;
    return {
      label,
      targetWeight,
      actualWeight,
      diff: actualWeight - targetWeight,
    };
  });
}
