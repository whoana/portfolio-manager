import Foundation
import SwiftData

@Observable
final class PortfolioViewModel {
    var portfolios: [Portfolio] = []
    var selectedPortfolio: Portfolio?
    var isLoading = false
    var errorMessage: String?
    var searchResults: [StockSearchResult] = []
    var searchQuery = ""

    private let modelContext: ModelContext
    private let stockService = NaverStockService.shared

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchPortfolios()
    }

    // MARK: - CRUD

    func fetchPortfolios() {
        let descriptor = FetchDescriptor<Portfolio>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        portfolios = (try? modelContext.fetch(descriptor)) ?? []
        if selectedPortfolio == nil {
            selectedPortfolio = portfolios.first
        }
    }

    func createPortfolio(name: String) {
        let portfolio = Portfolio(name: name)
        modelContext.insert(portfolio)
        save()
        selectedPortfolio = portfolio
        fetchPortfolios()
    }

    func deletePortfolio(_ portfolio: Portfolio) {
        let deletedId = portfolio.id
        if selectedPortfolio?.id == deletedId {
            selectedPortfolio = nil
        }
        modelContext.delete(portfolio)
        save()
        fetchPortfolios()
    }

    func addStock(to portfolio: Portfolio, stock: PortfolioStock) {
        portfolio.stocks.append(stock)
        portfolio.updatedAt = Date()
        save()
    }

    func removeStock(from portfolio: Portfolio, stock: PortfolioStock) {
        portfolio.stocks.removeAll { $0.id == stock.id }
        portfolio.updatedAt = Date()
        save()
    }

    func updateStock(_ stock: PortfolioStock) {
        selectedPortfolio?.updatedAt = Date()
        save()
    }

    func updateInvestmentAmount(_ portfolio: Portfolio, amount: Int) {
        portfolio.investmentAmount = amount
        portfolio.updatedAt = Date()
        save()
    }

    // MARK: - 시세 갱신

    func refreshAllPrices() async {
        guard let portfolio = selectedPortfolio else { return }
        isLoading = true
        errorMessage = nil

        for stock in portfolio.stocks {
            let code = stock.reutersCode ?? stock.code
            if let result = await stockService.getStockPriceWithFallback(code: code) {
                await MainActor.run {
                    stock.currentPrice = result.price
                    if let dy = result.dividendYield, dy > 0 {
                        stock.dividendRate = dy / 100.0
                    }
                    cachePrice(result)
                }
            }
        }

        await MainActor.run {
            portfolio.updatedAt = Date()
            save()
            isLoading = false
            Haptics.success()
        }
    }

    func refreshSinglePrice(stock: PortfolioStock) async {
        let code = stock.reutersCode ?? stock.code
        if let result = await stockService.getStockPriceWithFallback(code: code) {
            await MainActor.run {
                stock.currentPrice = result.price
                save()
            }
        }
    }

    // MARK: - 종목 검색

    func searchStocks(query: String) async {
        guard !query.isEmpty else {
            await MainActor.run { searchResults = [] }
            return
        }
        do {
            let results = try await stockService.searchStocks(query: query)
            await MainActor.run { searchResults = results }
        } catch {
            await MainActor.run { searchResults = [] }
        }
    }

    // MARK: - 캐시

    private func cachePrice(_ result: StockPriceResult) {
        let descriptor = FetchDescriptor<CachedPrice>(
            predicate: #Predicate { $0.code == result.code }
        )
        if let existing = try? modelContext.fetch(descriptor).first {
            existing.price = result.price
            existing.name = result.name
            existing.fetchedAt = Date()
        } else {
            modelContext.insert(CachedPrice(code: result.code, price: result.price, name: result.name))
        }
    }

    func getCachedPrice(code: String) -> Int? {
        let descriptor = FetchDescriptor<CachedPrice>(
            predicate: #Predicate { $0.code == code }
        )
        return try? modelContext.fetch(descriptor).first?.price
    }

    // MARK: - 저장

    private func save() {
        try? modelContext.save()
    }
}
