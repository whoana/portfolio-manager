import Foundation
import SwiftData

@Observable
final class HoldingsViewModel {
    var holdings: PortfolioHoldings?
    var evaluations: [HoldingEvaluation] = []
    var totalInvest = 0
    var totalEval = 0
    var totalProfitLoss = 0
    var totalReturnRate = 0.0
    var categoryEvaluations: [CategoryEvaluation] = []
    var weightComparisons: [WeightComparison] = []
    var isLoading = false

    private let modelContext: ModelContext
    private let stockService = NaverStockService.shared

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func loadHoldings(portfolioId: String) {
        let descriptor = FetchDescriptor<PortfolioHoldings>(
            predicate: #Predicate { $0.portfolioId == portfolioId }
        )
        holdings = try? modelContext.fetch(descriptor).first
        recalculate()
    }

    func addHolding(portfolioId: String, item: HoldingItem) {
        if let h = holdings {
            h.items.append(item)
            h.updatedAt = Date()
        } else {
            let h = PortfolioHoldings(portfolioId: portfolioId, items: [item])
            modelContext.insert(h)
            holdings = h
        }
        save()
        recalculate()
    }

    func replaceAllHoldings(portfolioId: String, items: [HoldingItem]) {
        if let h = holdings {
            h.items.removeAll()
            h.items.append(contentsOf: items)
            h.updatedAt = Date()
        } else {
            let h = PortfolioHoldings(portfolioId: portfolioId, items: items)
            modelContext.insert(h)
            holdings = h
        }
        save()
        recalculate()
    }

    func removeHolding(_ item: HoldingItem) {
        holdings?.items.removeAll { $0.id == item.id }
        holdings?.updatedAt = Date()
        save()
        recalculate()
    }

    func refreshPrices() async {
        guard let items = holdings?.items else { return }
        isLoading = true

        for item in items {
            let code = item.reutersCode ?? item.code
            if let result = await stockService.getStockPriceWithFallback(code: code) {
                await MainActor.run { item.currentPrice = result.price }
            }
        }

        await MainActor.run {
            save()
            recalculate()
            isLoading = false
            Haptics.success()
        }
    }

    func compareWeights(stocks: [PortfolioStock]) {
        guard let items = holdings?.items else { return }
        weightComparisons = HoldingsCalculator.compareWeightsByCategory(
            stocks: stocks, holdings: items
        )
    }

    private func recalculate() {
        guard let items = holdings?.items else { return }
        let result = HoldingsCalculator.evaluateAllHoldings(items)
        evaluations = result.evaluations
        totalInvest = result.totalInvest
        totalEval = result.totalEval
        totalProfitLoss = result.totalProfitLoss
        totalReturnRate = result.totalReturnRate
        categoryEvaluations = HoldingsCalculator.calcCategoryEvaluations(items)
    }

    private func save() {
        try? modelContext.save()
    }
}
