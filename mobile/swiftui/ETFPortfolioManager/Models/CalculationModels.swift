import Foundation

struct StockCalcResult {
    let investAmount: Int
    let quantity: Int
    let actualAmount: Int
    let monthlyDividend: Int
    let annualDividend: Int
}

struct StockSearchResult: Codable, Identifiable {
    var id: String { code }
    let name: String
    let code: String
    let reutersCode: String?
}

struct StockPriceResult: Codable {
    let code: String
    let name: String
    let price: Int
    let dividendYield: Double?
    let priceOriginal: Double?
    let currency: String?
    let exchangeRate: Double?
}

struct GrowthParams {
    var dividendGrowthRate: Double
    var annualAddition: Int
    var assetGrowthRate: Double

    static let `default` = GrowthParams(
        dividendGrowthRate: 0.04,
        annualAddition: 12_000_000,
        assetGrowthRate: 0.07
    )
}

struct YearlyGrowthRow: Identifiable {
    let id: Int
    let year: Int
    let assetValue: Int
    let totalInvested: Int
    let annualDividend: Int
    let monthlyDividend: Int
    let dividendRate: Double

    init(year: Int, assetValue: Int, totalInvested: Int,
         annualDividend: Int, monthlyDividend: Int, dividendRate: Double) {
        self.id = year
        self.year = year
        self.assetValue = assetValue
        self.totalInvested = totalInvested
        self.annualDividend = annualDividend
        self.monthlyDividend = monthlyDividend
        self.dividendRate = dividendRate
    }
}

struct HoldingEvaluation: Identifiable {
    var id: String { item.id }
    let item: HoldingItem
    let investAmount: Int
    let evalAmount: Int
    let profitLoss: Int
    let returnRate: Double
}

struct CategoryEvaluation: Identifiable {
    var id: String { category }
    let category: String
    let investAmount: Int
    let evalAmount: Int
    let profitLoss: Int
    let returnRate: Double
}

struct WeightComparison: Identifiable {
    var id: String { label }
    let label: String
    let targetWeight: Double
    let actualWeight: Double
    let diff: Double
}
