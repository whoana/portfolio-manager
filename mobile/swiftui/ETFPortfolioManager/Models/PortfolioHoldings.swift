import Foundation
import SwiftData

@Model
final class HoldingItem: Identifiable {
    @Attribute(.unique) var id: String
    var category: String
    var name: String
    var code: String
    var reutersCode: String?
    var quantity: Int
    var avgPrice: Double
    var currentPrice: Int?

    init(
        id: String = "holding_\(UUID().uuidString)",
        category: String,
        name: String,
        code: String,
        reutersCode: String? = nil,
        quantity: Int,
        avgPrice: Double,
        currentPrice: Int? = nil
    ) {
        self.id = id
        self.category = category
        self.name = name
        self.code = code
        self.reutersCode = reutersCode
        self.quantity = quantity
        self.avgPrice = avgPrice
        self.currentPrice = currentPrice
    }
}

@Model
final class PortfolioHoldings: Identifiable {
    var id: String { portfolioId }
    @Attribute(.unique) var portfolioId: String
    @Relationship(deleteRule: .cascade) var items: [HoldingItem]
    var updatedAt: Date

    init(portfolioId: String, items: [HoldingItem] = []) {
        self.portfolioId = portfolioId
        self.items = items
        self.updatedAt = Date()
    }
}
