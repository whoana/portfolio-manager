import SwiftUI

struct GrowthTab: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    @State private var growthVM = GrowthViewModel()
    @State private var allocationVM = AllocationViewModel()
    @State private var sortKey = "연차"
    @State private var sortAscending = true

    private let sortOptions = ["연차", "평가금", "연배당금", "월배당금", "배당률"]

    var body: some View {
        ZStack {
            theme.bgPrimary.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    paramsCard

                    // 정렬 칩 바
                    SortChipBar(options: sortOptions, selected: $sortKey, ascending: $sortAscending)

                    growthList
                }
                .padding(.top, 8)
            }
        }
        .onAppear { recalculate() }
        .onChange(of: viewModel.selectedPortfolio?.stocks.count) { recalculate() }
    }

    private var paramsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("파라미터 조정")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)

            HStack(spacing: 12) {
                paramInput(
                    title: "배당성장",
                    value: Binding(
                        get: { growthVM.params.dividendGrowthRate * 100 },
                        set: { growthVM.params.dividendGrowthRate = $0 / 100; recalculate() }
                    ),
                    suffix: "%"
                )
                paramInput(
                    title: "추가투자",
                    value: Binding(
                        get: { Double(growthVM.params.annualAddition) / 10000 },
                        set: { growthVM.params.annualAddition = Int($0 * 10000); recalculate() }
                    ),
                    suffix: "만원"
                )
                paramInput(
                    title: "자산상승",
                    value: Binding(
                        get: { growthVM.params.assetGrowthRate * 100 },
                        set: { growthVM.params.assetGrowthRate = $0 / 100; recalculate() }
                    ),
                    suffix: "%"
                )
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private func paramInput(title: String, value: Binding<Double>, suffix: String) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)
            HStack(spacing: 2) {
                TextField("", value: value, format: .number.precision(.fractionLength(1)))
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(theme.textPrimary)
                    #if os(iOS)
                    .keyboardType(.decimalPad)
                    #endif
                    .multilineTextAlignment(.center)
                    .frame(width: 50)
                Text(suffix)
                    .font(TossTypography.caption)
                    .foregroundColor(theme.textSecondary)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(theme.bgPrimary)
        .cornerRadius(12)
    }

    private var growthList: some View {
        let sorted = sortedRows()
        return VStack(spacing: 0) {
            ForEach(sorted) { row in
                HStack(spacing: 8) {
                    // 원형 번호 뱃지
                    Text("\(row.year)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(row.year == 10 ? .white : theme.textSecondary)
                        .frame(width: 28, height: 28)
                        .background(row.year == 10 ? theme.accentColor : theme.bgPrimary)
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 2) {
                        // 금액 (10년차 accent 색상)
                        Text(PortfolioCalculator.formatNumber(row.assetValue) + "원")
                            .font(row.year == 10 ? TossTypography.bodyLarge : TossTypography.body)
                            .foregroundColor(row.year == 10 ? theme.accentColor : theme.textPrimary)
                    }

                    Spacer()

                    GeometryReader { geo in
                        let maxAsset = growthVM.rows.last?.assetValue ?? 1
                        let width = CGFloat(row.assetValue) / CGFloat(maxAsset) * geo.size.width
                        RoundedRectangle(cornerRadius: 4)
                            .fill(row.year == 10 ? theme.accentColor : theme.accentColor.opacity(0.3))
                            .frame(width: max(width, 4), height: 16)
                    }
                    .frame(width: 80, height: 16)

                    VStack(alignment: .trailing, spacing: 2) {
                        // 누적 투자금
                        Text("누적 \(formatBigAmount(row.totalInvested))")
                            .font(.system(size: 10))
                            .foregroundColor(theme.textTertiary)
                        // 월배당
                        Text("월 \(PortfolioCalculator.formatNumber(row.monthlyDividend))원")
                            .font(TossTypography.caption)
                            .foregroundColor(theme.textSecondary)
                        // 배당률
                        Text(PortfolioCalculator.formatPercent(row.dividendRate))
                            .font(.system(size: 10))
                            .foregroundColor(theme.accentColor)
                    }
                    .frame(width: 100, alignment: .trailing)
                }
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
                .background(row.year == 10 ? theme.accentColor.opacity(0.05) : Color.clear)

                if row.year < 10 { Divider().padding(.leading, 52) }
            }
        }
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    // MARK: - Helpers

    private func sortedRows() -> [YearlyGrowthRow] {
        growthVM.rows.sorted { a, b in
            let result: Bool
            switch sortKey {
            case "평가금": result = a.assetValue < b.assetValue
            case "연배당금": result = a.annualDividend < b.annualDividend
            case "월배당금": result = a.monthlyDividend < b.monthlyDividend
            case "배당률": result = a.dividendRate < b.dividendRate
            default: result = a.year < b.year
            }
            return sortAscending ? result : !result
        }
    }

    private func formatBigAmount(_ amount: Int) -> String {
        if amount >= 100_000_000 {
            let billionPart = Double(amount) / 100_000_000
            return String(format: "%.1f억", billionPart)
        } else if amount >= 10_000 {
            let manPart = Double(amount) / 10_000
            return String(format: "%.0f만", manPart)
        }
        return PortfolioCalculator.formatNumber(amount)
    }

    private func recalculate() {
        guard let portfolio = viewModel.selectedPortfolio else { return }
        allocationVM.calculate(portfolio: portfolio)
        let dividendRate = allocationVM.totals?.weightedDividendRate ?? 0
        growthVM.calculate(initialAmount: portfolio.investmentAmount, dividendRate: dividendRate)
    }
}
