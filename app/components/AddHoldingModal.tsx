"use client";

import { useState, useRef } from "react";
import { HoldingItem, StockSearchResult } from "@/app/lib/types";
import { getStockPrice } from "@/app/lib/naverFinance";
import { formatNumber } from "@/app/lib/portfolioCalc";
import StockSearch from "./StockSearch";
import { CATEGORY_OPTIONS } from "@/app/lib/constants";

interface AddHoldingModalProps {
  onAdd: (item: HoldingItem) => void;
  onClose: () => void;
  initialItem?: HoldingItem;
}

export default function AddHoldingModal({ onAdd, onClose, initialItem }: AddHoldingModalProps) {
  const [selected, setSelected] = useState<StockSearchResult | null>(
    initialItem ? { name: initialItem.name, code: initialItem.code } : null
  );
  const quantityRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    category: initialItem?.category ?? "배당",
    quantity: initialItem ? String(initialItem.quantity) : "",
    avgPrice: initialItem ? String(initialItem.avgPrice) : "",
  });
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    initialItem?.currentPrice
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
      if (!form.avgPrice) {
        setForm((prev) => ({ ...prev, avgPrice: String(result.price) }));
      }
    } catch {
      // ignore
    } finally {
      setPriceLoading(false);
    }
    setTimeout(() => quantityRef.current?.focus(), 50);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selected) errs.stock = "종목을 선택해주세요.";
    const q = parseInt(form.quantity, 10);
    if (isNaN(q) || q <= 0) errs.quantity = "1 이상의 정수를 입력하세요.";
    const p = parseFloat(form.avgPrice);
    if (isNaN(p) || p <= 0) errs.avgPrice = "0보다 큰 금액을 입력하세요.";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!selected) return;

    const item: HoldingItem = {
      id: initialItem ? initialItem.id : `holding_${Date.now()}`,
      category: form.category,
      name: selected.name,
      code: selected.code,
      quantity: parseInt(form.quantity, 10),
      avgPrice: parseFloat(form.avgPrice),
      currentPrice: selectedPrice,
    };
    onAdd(item);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-card-bg rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted/40" />
        </div>
        <div className="flex items-center justify-between px-6 py-3 sm:py-4 border-b border-card-border">
          <h2 className="text-base font-bold text-foreground sm:text-primary">
            {initialItem ? "보유 내역 수정" : "보유 내역 추가"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-table-hover text-muted-foreground hover:bg-card-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
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

          {/* Quantity and Avg Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                보유수량 <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  ref={quantityRef}
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="예: 100"
                  className="w-full px-3 py-2 pr-8 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-3 top-2.5 text-muted text-xs">주</span>
              </div>
              {errors.quantity && <p className="mt-1 text-xs text-accent-red">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                평균매수단가 <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.avgPrice}
                  onChange={(e) => setForm({ ...form, avgPrice: e.target.value })}
                  placeholder="예: 12500"
                  className="w-full px-3 py-2 pr-8 text-sm border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-3 top-2.5 text-muted text-xs">원</span>
              </div>
              {errors.avgPrice && <p className="mt-1 text-xs text-accent-red">{errors.avgPrice}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 px-6 py-5 border-t border-card-border bg-card-bg">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-muted-foreground bg-table-hover rounded-xl hover:bg-card-border transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] py-3 text-sm font-bold text-primary-fg bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            {initialItem ? "저장" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
