"use client";

import { useState, useRef, useCallback } from "react";
import { HoldingItem } from "@/app/lib/types";
import { parseCsvToHoldings, CsvParseResult } from "@/app/lib/csvUtils";
import { formatNumber } from "@/app/lib/portfolioCalc";

interface CsvImportModalProps {
  onImport: (items: HoldingItem[], mode: "append" | "replace") => void;
  onClose: () => void;
}

export default function CsvImportModal({ onImport, onClose }: CsvImportModalProps) {
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsvToHoldings(text);
      setParseResult(result);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!parseResult || parseResult.items.length === 0) return;
    onImport(parseResult.items, mode);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-card-bg rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted/40" />
        </div>
        <div className="flex items-center justify-between px-6 py-3 sm:py-4 border-b border-card-border">
          <h2 className="text-base font-bold text-foreground sm:text-primary">CSV 가져오기</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-table-hover text-muted-foreground hover:bg-card-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          {!parseResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-card-border hover:border-primary/50"
              }`}
            >
              <svg className="w-10 h-10 mx-auto mb-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-muted-foreground mb-1">
                CSV 파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="text-xs text-muted">.csv, .tsv, .txt 파일 지원</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* Preview */}
          {parseResult && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {fileName}
                </div>
                <button
                  onClick={() => { setParseResult(null); setFileName(""); }}
                  className="text-xs text-muted hover:text-accent-red"
                >
                  다시 선택
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs">
                <span className="px-2 py-1 bg-accent-green-bg text-accent-green rounded-lg font-medium">
                  유효 {parseResult.items.length}건
                </span>
                {parseResult.errors.length > 0 && (
                  <span className="px-2 py-1 bg-accent-red-bg text-accent-red rounded-lg font-medium">
                    오류 {parseResult.errors.length}건
                  </span>
                )}
              </div>

              {/* Preview table */}
              {parseResult.items.length > 0 && (
                <div className="border border-card-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-table-hover">
                        <th className="px-3 py-2 text-left">구분</th>
                        <th className="px-3 py-2 text-left">종목</th>
                        <th className="px-3 py-2 text-center">코드</th>
                        <th className="px-3 py-2 text-right">수량</th>
                        <th className="px-3 py-2 text-right">평단가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.items.map((item, i) => (
                        <tr key={i} className="border-t border-card-border">
                          <td className="px-3 py-1.5">{item.category}</td>
                          <td className="px-3 py-1.5">{item.name}</td>
                          <td className="px-3 py-1.5 text-center font-mono">{item.code}</td>
                          <td className="px-3 py-1.5 text-right">{formatNumber(item.quantity)}</td>
                          <td className="px-3 py-1.5 text-right">{formatNumber(item.avgPrice)}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="border border-accent-red/20 rounded-lg p-3 bg-accent-red-bg/50 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-accent-red mb-2">파싱 오류</p>
                  {parseResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-accent-red/80">
                      {err.line}행: {err.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Import mode */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">가져오기 방식</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={mode === "append"}
                      onChange={() => setMode("append")}
                      className="accent-primary"
                    />
                    <span>기존에 추가</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                      className="accent-primary"
                    />
                    <span>전체 대체</span>
                  </label>
                </div>
              </div>
            </>
          )}
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
            disabled={!parseResult || parseResult.items.length === 0}
            className="flex-[2] py-3 text-sm font-bold text-primary-fg bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            가져오기 ({parseResult?.items.length || 0}건)
          </button>
        </div>
      </div>
    </div>
  );
}
