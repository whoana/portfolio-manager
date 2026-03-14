import SwiftUI

struct StockListRow: View {
    @Environment(ThemeManager.self) private var theme
    let stock: PortfolioStock
    var onTap: (() -> Void)?

    var body: some View {
        Button(action: { onTap?() }) {
            HStack(spacing: 12) {
                // 사각형 카테고리 뱃지 (웹앱과 동일)
                CategoryBadge(category: stock.category)

                VStack(alignment: .leading, spacing: 2) {
                    Text(stock.name)
                        .font(TossTypography.bodyLarge)
                        .foregroundColor(theme.textPrimary)
                        .lineLimit(1)
                    // 코드 · 비중% · 배당률% (웹앱과 동일, 중간점 구분)
                    Text("\(stock.code) \u{00B7} \(PortfolioCalculator.formatPercent(stock.targetWeight)) \u{00B7} \(PortfolioCalculator.formatPercent(stock.dividendRate))")
                        .font(TossTypography.caption)
                        .foregroundColor(theme.textSecondary)
                }

                Spacer()

                if let price = stock.currentPrice {
                    Text(PortfolioCalculator.formatNumber(price) + "원")
                        .font(TossTypography.bodyLarge)
                        .foregroundColor(theme.textPrimary)
                }
                // 꺽쇠(>) 아이콘 제거 (웹앱에 없음)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
        }
        .buttonStyle(.plain)
    }
}
