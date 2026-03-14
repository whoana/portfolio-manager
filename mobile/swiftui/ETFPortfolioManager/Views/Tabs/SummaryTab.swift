import SwiftUI
import Charts

struct SummaryTab: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    @State private var allocationVM = AllocationViewModel()

    var body: some View {
        ZStack {
            theme.bgPrimary.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    if let portfolio = viewModel.selectedPortfolio,
                       let totals = allocationVM.totals {
                        // AssetHeroCard 제거 (Phase 1 공통 헤더로 대체)

                        // 카테고리별 배분 (도넛 차트 + 중앙 텍스트 + 카테고리 상세)
                        categoryChartSection(portfolio)

                        // 배당 카드 (큰 연두색 카드)
                        dividendCardsSection(totals)

                        // 통계 행
                        statsSection(totals, portfolio: portfolio)
                    }
                }
                .padding(.top, 8)
            }
        }
        .onAppear { recalculate() }
        .onChange(of: viewModel.selectedPortfolio?.stocks.count) { recalculate() }
    }

    // MARK: - 카테고리별 배분

    private func categoryChartSection(_ portfolio: Portfolio) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("카테고리별 배분")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)
                .padding(.horizontal, 20)

            if !allocationVM.categoryPositions.isEmpty {
                // 도넛 차트 + 중앙 "총 투자금 X억원" 텍스트
                Chart(allocationVM.categoryPositions) { item in
                    SectorMark(
                        angle: .value("비중", item.weight),
                        innerRadius: .ratio(0.55),
                        angularInset: 1.5
                    )
                    .foregroundStyle(CATEGORY_BG_COLORS[item.category] ?? TossColors.blue)
                    .annotation(position: .overlay) {
                        if item.weight > 0.08 {
                            Text(PortfolioCalculator.formatPercent(item.weight))
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                }
                .chartOverlay { _ in
                    VStack(spacing: 2) {
                        Text("총 투자금")
                            .font(TossTypography.caption)
                            .foregroundColor(theme.textSecondary)
                        Text(formatBigAmount(portfolio.investmentAmount))
                            .font(TossTypography.bodyLarge)
                            .foregroundColor(theme.textPrimary)
                    }
                }
                .chartLegend(.hidden)
                .frame(height: 200)
                .padding(.horizontal, 20)

                // 카테고리 목록: CategoryBadge + 이름 + 비중% + 금액
                VStack(spacing: 0) {
                    ForEach(allocationVM.categoryPositions) { item in
                        HStack(spacing: 12) {
                            CategoryBadge(category: item.category)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.category)
                                    .font(TossTypography.body)
                                    .foregroundColor(theme.textPrimary)
                                Text(PortfolioCalculator.formatPercent(item.weight))
                                    .font(TossTypography.caption)
                                    .foregroundColor(theme.textSecondary)
                            }

                            Spacer()

                            Text(PortfolioCalculator.formatNumber(item.amount) + "원")
                                .font(TossTypography.bodyLarge)
                                .foregroundColor(theme.textPrimary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)

                        if item.id != allocationVM.categoryPositions.last?.id {
                            Divider().padding(.leading, 76)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 16)
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    // MARK: - 배당 카드

    private func dividendCardsSection(_ totals: PortfolioCalculator.PortfolioTotals) -> some View {
        HStack(spacing: 12) {
            dividendBigCard(title: "예상 월배당", amount: totals.totalMonthlyDividend)
            dividendBigCard(title: "예상 연배당", amount: totals.totalAnnualDividend)
        }
        .padding(.horizontal, 16)
    }

    private func dividendBigCard(title: String, amount: Int) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(TossColors.green)
            Text(PortfolioCalculator.formatNumber(amount) + "원")
                .font(TossTypography.sectionTitle)
                .foregroundColor(TossColors.green)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TossColors.green.opacity(0.08))
        .cornerRadius(16)
    }

    // MARK: - 통계 행

    private func statsSection(_ totals: PortfolioCalculator.PortfolioTotals, portfolio: Portfolio) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("통계")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)

            HStack {
                Text("종목 수")
                    .font(TossTypography.body)
                    .foregroundColor(theme.textSecondary)
                Spacer()
                Text("\(portfolio.stocks.count)개")
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(theme.textPrimary)
            }
            HStack {
                Text("총 비중")
                    .font(TossTypography.body)
                    .foregroundColor(theme.textSecondary)
                Spacer()
                Text(PortfolioCalculator.formatPercent(totals.totalWeight))
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(theme.textPrimary)
            }
            HStack {
                Text("가중평균 배당률")
                    .font(TossTypography.body)
                    .foregroundColor(theme.textSecondary)
                Spacer()
                Text(PortfolioCalculator.formatPercent(totals.weightedDividendRate))
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(theme.accentColor)
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    // MARK: - Helpers

    private func formatBigAmount(_ amount: Int) -> String {
        if amount >= 100_000_000 {
            let billionPart = Double(amount) / 100_000_000
            return String(format: "%.0f억원", billionPart)
        } else if amount >= 10_000 {
            let manPart = Double(amount) / 10_000
            return String(format: "%.0f만원", manPart)
        }
        return PortfolioCalculator.formatNumber(amount) + "원"
    }

    private func recalculate() {
        if let portfolio = viewModel.selectedPortfolio {
            allocationVM.calculate(portfolio: portfolio)
        }
    }
}
