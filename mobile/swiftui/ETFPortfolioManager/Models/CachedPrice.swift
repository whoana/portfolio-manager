import Foundation
import SwiftData

@Model
final class CachedPrice {
    @Attribute(.unique) var code: String
    var price: Int
    var name: String
    var fetchedAt: Date

    init(code: String, price: Int, name: String) {
        self.code = code
        self.price = price
        self.name = name
        self.fetchedAt = Date()
    }
}
