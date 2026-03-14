import SwiftUI

enum AppTheme: String, CaseIterable, Identifiable {
    case toss = "토스"
    case dark = "다크"

    var id: String { rawValue }

    var colorScheme: ColorScheme? {
        switch self {
        case .toss: return .light
        case .dark: return .dark
        }
    }
}

@Observable
final class ThemeManager {
    var currentTheme: AppTheme {
        didSet { UserDefaults.standard.set(currentTheme.rawValue, forKey: "app_theme") }
    }
    var followSystem: Bool {
        didSet { UserDefaults.standard.set(followSystem, forKey: "follow_system") }
    }

    var accentColor: Color {
        currentTheme == .dark ? DarkColors.blue : TossColors.blue
    }

    var textPrimary: Color {
        currentTheme == .dark ? DarkColors.textPrimary : TossColors.textPrimary
    }

    var textSecondary: Color {
        currentTheme == .dark ? DarkColors.textSecondary : TossColors.textSecondary
    }

    var textTertiary: Color {
        currentTheme == .dark ? DarkColors.textTertiary : TossColors.textTertiary
    }

    var bgPrimary: Color {
        currentTheme == .dark ? DarkColors.bgPrimary : TossColors.bgPrimary
    }

    var bgCard: Color {
        currentTheme == .dark ? DarkColors.bgCard : TossColors.bgCard
    }

    var border: Color {
        currentTheme == .dark ? DarkColors.border : TossColors.border
    }

    var profitColor: Color {
        currentTheme == .dark ? DarkColors.red : TossColors.red
    }

    var lossColor: Color {
        currentTheme == .dark ? DarkColors.blue : TossColors.blue
    }

    init() {
        let saved = UserDefaults.standard.string(forKey: "app_theme") ?? "토스"
        self.currentTheme = AppTheme(rawValue: saved) ?? .toss
        self.followSystem = UserDefaults.standard.bool(forKey: "follow_system")
    }

    func categoryColor(for category: String) -> Color {
        CATEGORY_BG_COLORS[category] ?? TossColors.blue
    }
}
