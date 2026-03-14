import SwiftUI

struct AllocationTab: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    @State private var allocationVM = AllocationViewModel()
    @State private var editingAmount = ""
    @State private var isEditingAmount = false
    @State private var sortKey = "구분"
    @State private var sortAscending = true

    private let sortOptions = ["구분", "종목명", "비중", "투자금액", "연배당", "배당률"]

    var body: some View {
        ZStack {
            theme.bgPrimary.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    if let portfolio = viewModel.selectedPortfolio {
                        // 투자금액 편집 가능 필드
                        investmentHeader(portfolio)

                        // 정렬 칩 바
                        SortChipBar(options: sortOptions, selected: $sortKey, ascending: $sortAscending)

                        if let totals = allocationVM.totals {
                            stockAllocations(totals, portfolio: portfolio)
                            totalsSummary(totals)
                        }
                    }
                }
                .padding(.top, 8)
            }
        }
        .onChange(of: viewModel.selectedPortfolio?.stocks.count) {
            recalculate()
        }
        .onAppear { recalculate() }
    }

    // MARK: - 투자금액 (편집 가능)

    private func investmentHeader(_ portfolio: Portfolio) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("투자금액")
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)

            HStack {
                if isEditingAmount {
                    TextField("투자금액", text: $editingAmount)
                        .font(TossTypography.sectionTitle)
                        .foregroundColor(theme.textPrimary)
                        #if os(iOS)
                        .keyboardType(.numberPad)
                        #endif
                        .onSubmit { commitAmountEdit(portfolio) }
                    Button("확인") { commitAmountEdit(portfolio) }
                        .font(TossTypography.body)
                        .foregroundColor(theme.accentColor)
                } else {
                    Text(PortfolioCalculator.formatNumber(portfolio.investmentAmount) + "원")
                        .font(TossTypography.sectionTitle)
                        .foregroundColor(theme.textPrimary)
                    Spacer()
                    // "(= X억원)" 변환 표시
                    Text("(= \(formatBigAmount(portfolio.investmentAmount)))")
                        .font(TossTypography.caption)
                        .foregroundColor(theme.textSecondary)
                    Button {
                        editingAmount = "\(portfolio.investmentAmount)"
                        isEditingAmount = true
                    } label: {
                        Image(systemName: "pencil")
                            .font(.system(size: 14))
                            .foregroundColor(theme.textTertiary)
                    }
                }
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private func commitAmountEdit(_ portfolio: Portfolio) {
        if let amount = Int(editingAmount.replacingOccurrences(of: ",", with: "")), amount > 0 {
            viewModel.updateInvestmentAmount(portfolio, amount: amount)
            recalculate()
        }
        isEditingAmount = false
    }

    // MARK: - 종목별 배분

    private func stockAllocations(_ totals: PortfolioCalculator.PortfolioTotals, portfolio: Portfolio) -> some View {
        let sorted = sortedResults(totals.results)
        return VStack(spacing: 0) {
            ForEach(Array(sorted.enumerated()), id: \.element.stock.id) { _, result in
                HStack(spacing: 12) {
                    // 좌측: 카테고리 뱃지 (보유/종목 탭과 동일)
                    CategoryBadge(category: result.stock.category)

                    // 우측: 종목 정보
                    VStack(alignment: .leading, spacing: 4) {
                        // 1행: 종목명 + 투자금액
                        HStack {
                            Text(result.stock.name)
                                .font(TossTypography.bodyLarge)
                                .foregroundColor(theme.textPrimary)
                                .lineLimit(1)
                            Spacer()
                            Text(PortfolioCalculator.formatNumber(result.calc.actualAmount) + "원")
                                .font(TossTypography.bodyLarge)
                                .foregroundColor(theme.textPrimary)
                        }
                        // 2행: 비중·수량
                        Text(PortfolioCalculator.formatPercent(result.stock.targetWeight) + " \u{00B7} \(PortfolioCalculator.formatNumber(result.calc.quantity))주")
                            .font(TossTypography.caption)
                            .foregroundColor(theme.textSecondary)
                        // 3행: 연두색 미니 카드 (월배당/연배당)
                        HStack(spacing: 8) {
                            dividendMiniCard(title: "월배당", amount: result.calc.monthlyDividend)
                            dividendMiniCard(title: "연배당", amount: result.calc.annualDividend)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if result.stock.id != sorted.last?.stock.id {
                    Divider().padding(.leading, 76)
                }
            }
        }
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private func dividendMiniCard(title: String, amount: Int) -> some View {
        HStack(spacing: 4) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(TossColors.green)
            Text(PortfolioCalculator.formatNumber(amount) + "원")
                .font(TossTypography.caption)
                .foregroundColor(TossColors.green)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(TossColors.green.opacity(0.08))
        .cornerRadius(8)
    }

    // MARK: - 합계

    private func totalsSummary(_ totals: PortfolioCalculator.PortfolioTotals) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("합계")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)

            // 총투자 / 총매수수량 / 월배당 / 연배당 (4칸)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                summaryCard(title: "총투자", value: PortfolioCalculator.formatNumber(totals.totalActualAmount) + "원")
                summaryCard(title: "총 매수수량", value: "\(totals.results.reduce(0) { $0 + $1.calc.quantity })주")
                summaryCard(title: "월배당 합계", value: PortfolioCalculator.formatNumber(totals.totalMonthlyDividend) + "원", isGreen: true)
                summaryCard(title: "연배당 합계", value: PortfolioCalculator.formatNumber(totals.totalAnnualDividend) + "원", isGreen: true)
            }

            HStack {
                Text("가중평균 배당률")
                    .font(TossTypography.caption)
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

    private func summaryCard(title: String, value: String, isGreen: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(isGreen ? TossColors.green : theme.textSecondary)
            Text(value)
                .font(TossTypography.bodyLarge)
                .foregroundColor(isGreen ? TossColors.green : theme.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isGreen ? TossColors.green.opacity(0.08) : theme.bgPrimary)
        .cornerRadius(12)
    }

    // MARK: - Helpers

    private func sortedResults(_ results: [(stock: PortfolioStock, calc: StockCalcResult)]) -> [(stock: PortfolioStock, calc: StockCalcResult)] {
        results.sorted { a, b in
            let result: Bool
            switch sortKey {
            case "종목명": result = a.stock.name < b.stock.name
            case "비중": result = a.stock.targetWeight < b.stock.targetWeight
            case "투자금액": result = a.calc.actualAmount < b.calc.actualAmount
            case "연배당": result = a.calc.annualDividend < b.calc.annualDividend
            case "배당률": result = a.stock.dividendRate < b.stock.dividendRate
            default: result = a.stock.category < b.stock.category
            }
            return sortAscending ? result : !result
        }
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

    private func recalculate() {
        if let portfolio = viewModel.selectedPortfolio {
            allocationVM.calculate(portfolio: portfolio)
        }
    }
}
