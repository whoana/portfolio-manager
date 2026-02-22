"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StockSearchResult } from "@/app/lib/types";
import { searchStocks } from "@/app/lib/naverFinance";

interface StockSearchProps {
  onSelect: (stock: StockSearchResult) => void;
  placeholder?: string;
}

export default function StockSearch({
  onSelect,
  placeholder = "종목코드, 한글 또는 영문 브랜드명으로 검색 (예: TIGER, 삼성, 458730)",
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = await searchStocks(q);
      setResults(items);
      setOpen(true);
    } catch {
      setError("검색 중 오류가 발생했습니다.");
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // results가 바뀌면 하이라이트 초기화
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // activeIndex 변경 시 해당 항목을 드롭다운 내에서 스크롤
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleSelect = (stock: StockSearchResult) => {
    onSelect(stock);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-input-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card-bg"
          onFocus={() => (results.length > 0 || query.trim().length > 0) && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card-bg border border-card-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            results.map((stock, index) => (
              <button
                key={stock.code}
                ref={(el) => { itemRefs.current[index] = el; }}
                type="button"
                onClick={() => handleSelect(stock)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border-l-2 text-left transition-colors ${
                  activeIndex === index
                    ? "bg-table-hover border-primary"
                    : "border-transparent hover:bg-table-hover hover:border-primary"
                }`}
              >
                <span className="font-semibold text-foreground">{stock.name}</span>
                <span className="text-muted text-xs ml-2 font-mono">{stock.code}</span>
              </button>
            ))
          ) : (
            !loading && (
              <div className="px-4 py-3 text-sm text-muted text-center">
                검색 결과가 없습니다
              </div>
            )
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
