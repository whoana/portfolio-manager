import SwiftUI

struct StocksTab: View {
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    @State private var showAddStock = false
    @State private var editingStock: PortfolioStock?
    @State private var sortKey = "구분"
    @State private var sortAscending = true

    private let sortOptions = ["구분", "종목명", "비중", "배당률", "현재가"]

    var body: some View {
        ZStack {
            theme.bgPrimary.ignoresSafeArea()

            if viewModel.portfolios.isEmpty {
                emptyState
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        // 액션 버튼 행 (웹앱과 동일: 갱신 + 추가) — 종목 유무와 관계없이 항상 표시
                        actionButtons

                        if let portfolio = viewModel.selectedPortfolio, !portfolio.stocks.isEmpty {
                            // 정렬 칩 바
                            SortChipBar(options: sortOptions, selected: $sortKey, ascending: $sortAscending)
                        }

                        stockList
                    }
                    .padding(.top, 8)
                }
            }
        }
        .refreshable {
            await viewModel.refreshAllPrices()
        }
        .sheet(isPresented: $showAddStock) {
            if let portfolio = viewModel.selectedPortfolio {
                AddStockSheet(viewModel: viewModel, portfolio: portfolio)
            }
        }
        .sheet(item: $editingStock) { stock in
            if let portfolio = viewModel.selectedPortfolio {
                AddStockSheet(viewModel: viewModel, portfolio: portfolio, editingStock: stock)
            }
        }
    }

    // MARK: - 액션 버튼 행

    private var actionButtons: some View {
        HStack(spacing: 10) {
            if let portfolio = viewModel.selectedPortfolio, !portfolio.stocks.isEmpty {
                Button {
                    Task { await viewModel.refreshAllPrices() }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 12))
                        Text("갱신")
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

            Spacer()

            Button {
                showAddStock = true
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
        }
        .padding(.horizontal, 16)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.pie")
                .font(.system(size: 48))
                .foregroundColor(theme.textTertiary)
            Text("포트폴리오가 없습니다")
                .font(TossTypography.sectionTitle)
                .foregroundColor(theme.textPrimary)
            Text("새 포트폴리오를 만들어 시작하세요")
                .font(TossTypography.body)
                .foregroundColor(theme.textSecondary)
        }
    }

    private var stockList: some View {
        VStack(spacing: 0) {
            if let portfolio = viewModel.selectedPortfolio {
                if viewModel.isLoading {
                    HStack(spacing: 8) {
                        ProgressView()
                        Text("시세 갱신 중...")
                            .font(TossTypography.caption)
                            .foregroundColor(theme.textSecondary)
                    }
                    .padding(.vertical, 12)
                }

                let sorted = sortedStocks(portfolio.stocks)
                ForEach(sorted) { stock in
                    StockListRow(stock: stock) {
                        editingStock = stock
                    }
                    if stock.id != sorted.last?.id {
                        Divider().padding(.leading, 76)
                    }
                }

                if portfolio.stocks.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 36))
                            .foregroundColor(theme.accentColor)
                        Text("종목을 추가해 주세요")
                            .font(TossTypography.body)
                            .foregroundColor(theme.textSecondary)
                        Button {
                            showAddStock = true
                        } label: {
                            Text("종목 검색 및 추가")
                                .font(TossTypography.body)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(theme.accentColor)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.vertical, 40)
                }
            }
        }
        .background(theme.bgCard)
        .cornerRadius(16)
        .padding(.horizontal, 16)
    }

    private func sortedStocks(_ stocks: [PortfolioStock]) -> [PortfolioStock] {
        stocks.sorted { a, b in
            let result: Bool
            switch sortKey {
            case "종목명": result = a.name < b.name
            case "비중": result = a.targetWeight < b.targetWeight
            case "배당률": result = a.dividendRate < b.dividendRate
            case "현재가": result = (a.currentPrice ?? 0) < (b.currentPrice ?? 0)
            default: result = a.category < b.category
            }
            return sortAscending ? result : !result
        }
    }
}
