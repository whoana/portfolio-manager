import ExcelJS from "exceljs";
import { Portfolio, HoldingItem } from "./types";
import { calcStockAllocation, calcPortfolioTotals, formatNumber } from "./portfolioCalc";
import { calcGrowthReport, DEFAULT_GROWTH_PARAMS } from "./growthCalc";
import { evaluateHolding, evaluateAllHoldings, calcCategoryEvaluations } from "./holdingsCalc";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF2C3E6B" },
};

const EDITABLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFF0" },
};

const DIVIDEND_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8F5E9" },
};

const SUMMARY_LABEL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F4FF" },
};

const BORDER_STYLE: ExcelJS.Border = { style: "thin", color: { argb: "FFCCCCCC" } };
const ALL_BORDERS: Partial<ExcelJS.Borders> = {
  top: BORDER_STYLE,
  left: BORDER_STYLE,
  bottom: BORDER_STYLE,
  right: BORDER_STYLE,
};

const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" } };
const BOLD_FONT: Partial<ExcelJS.Font> = { bold: true };

function applyHeaderStyle(row: ExcelJS.Row, startCol: number, endCol: number) {
  for (let c = startCol; c <= endCol; c++) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = ALL_BORDERS;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }
}

function applyDataStyle(
  cell: ExcelJS.Cell,
  fillOverride?: ExcelJS.Fill,
  numFmt?: string,
  align?: ExcelJS.Alignment["horizontal"]
) {
  cell.border = ALL_BORDERS;
  if (fillOverride) cell.fill = fillOverride;
  if (numFmt) cell.numFmt = numFmt;
  if (align) cell.alignment = { horizontal: align, vertical: "middle" };
  else cell.alignment = { vertical: "middle" };
}

export async function exportPortfolioExcel(portfolio: Portfolio, holdings?: HoldingItem[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ETF Portfolio Manager";
  workbook.created = new Date();

  // ─────────────────────────────────────────────────────────────────────
  // 사전 계산: 모든 수식 셀 result 값 준비
  // ─────────────────────────────────────────────────────────────────────
  const totals = calcPortfolioTotals(portfolio.stocks, portfolio.investmentAmount);
  const stockCalcs = portfolio.stocks.map((stock) =>
    calcStockAllocation(stock, portfolio.investmentAmount)
  );

  const totalWeight = portfolio.stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const totalInvestAmount = stockCalcs.reduce((sum, c) => sum + c.investAmount, 0);
  const totalQty = stockCalcs.reduce((sum, c) => sum + c.quantity, 0);
  const totalActualAmount = stockCalcs.reduce((sum, c) => sum + c.actualAmount, 0);
  const totalMonthlyDividend = stockCalcs.reduce((sum, c) => sum + c.monthlyDividend, 0);
  const totalAnnualDividend = stockCalcs.reduce((sum, c) => sum + c.annualDividend, 0);
  const weightedDivRate =
    totalActualAmount > 0 ? totalAnnualDividend / totalActualAmount : 0;

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 0 (첫 번째): 포트폴리오 요약
  // ─────────────────────────────────────────────────────────────────────
  const sheetSummary = workbook.addWorksheet("포트폴리오 요약");
  sheetSummary.getColumn(1).width = 22;
  sheetSummary.getColumn(2).width = 28;
  sheetSummary.getColumn(3).width = 16;
  sheetSummary.getColumn(4).width = 16;
  sheetSummary.getColumn(5).width = 14;

  // 제목
  sheetSummary.mergeCells("A1:E1");
  const sumTitleCell = sheetSummary.getCell("A1");
  sumTitleCell.value = portfolio.name + " — 포트폴리오 요약";
  sumTitleCell.font = { bold: true, size: 16, color: { argb: "FF2C3E6B" } };
  sumTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheetSummary.getRow(1).height = 32;

  sheetSummary.getRow(2).height = 8;

  // 기본 정보
  const infoItems: Array<[string, string | number, string?]> = [
    ["포트폴리오명", portfolio.name],
    ["투자금액", portfolio.investmentAmount, '#,##0"원"'],
    ["작성일", new Date().toLocaleDateString("ko-KR")],
  ];

  infoItems.forEach(([label, value, fmt], i) => {
    const rowNum = 3 + i;
    const row = sheetSummary.getRow(rowNum);
    row.height = 22;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = BOLD_FONT;
    labelCell.fill = SUMMARY_LABEL_FILL;
    labelCell.border = ALL_BORDERS;
    labelCell.alignment = { horizontal: "right", vertical: "middle" };

    sheetSummary.mergeCells(`B${rowNum}:C${rowNum}`);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.border = ALL_BORDERS;
    valueCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    if (fmt) valueCell.numFmt = fmt;

    for (let c = 4; c <= 5; c++) {
      sheetSummary.getCell(rowNum, c).border = ALL_BORDERS;
    }
  });

  sheetSummary.getRow(6).height = 8;

  // 핵심 지표 섹션 제목
  sheetSummary.mergeCells("A7:E7");
  const kpiLabel = sheetSummary.getCell("A7");
  kpiLabel.value = "【 핵심 지표 】";
  kpiLabel.font = BOLD_FONT;
  kpiLabel.alignment = { horizontal: "left", vertical: "middle" };
  sheetSummary.getRow(7).height = 20;

  // 핵심 지표 헤더
  const kpiHeaderRow = sheetSummary.getRow(8);
  kpiHeaderRow.height = 22;
  ["지표", "값", "", "", ""].forEach((label, i) => {
    kpiHeaderRow.getCell(i + 1).value = label;
  });
  applyHeaderStyle(kpiHeaderRow, 1, 5);

  // 핵심 지표 데이터
  const kpiItems: Array<[string, number, string]> = [
    ["종목 수", portfolio.stocks.length, "#,##0"],
    ["총 목표비중", totalWeight, "0.0%"],
    ["가중평균 배당률", totals.weightedDividendRate, "0.00%"],
    ["예상 연배당", totalAnnualDividend, '#,##0"원"'],
    ["예상 월배당", totalMonthlyDividend, '#,##0"원"'],
  ];

  kpiItems.forEach(([label, value, fmt], i) => {
    const rowNum = 9 + i;
    const row = sheetSummary.getRow(rowNum);
    row.height = 22;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = BOLD_FONT;
    applyDataStyle(labelCell, SUMMARY_LABEL_FILL, undefined, "right");

    sheetSummary.mergeCells(`B${rowNum}:C${rowNum}`);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    applyDataStyle(valueCell, undefined, fmt, "right");

    for (let c = 4; c <= 5; c++) {
      sheetSummary.getCell(rowNum, c).border = ALL_BORDERS;
    }
  });

  const afterKpiRow = 9 + kpiItems.length;
  sheetSummary.getRow(afterKpiRow).height = 8;

  // 종목별 요약 섹션 제목
  const sumTableLabelRow = afterKpiRow + 1;
  sheetSummary.mergeCells(`A${sumTableLabelRow}:E${sumTableLabelRow}`);
  const sumTableLabel = sheetSummary.getCell(`A${sumTableLabelRow}`);
  sumTableLabel.value = "【 종목별 요약 】";
  sumTableLabel.font = BOLD_FONT;
  sumTableLabel.alignment = { horizontal: "left", vertical: "middle" };
  sheetSummary.getRow(sumTableLabelRow).height = 20;

  // 종목별 요약 헤더
  const sumTableHeaderRow = sumTableLabelRow + 1;
  const sumHeader = sheetSummary.getRow(sumTableHeaderRow);
  sumHeader.height = 22;
  ["구분", "ETF명", "목표비중", "예상투자금", "배당률"].forEach((label, i) => {
    sumHeader.getCell(i + 1).value = label;
  });
  applyHeaderStyle(sumHeader, 1, 5);

  // 종목별 요약 데이터
  const sumDataStart = sumTableHeaderRow + 1;
  portfolio.stocks.forEach((stock, i) => {
    const calc = stockCalcs[i];
    const row = sheetSummary.getRow(sumDataStart + i);
    row.height = 20;

    row.getCell(1).value = stock.category;
    row.getCell(2).value = stock.name;
    row.getCell(3).value = stock.targetWeight;
    row.getCell(4).value = calc.investAmount;
    row.getCell(5).value = stock.dividendRate;

    applyDataStyle(row.getCell(1), undefined, undefined, "center");
    applyDataStyle(row.getCell(2));
    applyDataStyle(row.getCell(3), undefined, "0.0%", "center");
    applyDataStyle(row.getCell(4), undefined, "#,##0", "right");
    applyDataStyle(row.getCell(5), undefined, "0.00%", "center");
  });

  // 요약 합계 행
  const sumTotalRow = sumDataStart + portfolio.stocks.length;
  sheetSummary.mergeCells(`A${sumTotalRow}:B${sumTotalRow}`);
  const sumTotalLabel = sheetSummary.getCell(`A${sumTotalRow}`);
  sumTotalLabel.value = "합계";
  applyDataStyle(sumTotalLabel, HEADER_FILL, undefined, "center");
  sumTotalLabel.font = HEADER_FONT;
  sheetSummary.getRow(sumTotalRow).height = 22;

  const sumTotalWeight = sheetSummary.getCell(`C${sumTotalRow}`);
  sumTotalWeight.value = totalWeight;
  applyDataStyle(sumTotalWeight, HEADER_FILL, "0.0%", "center");
  sumTotalWeight.font = HEADER_FONT;

  const sumTotalInvest = sheetSummary.getCell(`D${sumTotalRow}`);
  sumTotalInvest.value = totalInvestAmount;
  applyDataStyle(sumTotalInvest, HEADER_FILL, "#,##0", "right");
  sumTotalInvest.font = HEADER_FONT;

  const sumTotalDiv = sheetSummary.getCell(`E${sumTotalRow}`);
  sumTotalDiv.value = totals.weightedDividendRate;
  applyDataStyle(sumTotalDiv, HEADER_FILL, "0.00%", "center");
  sumTotalDiv.font = HEADER_FONT;

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 1: 포트폴리오 구성
  // ─────────────────────────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet("포트폴리오 구성");

  sheet1.getColumn(1).width = 12;
  sheet1.getColumn(2).width = 30;
  sheet1.getColumn(3).width = 14;
  sheet1.getColumn(4).width = 10;
  sheet1.getColumn(5).width = 14;
  sheet1.getColumn(6).width = 30;
  sheet1.getColumn(7).width = 16;
  sheet1.getColumn(8).width = 12;
  sheet1.getColumn(9).width = 12;
  sheet1.getColumn(10).width = 10;

  const titleRow = sheet1.getRow(1);
  sheet1.mergeCells("A1:J1");
  const titleCell = sheet1.getCell("A1");
  titleCell.value = portfolio.name;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF2C3E6B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleRow.height = 30;

  sheet1.getRow(2).height = 8;

  const principles = [
    "【 투자 원칙 】",
    "1. 장기 보유 원칙: 단기 시장 변동에 흔들리지 않고 3년 이상 장기 보유를 목표로 합니다.",
    "2. 분산 투자 원칙: 단일 종목 집중을 피하고 자산군, 지역, 전략을 분산합니다.",
    "3. 배당 재투자 원칙: 수령한 배당금은 즉시 재투자하여 복리 효과를 극대화합니다.",
    "4. 정기 리밸런싱: 분기별로 목표 비중과 실제 비중을 비교하여 필요시 조정합니다.",
    "5. 손실 관리 원칙: 개별 종목 -20% 하락 시 원인을 분석하고 보유 여부를 재검토합니다.",
  ];
  principles.forEach((text, i) => {
    const row = sheet1.getRow(3 + i);
    sheet1.mergeCells(`A${3 + i}:J${3 + i}`);
    const cell = sheet1.getCell(`A${3 + i}`);
    cell.value = text;
    cell.font = i === 0 ? BOLD_FONT : {};
    cell.alignment = { horizontal: "left", vertical: "middle", indent: i === 0 ? 0 : 1 };
    row.height = 18;
  });

  sheet1.getRow(9).height = 8;

  sheet1.mergeCells("A10:J10");
  const strategyLabel = sheet1.getCell("A10");
  strategyLabel.value = "【 자산배분 전략 】";
  strategyLabel.font = BOLD_FONT;
  strategyLabel.alignment = { horizontal: "left", vertical: "middle" };
  sheet1.getRow(10).height = 20;

  const stratHeader = sheet1.getRow(11);
  stratHeader.height = 22;
  const stratCols = ["구분", "ETF 종목명", "종목코드", "목표비중", "연배당률", "전략특성"];
  stratCols.forEach((label, i) => {
    const cell = stratHeader.getCell(i + 1);
    cell.value = label;
  });
  applyHeaderStyle(stratHeader, 1, 6);
  for (let c = 7; c <= 10; c++) {
    stratHeader.getCell(c).border = ALL_BORDERS;
    stratHeader.getCell(c).fill = HEADER_FILL;
  }

  const stratStartRow = 12;
  portfolio.stocks.forEach((stock, i) => {
    const row = sheet1.getRow(stratStartRow + i);
    row.height = 20;
    row.getCell(1).value = stock.category;
    row.getCell(2).value = stock.name;
    row.getCell(3).value = stock.code;
    row.getCell(4).value = stock.targetWeight;
    row.getCell(5).value = stock.dividendRate;
    row.getCell(6).value = stock.strategy;

    applyDataStyle(row.getCell(1), undefined, undefined, "center");
    applyDataStyle(row.getCell(2));
    applyDataStyle(row.getCell(3), undefined, undefined, "center");
    applyDataStyle(row.getCell(4), EDITABLE_FILL, "0.0%", "center");
    applyDataStyle(row.getCell(5), EDITABLE_FILL, "0.0%", "center");
    applyDataStyle(row.getCell(6));
    for (let c = 7; c <= 10; c++) {
      row.getCell(c).border = ALL_BORDERS;
    }
  });

  const stratEndRow = stratStartRow + portfolio.stocks.length - 1;
  const afterStratRow = stratEndRow + 1;

  sheet1.getRow(afterStratRow).height = 8;

  const amtRow = afterStratRow + 1;
  sheet1.getRow(amtRow).height = 22;
  const amtLabelCell = sheet1.getCell(`A${amtRow}`);
  amtLabelCell.value = "투자금액:";
  amtLabelCell.font = BOLD_FONT;
  amtLabelCell.border = ALL_BORDERS;
  amtLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  sheet1.mergeCells(`B${amtRow}:C${amtRow}`);
  const amtCell = sheet1.getCell(`B${amtRow}`);
  amtCell.value = portfolio.investmentAmount;
  amtCell.fill = EDITABLE_FILL;
  amtCell.numFmt = '#,##0"원"';
  amtCell.font = { bold: true, size: 12 };
  amtCell.border = ALL_BORDERS;
  amtCell.alignment = { horizontal: "right", vertical: "middle" };

  for (let c = 4; c <= 10; c++) {
    const cell = sheet1.getCell(amtRow, c);
    cell.border = ALL_BORDERS;
  }

  const amtCellRef = `B${amtRow}`;

  const emptyRow2 = amtRow + 1;
  sheet1.getRow(emptyRow2).height = 8;

  const allocLabelRow = emptyRow2 + 1;
  sheet1.mergeCells(`A${allocLabelRow}:J${allocLabelRow}`);
  const allocLabel = sheet1.getCell(`A${allocLabelRow}`);
  allocLabel.value = "【 투자금액별 구성표 】";
  allocLabel.font = BOLD_FONT;
  allocLabel.alignment = { horizontal: "left", vertical: "middle" };
  sheet1.getRow(allocLabelRow).height = 20;

  const allocHeaderRow = allocLabelRow + 1;
  const allocHeader = sheet1.getRow(allocHeaderRow);
  allocHeader.height = 22;
  const allocCols = [
    "구분",
    "ETF 종목명",
    "현재가",
    "비중",
    "투자금액",
    "매수수량",
    "실투자금액",
    "월배당",
    "연배당",
    "배당률",
  ];
  allocCols.forEach((label, i) => {
    const cell = allocHeader.getCell(i + 1);
    cell.value = label;
  });
  applyHeaderStyle(allocHeader, 1, 10);

  const allocDataStart = allocHeaderRow + 1;
  portfolio.stocks.forEach((stock, i) => {
    const calc = stockCalcs[i];
    const rowNum = allocDataStart + i;
    const row = sheet1.getRow(rowNum);
    row.height = 20;

    row.getCell(1).value = stock.category;
    row.getCell(2).value = stock.name;
    row.getCell(3).value = stock.currentPrice || 0;
    row.getCell(4).value = stock.targetWeight;

    // 투자금액: result 캐시 추가로 재계산 없이도 표시
    row.getCell(5).value = {
      formula: `ROUND(${amtCellRef}*D${rowNum},0)`,
      result: calc.investAmount,
    };

    // 매수수량: currentPrice=0이면 #DIV/0! 방어
    const qtyResult = (stock.currentPrice ?? 0) > 0 ? calc.quantity : 0;
    row.getCell(6).value = {
      formula: `INT(E${rowNum}/C${rowNum})`,
      result: qtyResult,
    };

    row.getCell(7).value = {
      formula: `F${rowNum}*C${rowNum}`,
      result: calc.actualAmount,
    };

    row.getCell(8).value = {
      formula: `ROUND(G${rowNum}*J${rowNum}/12,0)`,
      result: calc.monthlyDividend,
    };

    row.getCell(9).value = {
      formula: `ROUND(G${rowNum}*J${rowNum},0)`,
      result: calc.annualDividend,
    };

    row.getCell(10).value = stock.dividendRate;

    applyDataStyle(row.getCell(1), undefined, undefined, "center");
    applyDataStyle(row.getCell(2));
    applyDataStyle(row.getCell(3), EDITABLE_FILL, "#,##0", "right");
    applyDataStyle(row.getCell(4), EDITABLE_FILL, "0.0%", "center");
    applyDataStyle(row.getCell(5), undefined, "#,##0", "right");
    applyDataStyle(row.getCell(6), undefined, "#,##0", "right");
    applyDataStyle(row.getCell(7), undefined, "#,##0", "right");
    applyDataStyle(row.getCell(8), DIVIDEND_FILL, "#,##0", "right");
    applyDataStyle(row.getCell(9), DIVIDEND_FILL, "#,##0", "right");
    applyDataStyle(row.getCell(10), undefined, "0.0%", "center");
  });

  // 합계 행
  const totalRowNum = allocDataStart + portfolio.stocks.length;
  const totalRow = sheet1.getRow(totalRowNum);
  totalRow.height = 22;

  sheet1.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
  const totalLabelCell = sheet1.getCell(`A${totalRowNum}`);
  totalLabelCell.value = "합계";
  applyDataStyle(totalLabelCell, HEADER_FILL, undefined, "center");
  totalLabelCell.font = HEADER_FONT;

  applyDataStyle(sheet1.getCell(`C${totalRowNum}`), HEADER_FILL);

  const weightSumCell = sheet1.getCell(`D${totalRowNum}`);
  weightSumCell.value = {
    formula: `SUM(D${allocDataStart}:D${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalWeight,
  };
  applyDataStyle(weightSumCell, HEADER_FILL, "0.0%", "center");
  weightSumCell.font = HEADER_FONT;

  const investSumCell = sheet1.getCell(`E${totalRowNum}`);
  investSumCell.value = {
    formula: `SUM(E${allocDataStart}:E${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalInvestAmount,
  };
  applyDataStyle(investSumCell, HEADER_FILL, "#,##0", "right");
  investSumCell.font = HEADER_FONT;

  const qtySumCell = sheet1.getCell(`F${totalRowNum}`);
  qtySumCell.value = {
    formula: `SUM(F${allocDataStart}:F${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalQty,
  };
  applyDataStyle(qtySumCell, HEADER_FILL, "#,##0", "right");
  qtySumCell.font = HEADER_FONT;

  const actualSumCell = sheet1.getCell(`G${totalRowNum}`);
  actualSumCell.value = {
    formula: `SUM(G${allocDataStart}:G${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalActualAmount,
  };
  applyDataStyle(actualSumCell, HEADER_FILL, "#,##0", "right");
  actualSumCell.font = HEADER_FONT;

  const monthSumCell = sheet1.getCell(`H${totalRowNum}`);
  monthSumCell.value = {
    formula: `SUM(H${allocDataStart}:H${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalMonthlyDividend,
  };
  applyDataStyle(monthSumCell, HEADER_FILL, "#,##0", "right");
  monthSumCell.font = HEADER_FONT;

  const annualSumCell = sheet1.getCell(`I${totalRowNum}`);
  annualSumCell.value = {
    formula: `SUM(I${allocDataStart}:I${allocDataStart + portfolio.stocks.length - 1})`,
    result: totalAnnualDividend,
  };
  applyDataStyle(annualSumCell, HEADER_FILL, "#,##0", "right");
  annualSumCell.font = HEADER_FONT;

  const divRateSumCell = sheet1.getCell(`J${totalRowNum}`);
  divRateSumCell.value = {
    formula: `IFERROR(I${totalRowNum}/G${totalRowNum},0)`,
    result: weightedDivRate,
  };
  applyDataStyle(divRateSumCell, HEADER_FILL, "0.00%", "center");
  divRateSumCell.font = HEADER_FONT;

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 2: 자산성장 전망
  // ─────────────────────────────────────────────────────────────────────
  const sheetGrowth = workbook.addWorksheet("자산성장 전망");

  sheetGrowth.getColumn(1).width = 8;
  sheetGrowth.getColumn(2).width = 18;
  sheetGrowth.getColumn(3).width = 18;
  sheetGrowth.getColumn(4).width = 16;
  sheetGrowth.getColumn(5).width = 14;
  sheetGrowth.getColumn(6).width = 12;

  // 제목 행 (Row 1)
  sheetGrowth.mergeCells("A1:G1");
  const growthTitleCell = sheetGrowth.getCell("A1");
  growthTitleCell.value = `자산성장 전망 — ${portfolio.name}`;
  growthTitleCell.font = { bold: true, size: 16, color: { argb: "FF2C3E6B" } };
  growthTitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheetGrowth.getRow(1).height = 32;

  // 빈 행 (Row 2)
  sheetGrowth.getRow(2).height = 8;

  // 파라미터 정보 (Row 3~7)
  const growthTotalWeight = portfolio.stocks.reduce((sum, s) => sum + s.targetWeight, 0);
  const growthWeightedDividendRate =
    portfolio.stocks.reduce((sum, s) => sum + s.targetWeight * s.dividendRate, 0) /
    (growthTotalWeight || 1);

  const paramItems: Array<[string, string | number, string?]> = [
    ["초기 투자금", portfolio.investmentAmount, '#,##0"원"'],
    ["연배당성장율", DEFAULT_GROWTH_PARAMS.dividendGrowthRate, "0.0%"],
    ["연추가투자금액", DEFAULT_GROWTH_PARAMS.annualAddition, '#,##0"원"'],
    ["자산상승율", DEFAULT_GROWTH_PARAMS.assetGrowthRate, "0.0%"],
    ["초기 가중배당률", growthWeightedDividendRate, "0.00%"],
  ];

  paramItems.forEach(([label, value, fmt], i) => {
    const rowNum = 3 + i;
    const row = sheetGrowth.getRow(rowNum);
    row.height = 20;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = BOLD_FONT;
    labelCell.fill = SUMMARY_LABEL_FILL;
    labelCell.border = ALL_BORDERS;
    labelCell.alignment = { horizontal: "right", vertical: "middle" };

    sheetGrowth.mergeCells(`B${rowNum}:C${rowNum}`);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.border = ALL_BORDERS;
    valueCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    if (fmt) valueCell.numFmt = fmt;

    for (let c = 4; c <= 7; c++) {
      sheetGrowth.getCell(rowNum, c).border = ALL_BORDERS;
    }
  });

  // 빈 행 (Row 8)
  const growthEmptyRow = 3 + paramItems.length;
  sheetGrowth.getRow(growthEmptyRow).height = 8;

  // 테이블 헤더 (Row 9)
  const growthHeaderRowNum = growthEmptyRow + 1;
  const growthHeaderRow = sheetGrowth.getRow(growthHeaderRowNum);
  growthHeaderRow.height = 22;
  ["연차", "평가금", "누적투자금", "연배당금", "월배당금", "배당률"].forEach((label, i) => {
    growthHeaderRow.getCell(i + 1).value = label;
  });
  applyHeaderStyle(growthHeaderRow, 1, 6);

  // 데이터 행 (Row 10~19: 1년~10년)
  const growthRows = calcGrowthReport(
    portfolio.investmentAmount,
    growthWeightedDividendRate,
    DEFAULT_GROWTH_PARAMS,
    10
  );

  const growthDataStart = growthHeaderRowNum + 1;
  growthRows.forEach((r, i) => {
    const rowNum = growthDataStart + i;
    const row = sheetGrowth.getRow(rowNum);
    row.height = 20;

    row.getCell(1).value = `${r.year}년차`;
    row.getCell(2).value = r.assetValue;
    row.getCell(3).value = r.totalInvested;
    row.getCell(4).value = r.annualDividend;
    row.getCell(5).value = r.monthlyDividend;
    row.getCell(6).value = r.dividendRate;

    applyDataStyle(row.getCell(1), undefined, undefined, "center");
    applyDataStyle(row.getCell(2), undefined, '#,##0"원"', "right");
    applyDataStyle(row.getCell(3), undefined, '#,##0"원"', "right");
    applyDataStyle(row.getCell(4), DIVIDEND_FILL, '#,##0"원"', "right");
    applyDataStyle(row.getCell(5), DIVIDEND_FILL, '#,##0"원"', "right");
    applyDataStyle(row.getCell(6), undefined, "0.00%", "center");
  });

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 3: 종목 분석
  // ─────────────────────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet("종목 분석");
  sheet2.getColumn(1).width = 30;
  sheet2.getColumn(2).width = 35;
  sheet2.getColumn(3).width = 50;

  const analysisHeader = sheet2.getRow(1);
  analysisHeader.height = 22;
  ["종목명", "핵심역할", "선정근거"].forEach((label, i) => {
    const cell = analysisHeader.getCell(i + 1);
    cell.value = label;
  });
  applyHeaderStyle(analysisHeader, 1, 3);

  portfolio.stocks.forEach((stock, i) => {
    const row = sheet2.getRow(2 + i);
    row.height = 20;
    row.getCell(1).value = stock.name;
    row.getCell(2).value = stock.analysis;
    row.getCell(3).value = stock.rationale;
    for (let c = 1; c <= 3; c++) {
      applyDataStyle(row.getCell(c));
    }
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    row.getCell(3).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  });

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 3: 자산관리자 의견
  // ─────────────────────────────────────────────────────────────────────
  const sheet3 = workbook.addWorksheet("자산관리자 의견");
  sheet3.getColumn(1).width = 25;
  sheet3.getColumn(2).width = 60;

  const opinionHeader = sheet3.getRow(1);
  opinionHeader.height = 22;
  ["주제", "의견"].forEach((label, i) => {
    const cell = opinionHeader.getCell(i + 1);
    cell.value = label;
  });
  applyHeaderStyle(opinionHeader, 1, 2);

  const templateItems = [
    "시장 전망",
    "포트폴리오 전략 의견",
    "리스크 요인",
    "추가 권고사항",
  ];
  templateItems.forEach((item, i) => {
    const row = sheet3.getRow(2 + i);
    row.height = 20;
    row.getCell(1).value = item;
    row.getCell(2).value = "";
    applyDataStyle(row.getCell(1), undefined, undefined, "left");
    applyDataStyle(row.getCell(2), EDITABLE_FILL);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Sheet 4: 보유 내역 (holdings가 있을 때만)
  // ─────────────────────────────────────────────────────────────────────
  if (holdings && holdings.length > 0) {
    const sheetHoldings = workbook.addWorksheet("보유 내역");
    sheetHoldings.getColumn(1).width = 12;
    sheetHoldings.getColumn(2).width = 30;
    sheetHoldings.getColumn(3).width = 14;
    sheetHoldings.getColumn(4).width = 10;
    sheetHoldings.getColumn(5).width = 14;
    sheetHoldings.getColumn(6).width = 14;
    sheetHoldings.getColumn(7).width = 16;

    // 제목
    sheetHoldings.mergeCells("A1:G1");
    const holdTitleCell = sheetHoldings.getCell("A1");
    holdTitleCell.value = `보유 내역 — ${portfolio.name}`;
    holdTitleCell.font = { bold: true, size: 16, color: { argb: "FF2C3E6B" } };
    holdTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheetHoldings.getRow(1).height = 32;

    sheetHoldings.getRow(2).height = 8;

    // 헤더
    const holdHeaderRow = sheetHoldings.getRow(3);
    holdHeaderRow.height = 22;
    ["구분", "종목", "종목코드", "수량", "평단가", "현재가", "평가액"].forEach((label, i) => {
      holdHeaderRow.getCell(i + 1).value = label;
    });
    applyHeaderStyle(holdHeaderRow, 1, 7);

    // 데이터
    const holdDataStart = 4;
    const sortedHoldings = [...holdings].sort((a, b) => a.category.localeCompare(b.category));
    let holdRowNum = holdDataStart;
    let lastCat = "";

    sortedHoldings.forEach((item) => {
      if (item.category !== lastCat && lastCat !== "") {
        // Category subtotal
        const catItems = sortedHoldings.filter((h) => h.category === lastCat);
        const catEval = catItems.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);
        const subtotalRow = sheetHoldings.getRow(holdRowNum);
        subtotalRow.height = 20;
        sheetHoldings.mergeCells(`A${holdRowNum}:C${holdRowNum}`);
        const stLabel = subtotalRow.getCell(1);
        stLabel.value = `${lastCat} 소계`;
        applyDataStyle(stLabel, SUMMARY_LABEL_FILL, undefined, "right");
        stLabel.font = BOLD_FONT;
        for (let c = 4; c <= 6; c++) {
          applyDataStyle(subtotalRow.getCell(c), SUMMARY_LABEL_FILL);
        }
        const stVal = subtotalRow.getCell(7);
        stVal.value = catEval;
        applyDataStyle(stVal, SUMMARY_LABEL_FILL, "#,##0", "right");
        stVal.font = BOLD_FONT;
        holdRowNum++;
      }
      lastCat = item.category;

      const ev = evaluateHolding(item);
      const row = sheetHoldings.getRow(holdRowNum);
      row.height = 20;
      row.getCell(1).value = item.category;
      row.getCell(2).value = item.name;
      row.getCell(3).value = item.code;
      row.getCell(4).value = item.quantity;
      row.getCell(5).value = item.avgPrice;
      row.getCell(6).value = item.currentPrice || 0;
      row.getCell(7).value = {
        formula: `D${holdRowNum}*F${holdRowNum}`,
        result: ev.evalAmount,
      };

      applyDataStyle(row.getCell(1), undefined, undefined, "center");
      applyDataStyle(row.getCell(2));
      applyDataStyle(row.getCell(3), undefined, undefined, "center");
      applyDataStyle(row.getCell(4), undefined, "#,##0", "right");
      applyDataStyle(row.getCell(5), undefined, "#,##0", "right");
      applyDataStyle(row.getCell(6), EDITABLE_FILL, "#,##0", "right");
      applyDataStyle(row.getCell(7), undefined, "#,##0", "right");
      holdRowNum++;
    });

    // Last category subtotal
    if (lastCat !== "") {
      const catItems = sortedHoldings.filter((h) => h.category === lastCat);
      const catEval = catItems.reduce((s, h) => s + h.quantity * (h.currentPrice || 0), 0);
      const subtotalRow = sheetHoldings.getRow(holdRowNum);
      subtotalRow.height = 20;
      sheetHoldings.mergeCells(`A${holdRowNum}:C${holdRowNum}`);
      const stLabel = subtotalRow.getCell(1);
      stLabel.value = `${lastCat} 소계`;
      applyDataStyle(stLabel, SUMMARY_LABEL_FILL, undefined, "right");
      stLabel.font = BOLD_FONT;
      for (let c = 4; c <= 6; c++) {
        applyDataStyle(subtotalRow.getCell(c), SUMMARY_LABEL_FILL);
      }
      const stVal = subtotalRow.getCell(7);
      stVal.value = catEval;
      applyDataStyle(stVal, SUMMARY_LABEL_FILL, "#,##0", "right");
      stVal.font = BOLD_FONT;
      holdRowNum++;
    }

    // 합계 행
    const { totalInvest, totalEval } = evaluateAllHoldings(holdings);
    const holdTotalRow = sheetHoldings.getRow(holdRowNum);
    holdTotalRow.height = 22;
    sheetHoldings.mergeCells(`A${holdRowNum}:C${holdRowNum}`);
    const holdTotalLabel = holdTotalRow.getCell(1);
    holdTotalLabel.value = "합계";
    applyDataStyle(holdTotalLabel, HEADER_FILL, undefined, "center");
    holdTotalLabel.font = HEADER_FONT;

    for (let c = 4; c <= 5; c++) {
      applyDataStyle(holdTotalRow.getCell(c), HEADER_FILL);
    }

    const holdInvestCell = holdTotalRow.getCell(5);
    holdInvestCell.value = totalInvest;
    applyDataStyle(holdInvestCell, HEADER_FILL, "#,##0", "right");
    holdInvestCell.font = HEADER_FONT;

    applyDataStyle(holdTotalRow.getCell(6), HEADER_FILL);

    const holdEvalCell = holdTotalRow.getCell(7);
    holdEvalCell.value = totalEval;
    applyDataStyle(holdEvalCell, HEADER_FILL, "#,##0", "right");
    holdEvalCell.font = HEADER_FONT;
  }

  // ─────────────────────────────────────────────────────────────────────
  // 다운로드
  // ─────────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = portfolio.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
  link.download = `${safeName}_포트폴리오.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
