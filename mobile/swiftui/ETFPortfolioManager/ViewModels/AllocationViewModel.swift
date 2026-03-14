import Foundation

@Observable
final class AllocationViewModel {

    var totals: PortfolioCalculator.PortfolioTotals?
    var categoryPositions: [PortfolioCalculator.CategoryPosition] = []

    func calculate(portfolio: Portfolio) {
        totals = PortfolioCalculator.calcPortfolioTotals(
            stocks: portfolio.stocks,
            totalAmount: portfolio.investmentAmount
        )
        categoryPositions = PortfolioCalculator.calcCategoryPositions(
            stocks: portfolio.stocks,
            investmentAmount: portfolio.investmentAmount
        )
    }
}
