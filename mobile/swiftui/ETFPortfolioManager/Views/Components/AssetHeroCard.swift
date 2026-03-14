import SwiftUI

struct AssetHeroCard: View {
    @Environment(ThemeManager.self) private var theme
    let totalAsset: Int
    let profitLoss: Int
    let returnRate: Double
    let monthlyDividend: Int
    let annualDividend: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("내 투자")
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)

            Text(PortfolioCalculator.formatNumber(totalAsset) + "원")
                .font(TossTypography.heroAmount)
                .foregroundColor(theme.textPrimary)

            HStack(spacing: 4) {
                Image(systemName: profitLoss >= 0 ? "arrowtriangle.up.fill" : "arrowtriangle.down.fill")
                    .font(.system(size: 10))
                Text("\(profitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatNumber(profitLoss))원")
                Text("(\(PortfolioCalculator.formatPercent(returnRate)))")
            }
            .font(TossTypography.body)
            .foregroundColor(profitLoss >= 0 ? theme.profitColor : theme.lossColor)

            // 3칸 그리드: 월배당(연두) / 연배당(연두) / 종목수는 외부에서
            HStack(spacing: 10) {
                DividendMiniCard(title: "월배당", amount: monthlyDividend)
                DividendMiniCard(title: "연배당", amount: annualDividend)
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(20)
        .shadow(color: TossColors.shadow, radius: 8, y: 2)
    }
}

struct DividendMiniCard: View {
    @Environment(ThemeManager.self) private var theme
    let title: String
    let amount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(TossColors.green)
            Text(PortfolioCalculator.formatNumber(amount) + "원")
                .font(TossTypography.bodyLarge)
                .foregroundColor(TossColors.green)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TossColors.green.opacity(0.08))
        .cornerRadius(12)
    }
}
