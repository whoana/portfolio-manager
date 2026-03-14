import Foundation

enum PortfolioCalculator {

    // MARK: - calcStockAllocation (portfolioCalc.ts:3-15)

    static func calcStockAllocation(stock: PortfolioStock, totalAmount: Int) -> StockCalcResult {
        let investAmount = Int(round(Double(totalAmount) * stock.targetWeight))
        let quantity: Int = {
            guard let price = stock.currentPrice, price > 0 else { return 0 }
            return investAmount / price
        }()
        let actualAmount = quantity * (stock.currentPrice ?? 0)
        let monthlyDividend = Int(round(Double(actualAmount) * stock.dividendRate / 12.0))
        let annualDividend = Int(round(Double(actualAmount) * stock.dividendRate))
        return StockCalcResult(
            investAmount: investAmount,
            quantity: quantity,
            actualAmount: actualAmount,
            monthlyDividend: monthlyDividend,
            annualDividend: annualDividend
        )
    }

    // MARK: - calcPortfolioTotals (portfolioCalc.ts:17-60)

    struct PortfolioTotals {
        let results: [(stock: PortfolioStock, calc: StockCalcResult)]
        let totalWeight: Double
        let totalActualAmount: Int
        let totalMonthlyDividend: Int
        let totalAnnualDividend: Int
        let weightedDividendRate: Double
    }

    static func calcPortfolioTotals(stocks: [PortfolioStock], totalAmount: Int) -> PortfolioTotals {
        let results = stocks.map { stock in
            (stock: stock, calc: calcStockAllocation(stock: stock, totalAmount: totalAmount))
        }
        let totalWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        let totalActualAmount = results.reduce(0) { $0 + $1.calc.actualAmount }
        let totalMonthlyDividend = results.reduce(0) { $0 + $1.calc.monthlyDividend }
        let totalAnnualDividend = results.reduce(0) { $0 + $1.calc.annualDividend }

        let weightedDividendRate: Double = {
            guard totalActualAmount > 0 else { return 0 }
            return stocks.reduce(0.0) { sum, s in
                let calc = calcStockAllocation(stock: s, totalAmount: totalAmount)
                return sum + s.dividendRate * (Double(calc.actualAmount) / Double(totalActualAmount))
            }
        }()

        return PortfolioTotals(
            results: results,
            totalWeight: totalWeight,
            totalActualAmount: totalActualAmount,
            totalMonthlyDividend: totalMonthlyDividend,
            totalAnnualDividend: totalAnnualDividend,
            weightedDividendRate: weightedDividendRate
        )
    }

    // MARK: - calcCategoryPositions (portfolioCalc.ts:68-84)

    struct CategoryPosition: Identifiable {
        var id: String { category }
        let category: String
        let amount: Int
        let weight: Double
    }

    static func calcCategoryPositions(stocks: [PortfolioStock], investmentAmount: Int) -> [CategoryPosition] {
        var categoryMap: [String: Double] = [:]
        for s in stocks {
            categoryMap[s.category, default: 0] += s.targetWeight
        }
        let totalWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        return categoryMap.map { category, weight in
            CategoryPosition(
                category: category,
                amount: Int(round(weight * Double(investmentAmount))),
                weight: totalWeight > 0 ? weight / totalWeight : 0
            )
        }
    }

    // MARK: - Formatters (portfolioCalc.ts:86-92)

    private static let numberFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "ko_KR")
        return f
    }()

    static func formatNumber(_ n: Int) -> String {
        numberFormatter.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    static func formatPercent(_ n: Double) -> String {
        String(format: "%.1f%%", n * 100)
    }
}
