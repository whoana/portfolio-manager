"use client";

import { useState, useRef } from "react";
import { PortfolioStock, StockSearchResult } from "@/app/lib/types";
import { getStockPrice } from "@/app/lib/naverFinance";
import { formatNumber } from "@/app/lib/portfolioCalc";
import StockSearch from "./StockSearch";

interface AddStockModalProps {
  onAdd: (stock: PortfolioStock) => void;
  onClose: () => void;
  initialStock?: PortfolioStock; // 수정 모드 시 전달
}

const CATEGORY_OPTIONS = ["배당", "고배당", "성장", "안전판", "채권", "원자재", "기타"];

export default function AddStockModal({ onAdd, onClose, initialStock }: AddStockModalProps) {
  const [selected, setSelected] = useState<StockSearchResult | null>(
    initialStock ? { name: initialStock.name, code: initialStock.code } : null
  );
  const targetWeightRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    category: initialStock ? initialStock.category : "배당",
    targetWeight: initialStock ? (initialStock.targetWeight * 100).toFixed(1) : "",
    dividendRate: initialStock ? (initialStock.dividendRate * 100).toFixed(1) : "",
    strategy: initialStock ? (initialStock.strategy ?? "") : "",
    analysis: initialStock ? (initialStock.analysis ?? "") : "",
    rationale: initialStock ? (initialStock.rationale ?? "") : "",
  });
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    initialStock?.currentPrice
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSelect = async (stock: StockSearchResult) => {
    setSelected(stock);
    setSelectedPrice(undefined);
    setPriceLoading(true);
    try {
      const result = await getStockPrice(stock.code);
      setSelectedPrice(result.price);
      // ETF 분배율(TTM) 자동 채움 — 빈 칸일 때만
      if (result.dividendYield != null && !form.dividendRate) {
        setForm((prev) => ({ ...prev, dividendRate: result.dividendYield!.toFixed(2) }));
      }
    } catch {
      // 가격 조회 실패 시 무시 - PortfolioTable에서 재조회 가능
    } finally {
      setPriceLoading(false);
    }
    setTimeout(() => targetWeightRef.current?.focus(), 50);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selected) errs.stock = "종목을 선택해주세요.";
    const w = parseFloat(form.targetWeight);
    if (isNaN(w) || w <= 0 || w > 100) errs.targetWeight = "0~100 사이 숫자를 입력하세요.";
    const d = parseFloat(form.dividendRate);
    if (isNaN(d) || d < 0 || d > 100) errs.dividendRate = "0~100 사이 숫자를 입력하세요.";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!selected) return;

    const stock: PortfolioStock = {
      id: initialStock ? initialStock.id : `stock_${Date.now()}`,
      category: form.category,
      name: selected.name,
      code: selected.code,
      targetWeight: parseFloat(form.targetWeight) / 100,
      dividendRate: parseFloat(form.dividendRate) / 100,
      currentPrice: selectedPrice,
      strategy: form.strategy,
      analysis: form.analysis,
      rationale: form.rationale,
    };
    onAdd(stock);
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type: "text" | "number" | "textarea" = "text",
    suffix?: string,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        {type === "textarea" ? (
          <textarea
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        ) : (
          <input
            type={type}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-8 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        )}
        {suffix && (
          <span className="absolute right-3 top-2.5 text-muted text-xs">{suffix}</span>
        )}
      </div>
      {errors[key] && <p className="mt-1 text-xs text-accent-red">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <h2 className="text-base font-bold text-primary">
            {initialStock ? "종목 수정" : "종목 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-muted-foreground text-xl leading-none"
          >
            x
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Stock search */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              종목 검색 <span className="text-accent-red">*</span>
            </label>
            {selected ? (
              <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-primary">{selected.name}</span>
                  <span className="ml-2 text-xs text-muted font-mono">{selected.code}</span>
                  {priceLoading ? (
                    <span className="ml-2 inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin align-middle" />
                  ) : selectedPrice ? (
                    <span className="ml-2 text-xs text-accent-green font-medium">{formatNumber(selectedPrice)}원</span>
                  ) : null}
                </div>
                <button
                  onClick={() => { setSelected(null); setSelectedPrice(undefined); }}
                  className="text-xs text-muted hover:text-accent-red"
                >
                  다시 검색
                </button>
              </div>
            ) : (
              <StockSearch onSelect={handleSelect} />
            )}
            {errors.stock && <p className="mt-1 text-xs text-accent-red">{errors.stock}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">구분</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card-bg"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Weight and Dividend */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">목표비중 (%)</label>
              <div className="relative">
                <input
                  ref={targetWeightRef}
                  type="number"
                  value={form.targetWeight}
                  onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                  placeholder="예: 30"
                  className="w-full px-3 py-2 pr-8 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-3 top-2.5 text-muted text-xs">%</span>
              </div>
              {errors.targetWeight && <p className="mt-1 text-xs text-accent-red">{errors.targetWeight}</p>}
            </div>
            {field("연배당률 (%)", "dividendRate", "number", "%", "예: 3.5")}
          </div>

          {field("전략특성", "strategy", "text", undefined, "예: 미국 배당 성장주 ETF")}
          {field("핵심역할", "analysis", "textarea", undefined, "예: 안정적인 배당 수익 확보")}
          {field("선정근거", "rationale", "textarea", undefined, "예: 장기 배당 성장 이력...")}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-card-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-muted-foreground border border-input-border rounded-lg hover:bg-table-hover transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 text-sm font-bold text-primary-fg bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            {initialStock ? "저장" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
