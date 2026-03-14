import SwiftUI

struct SharedPortfolioHeader: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    @State private var showCreatePortfolio = false
    @State private var newPortfolioName = ""
    @State private var allocationVM = AllocationViewModel()
    @State private var showDeleteConfirm = false
    @State private var portfolioToDelete: Portfolio?

    var body: some View {
        VStack(spacing: 12) {
            // 포트폴리오 선택기 (수평 스크롤 칩)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(viewModel.portfolios) { portfolio in
                        let isSelected = viewModel.selectedPortfolio?.id == portfolio.id
                        HStack(spacing: 4) {
                            Button {
                                viewModel.selectedPortfolio = portfolio
                                Haptics.selection()
                                recalculate()
                            } label: {
                                Text(portfolio.name)
                                    .font(TossTypography.body)
                            }
                            .buttonStyle(.plain)

                            // 선택된 포트폴리오에만 X(삭제) 버튼 표시
                            if isSelected && viewModel.portfolios.count > 1 {
                                Button {
                                    portfolioToDelete = portfolio
                                    showDeleteConfirm = true
                                } label: {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(isSelected ? .white.opacity(0.7) : theme.textTertiary)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(isSelected ? theme.accentColor : theme.bgCard)
                        .foregroundColor(isSelected ? .white : theme.textPrimary)
                        .cornerRadius(20)
                    }

                    Button {
                        showCreatePortfolio = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "plus")
                                .font(.system(size: 12, weight: .bold))
                            Text("새 포트폴리오")
                                .font(TossTypography.body)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(theme.bgCard)
                        .foregroundColor(theme.textSecondary)
                        .cornerRadius(20)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
            }

            // 히어로 카드
            if let portfolio = viewModel.selectedPortfolio {
                heroCard(portfolio)
            }
        }
        .onAppear { recalculate() }
        .onChange(of: viewModel.selectedPortfolio?.stocks.count) { recalculate() }
        .onChange(of: viewModel.selectedPortfolio?.id) { recalculate() }
        .alert("새 포트폴리오", isPresented: $showCreatePortfolio) {
            TextField("이름", text: $newPortfolioName)
            Button("생성") {
                if !newPortfolioName.isEmpty {
                    viewModel.createPortfolio(name: newPortfolioName)
                    newPortfolioName = ""
                }
            }
            Button("취소", role: .cancel) { newPortfolioName = "" }
        }
        .alert("포트폴리오 삭제", isPresented: $showDeleteConfirm) {
            Button("삭제", role: .destructive) {
                if let portfolio = portfolioToDelete {
                    viewModel.deletePortfolio(portfolio)
                    portfolioToDelete = nil
                    recalculate()
                }
            }
            Button("취소", role: .cancel) { portfolioToDelete = nil }
        } message: {
            Text("\"\(portfolioToDelete?.name ?? "")\" 포트폴리오를 삭제하시겠습니까?")
        }
    }

    private func heroCard(_ portfolio: Portfolio) -> some View {
        let totals = allocationVM.totals

        return VStack(alignment: .leading, spacing: 12) {
            Text(portfolio.name)
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)

            Text(PortfolioCalculator.formatNumber(portfolio.investmentAmount) + "원")
                .font(TossTypography.heroAmount)
                .foregroundColor(theme.textPrimary)

            // 3칸 그리드: 월배당(연두) / 연배당(연두) / 종목수(파란)
            HStack(spacing: 10) {
                miniInfoCard(
                    title: "월배당",
                    value: PortfolioCalculator.formatNumber(totals?.totalMonthlyDividend ?? 0) + "원",
                    color: TossColors.green
                )
                miniInfoCard(
                    title: "연배당",
                    value: PortfolioCalculator.formatNumber(totals?.totalAnnualDividend ?? 0) + "원",
                    color: TossColors.green
                )
                miniInfoCard(
                    title: "종목수",
                    value: "\(portfolio.stocks.count)개",
                    color: theme.accentColor
                )
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(20)
        .shadow(color: TossColors.shadow, radius: 8, y: 2)
        .padding(.horizontal, 16)
    }

    private func miniInfoCard(title: String, value: String, color: Color) -> some View {
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
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08))
        .cornerRadius(12)
    }

    private func recalculate() {
        if let portfolio = viewModel.selectedPortfolio {
            allocationVM.calculate(portfolio: portfolio)
        }
    }
}
