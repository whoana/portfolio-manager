import SwiftUI

enum TossColors {
    static let blue = Color(hex: "#3182F6")
    static let red = Color(hex: "#F04452")
    static let green = Color(hex: "#00C853")

    static let textPrimary = Color(hex: "#191F28")
    static let textSecondary = Color(hex: "#8B95A1")
    static let textTertiary = Color(hex: "#B0B8C1")

    static let bgPrimary = Color(hex: "#F4F4F4")
    static let bgCard = Color.white
    static let border = Color(hex: "#EDEFF1")
    static let shadow = Color.black.opacity(0.04)
}

enum DarkColors {
    static let blue = Color(hex: "#5B9CF6")
    static let red = Color(hex: "#FF6B6B")
    static let green = Color(hex: "#4ADE80")

    static let textPrimary = Color(hex: "#E5E7EB")
    static let textSecondary = Color(hex: "#9CA3AF")
    static let textTertiary = Color(hex: "#6B7280")

    static let bgPrimary = Color(hex: "#111827")
    static let bgCard = Color(hex: "#1F2937")
    static let border = Color(hex: "#374151")
    static let shadow = Color.black.opacity(0.1)
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}
