"use client";

import { useState, useRef, useCallback } from "react";
import {
  exportAllData,
  parseImportFile,
  applyImportData,
  type ExportData,
  type ImportParseResult,
} from "@/app/lib/dataExportImport";

interface DataTransferModalProps {
  onClose: () => void;
}

export default function DataTransferModal({ onClose }: DataTransferModalProps) {
  const [importResult, setImportResult] = useState<ImportParseResult | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [isDragging, setIsDragging] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [exportDone, setExportDone] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportAllData();
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const processFile = useCallback(async (file: File) => {
    setApplyMsg("");
    setConfirmReplace(false);
    const result = await parseImportFile(file);
    setImportResult(result);
    if (result.success && result.data) {
      setImportData(result.data);
    } else {
      setImportData(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleApply = () => {
    if (mode === "replace" && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    if (!importData) return;
    const result = applyImportData(importData, mode);

    if (mode === "replace") {
      setApplyMsg(`데이터를 교체했습니다. 포트폴리오 ${result.portfoliosAdded}개, 보유 종목 ${result.holdingsAdded}개`);
    } else {
      const msg = result.skipped > 0
        ? `${result.portfoliosAdded}개 추가, ${result.skipped}개 중복 스킵`
        : `${result.portfoliosAdded}개 추가`;
      setApplyMsg(`병합 완료: ${msg}`);
    }

    // 2초 후 새로고침
    setTimeout(() => window.location.reload(), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-md bg-card-bg rounded-t-2xl md:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 md:pt-5 pb-3">
          <h2 className="text-lg font-bold text-foreground">데이터 관리</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-table-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">
          {/* ── 내보내기 ── */}
          <div>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-card-border hover:bg-table-hover/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-foreground">내보내기</div>
                <div className="text-xs text-muted-foreground mt-0.5">포트폴리오, 보유 내역, 설정을 JSON 파일로 저장</div>
              </div>
            </button>
            {exportDone && (
              <p className="mt-2 text-xs text-primary font-medium px-1">백업 파일을 다운로드했습니다.</p>
            )}
          </div>

          {/* ── 구분선 ── */}
          <div className="h-px bg-card-border" />

          {/* ── 들여오기 ── */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">들여오기</h3>

            {/* 파일 선택 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-card-border hover:border-muted-foreground"
              }`}
            >
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">파일 선택</span> 또는 여기에 드래그
              </p>
              <p className="text-xs text-muted">JSON 파일 (최대 5MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 검증 에러 */}
            {importResult && !importResult.success && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-accent-red-bg text-accent-red text-sm">
                {importResult.error}
              </div>
            )}

            {/* 미리보기 */}
            {importResult?.success && importResult.stats && (
              <div className="mt-3 space-y-3">
                <div className="px-4 py-3 rounded-xl bg-table-hover">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-foreground">{importResult.stats.portfolioCount}</div>
                      <div className="text-xs text-muted-foreground">포트폴리오</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{importResult.stats.totalStockCount}</div>
                      <div className="text-xs text-muted-foreground">종목 구성</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{importResult.stats.holdingCount}</div>
                      <div className="text-xs text-muted-foreground">보유 종목</div>
                    </div>
                  </div>
                </div>

                {/* 모드 선택 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode("replace"); setConfirmReplace(false); }}
                    className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-colors ${
                      mode === "replace"
                        ? "bg-primary text-primary-fg"
                        : "bg-table-hover text-muted-foreground"
                    }`}
                  >
                    덮어쓰기
                  </button>
                  <button
                    onClick={() => { setMode("merge"); setConfirmReplace(false); }}
                    className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-colors ${
                      mode === "merge"
                        ? "bg-primary text-primary-fg"
                        : "bg-table-hover text-muted-foreground"
                    }`}
                  >
                    병합
                  </button>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  {mode === "replace"
                    ? "기존 데이터를 모두 삭제하고 새 데이터로 교체합니다."
                    : "기존 데이터를 유지하면서 새 항목만 추가합니다."}
                </p>

                {/* 덮어쓰기 확인 */}
                {confirmReplace && mode === "replace" && (
                  <div className="px-4 py-3 rounded-xl bg-accent-red-bg text-accent-red text-sm font-medium">
                    기존 데이터가 모두 삭제됩니다. 정말 진행하시겠습니까?
                  </div>
                )}

                {/* 적용 결과 */}
                {applyMsg && (
                  <div className="px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                    {applyMsg}
                  </div>
                )}

                {/* 들여오기 버튼 */}
                {!applyMsg && (
                  <button
                    onClick={handleApply}
                    className="w-full py-3 rounded-xl bg-primary text-primary-fg font-semibold text-[15px] hover:bg-primary/90 transition-colors"
                  >
                    {confirmReplace ? "확인, 들여오기 실행" : "들여오기"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
