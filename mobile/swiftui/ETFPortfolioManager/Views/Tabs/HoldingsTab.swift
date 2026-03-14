import SwiftUI
import Charts

struct HoldingsTab: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var portfolioVM: PortfolioViewModel
    @Bindable var holdingsVM: HoldingsViewModel
    @State private var showAddHolding = false
    @State private var sortKey = "구분"
    @State private var sortAscending = true
    @State private var showByStock = false

    private let sortOptions = ["구분", "종목명", "평가액", "손익", "수익률"]

    var body: some View {
        ZStack {
            theme.bgPrimary.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    // 액션 버튼 행
                    actionButtons

                    // 정렬 칩 바
                    SortChipBar(options: sortOptions, selected: $sortKey, ascending: $sortAscending)

                    // 종목 리스트
                    holdingsList

                    if holdingsVM.totalEval > 0 {
                        // 보유 현황 요약 (도넛 차트 + 카테고리 비중)
                        holdingsSummarySection

                        // 통계 카드
                        statsSection

                        // 목표 vs 실제 비중 비교 차트
                        if let portfolio = portfolioVM.selectedPortfolio {
                            let comparisons = showByStock
                                ? HoldingsCalculator.compareWeightsByStock(
                                    stocks: portfolio.stocks,
                                    holdings: holdingsVM.holdings?.items ?? [])
                                : HoldingsCalculator.compareWeightsByCategory(
                                    stocks: portfolio.stocks,
                                    holdings: holdingsVM.holdings?.items ?? [])
                            WeightComparisonChart(
                                comparisons: comparisons,
                                showByStock: $showByStock
                            )
                            .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
        }
        .refreshable {
            await holdingsVM.refreshPrices()
        }
        .onAppear {
            if let id = portfolioVM.selectedPortfolio?.id {
                holdingsVM.loadHoldings(portfolioId: id)
            }
        }
        .onChange(of: portfolioVM.selectedPortfolio?.id) { _, newId in
            if let id = newId {
                holdingsVM.loadHoldings(portfolioId: id)
            }
        }
    }

    // MARK: - 액션 버튼 행

    private var actionButtons: some View {
        HStack(spacing: 10) {
            actionButton(icon: "arrow.clockwise", title: "갱신") {
                Task { await holdingsVM.refreshPrices() }
            }
            Spacer()
            Button {
                showAddHolding = true
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                    Text("추가")
                        .font(TossTypography.body)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(theme.accentColor)
                .foregroundColor(.white)
                .cornerRadius(20)
            }
            .buttonStyle(.plain)
            .sheet(isPresented: $showAddHolding) {
                if let portfolio = portfolioVM.selectedPortfolio {
                    AddHoldingSheet(
                        portfolioVM: portfolioVM,
                        holdingsVM: holdingsVM,
                        portfolioId: portfolio.id
                    )
                }
            }
        }
        .padding(.horizontal, 16)
    }

    private func actionButton(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(title)
                    .font(TossTypography.caption)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(theme.bgCard)
            .foregroundColor(theme.textSecondary)
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    // MARK: - 종목 리스트

    private var holdingsList: some View {
        VStack(spacing: 0) {
            if holdingsVM.evaluations.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "briefcase")
                        .font(.system(size: 36))
                        .foregroundColor(theme.textTertiary)
                    Text("보유 종목이 없습니다")
                        .font(TossTypography.body)
                        .foregroundColor(theme.textSecondary)
                }
                .padding(.vertical, 40)
            } else {
                let sorted = sortedEvaluations()
                ForEach(sorted) { eval in
                    holdingRow(eval)
                    if eval.id != sorted.last?.id {
                        Divider().padding(.leading, 76)
                    }
                }
            }
        }
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private func holdingRow(_ eval: HoldingEvaluation) -> some View {
        HStack(spacing: 12) {
            // 사각형 카테고리 뱃지 (웹앱과 동일)
            CategoryBadge(category: eval.item.category)

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(eval.item.name)
                        .font(TossTypography.bodyLarge)
                        .foregroundColor(theme.textPrimary)
                        .lineLimit(1)
                    Spacer()
                    // 평가액
                    Text(PortfolioCalculator.formatNumber(eval.evalAmount) + "원")
                        .font(TossTypography.bodyLarge)
                        .foregroundColor(theme.textPrimary)
                }
                HStack {
                    // 코드 · 수량 · 손익금액
                    Text("\(eval.item.code) \u{00B7} \(eval.item.quantity)주 \u{00B7} \(eval.profitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatNumber(eval.profitLoss))원")
                        .font(TossTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Spacer()
                    // 수익률%
                    Text("\(eval.profitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatPercent(eval.returnRate))")
                        .font(TossTypography.caption)
                        .foregroundColor(eval.profitLoss >= 0 ? theme.profitColor : theme.lossColor)
                }
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 20)
    }

    // MARK: - 보유 현황 요약

    private var holdingsSummarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("보유 현황 요약")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)

            // 도넛 차트
            if !holdingsVM.categoryEvaluations.isEmpty {
                holdingsPieChart
            }

            // 카테고리별 비중 + 금액 목록
            ForEach(holdingsVM.categoryEvaluations) { catEval in
                HStack {
                    Circle()
                        .fill(CATEGORY_BG_COLORS[catEval.category] ?? TossColors.blue)
                        .frame(width: 10, height: 10)
                    Text(catEval.category)
                        .font(TossTypography.body)
                        .foregroundColor(theme.textPrimary)
                    Spacer()
                    let weight = holdingsVM.totalEval > 0 ? Double(catEval.evalAmount) / Double(holdingsVM.totalEval) : 0
                    Text(PortfolioCalculator.formatPercent(weight))
                        .font(TossTypography.body)
                        .foregroundColor(theme.textSecondary)
                    Text(PortfolioCalculator.formatNumber(catEval.evalAmount) + "원")
                        .font(TossTypography.bodyLarge)
                        .foregroundColor(theme.textPrimary)
                        .frame(width: 110, alignment: .trailing)
                }
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private var holdingsPieChart: some View {
        Chart(holdingsVM.categoryEvaluations) { item in
            let weight = holdingsVM.totalEval > 0 ? Double(item.evalAmount) / Double(holdingsVM.totalEval) : 0
            SectorMark(
                angle: .value("비중", weight),
                innerRadius: .ratio(0.55),
                angularInset: 1.5
            )
            .foregroundStyle(CATEGORY_BG_COLORS[item.category] ?? TossColors.blue)
        }
        .chartOverlay { _ in
            // 도넛 차트 중앙 텍스트
            VStack(spacing: 2) {
                Text("총 평가액")
                    .font(TossTypography.caption)
                    .foregroundColor(theme.textSecondary)
                Text(formatBigAmount(holdingsVM.totalEval))
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(theme.textPrimary)
            }
        }
        .frame(height: 200)
    }

    // MARK: - 통계 카드

    private var statsSection: some View {
        VStack(spacing: 12) {
            // 투자원금 / 평가액 (큰 카드 2개)
            HStack(spacing: 12) {
                statCard(title: "투자원금", value: PortfolioCalculator.formatNumber(holdingsVM.totalInvest) + "원", color: theme.textPrimary)
                statCard(title: "평가액", value: PortfolioCalculator.formatNumber(holdingsVM.totalEval) + "원", color: theme.textPrimary)
            }

            // 예상 월배당 / 예상 연배당 (연두 카드 2개)
            let estimatedAnnualDividend = estimateHoldingsDividend()
            HStack(spacing: 12) {
                statCard(title: "예상 월배당", value: PortfolioCalculator.formatNumber(estimatedAnnualDividend / 12) + "원", color: TossColors.green, bgColor: TossColors.green.opacity(0.08))
                statCard(title: "예상 연배당", value: PortfolioCalculator.formatNumber(estimatedAnnualDividend) + "원", color: TossColors.green, bgColor: TossColors.green.opacity(0.08))
            }

            // 총 손익 / 총 수익률 / 가중평균 배당률
            VStack(spacing: 8) {
                statRow(label: "총 손익", value: "\(holdingsVM.totalProfitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatNumber(holdingsVM.totalProfitLoss))원",
                        color: holdingsVM.totalProfitLoss >= 0 ? theme.profitColor : theme.lossColor)
                statRow(label: "총 수익률", value: "\(holdingsVM.totalProfitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatPercent(holdingsVM.totalReturnRate))",
                        color: holdingsVM.totalProfitLoss >= 0 ? theme.profitColor : theme.lossColor)
                statRow(label: "가중평균 배당률", value: PortfolioCalculator.formatPercent(estimateWeightedDividendRate()),
                        color: theme.accentColor)
            }
            .padding(16)
            .background(theme.bgCard)
            .cornerRadius(16)
        }
        .padding(.horizontal, 16)
    }

    private func statCard(title: String, value: String, color: Color, bgColor: Color? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)
            Text(value)
                .font(TossTypography.bodyLarge)
                .foregroundColor(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(bgColor ?? theme.bgCard)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(bgColor == nil ? theme.border : Color.clear, lineWidth: bgColor == nil ? 1 : 0)
        )
    }

    private func statRow(label: String, value: String, color: Color) -> some View {
        HStack {
            Text(label)
                .font(TossTypography.body)
                .foregroundColor(theme.textSecondary)
            Spacer()
            Text(value)
                .font(TossTypography.bodyLarge)
                .foregroundColor(color)
        }
    }

    // MARK: - Helpers

    private func sortedEvaluations() -> [HoldingEvaluation] {
        holdingsVM.evaluations.sorted { a, b in
            let result: Bool
            switch sortKey {
            case "종목명": result = a.item.name < b.item.name
            case "평가액": result = a.evalAmount < b.evalAmount
            case "손익": result = a.profitLoss < b.profitLoss
            case "수익률": result = a.returnRate < b.returnRate
            default: result = a.item.category < b.item.category
            }
            return sortAscending ? result : !result
        }
    }

    private func estimateHoldingsDividend() -> Int {
        guard let portfolio = portfolioVM.selectedPortfolio else { return 0 }
        var total = 0
        for eval in holdingsVM.evaluations {
            let stock = portfolio.stocks.first { $0.code == eval.item.code }
            let rate = stock?.dividendRate ?? 0
            total += Int(round(Double(eval.evalAmount) * rate))
        }
        return total
    }

    private func estimateWeightedDividendRate() -> Double {
        guard let portfolio = portfolioVM.selectedPortfolio, holdingsVM.totalEval > 0 else { return 0 }
        var weighted = 0.0
        for eval in holdingsVM.evaluations {
            let stock = portfolio.stocks.first { $0.code == eval.item.code }
            let rate = stock?.dividendRate ?? 0
            weighted += rate * (Double(eval.evalAmount) / Double(holdingsVM.totalEval))
        }
        return weighted
    }

    private func formatBigAmount(_ amount: Int) -> String {
        if amount >= 100_000_000 {
            let billionPart = Double(amount) / 100_000_000
            return String(format: "%.1f억원", billionPart)
        } else if amount >= 10_000 {
            let manPart = Double(amount) / 10_000
            return String(format: "%.0f만원", manPart)
        }
        return PortfolioCalculator.formatNumber(amount) + "원"
    }
}
