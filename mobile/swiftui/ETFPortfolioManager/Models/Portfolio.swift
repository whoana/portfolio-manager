import Foundation
import SwiftData

@Model
final class PortfolioStock: Identifiable {
    @Attribute(.unique) var id: String
    var category: String
    var name: String
    var code: String
    var reutersCode: String?
    var targetWeight: Double
    var dividendRate: Double
    var strategy: String
    var analysis: String
    var rationale: String
    var currentPrice: Int?

    init(
        id: String = UUID().uuidString,
        category: String,
        name: String,
        code: String,
        reutersCode: String? = nil,
        targetWeight: Double,
        dividendRate: Double,
        strategy: String = "",
        analysis: String = "",
        rationale: String = "",
        currentPrice: Int? = nil
    ) {
        self.id = id
        self.category = category
        self.name = name
        self.code = code
        self.reutersCode = reutersCode
        self.targetWeight = targetWeight
        self.dividendRate = dividendRate
        self.strategy = strategy
        self.analysis = analysis
        self.rationale = rationale
        self.currentPrice = currentPrice
    }
}

@Model
final class Portfolio: Identifiable {
    @Attribute(.unique) var id: String
    var name: String
    @Relationship(deleteRule: .cascade) var stocks: [PortfolioStock]
    var investmentAmount: Int
    var createdAt: Date
    var updatedAt: Date

    init(
        id: String = UUID().uuidString,
        name: String,
        stocks: [PortfolioStock] = [],
        investmentAmount: Int = 100_000_000
    ) {
        self.id = id
        self.name = name
        self.stocks = stocks
        self.investmentAmount = investmentAmount
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}
