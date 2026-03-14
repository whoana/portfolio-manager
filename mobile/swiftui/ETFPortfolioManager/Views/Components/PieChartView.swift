import SwiftUI
import Charts

struct PieChartView: View {
    let data: [PortfolioCalculator.CategoryPosition]

    var body: some View {
        Chart(data) { item in
            SectorMark(
                angle: .value("비중", item.weight),
                innerRadius: .ratio(0.5),
                angularInset: 1.5
            )
            .foregroundStyle(CATEGORY_BG_COLORS[item.category] ?? TossColors.blue)
            .annotation(position: .overlay) {
                if item.weight > 0.08 {
                    Text(PortfolioCalculator.formatPercent(item.weight))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .chartLegend(position: .bottom, spacing: 8) {
            HStack(spacing: 16) {
                ForEach(data) { item in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(CATEGORY_BG_COLORS[item.category] ?? TossColors.blue)
                            .frame(width: 8, height: 8)
                        Text(item.category)
                            .font(TossTypography.caption)
                    }
                }
            }
        }
        .frame(height: 200)
    }
}
