import SwiftUI

struct WeightComparisonChart: View {
    @Environment(ThemeManager.self) private var theme
    let comparisons: [WeightComparison]
    @Binding var showByStock: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("목표 vs 실제 비중")
                    .font(TossTypography.sectionTitle)
                    .foregroundColor(theme.textPrimary)
                Spacer()
                // 구분별 / 종목별 토글
                HStack(spacing: 0) {
                    toggleButton(title: "구분별", isActive: !showByStock) {
                        showByStock = false
                    }
                    toggleButton(title: "종목별", isActive: showByStock) {
                        showByStock = true
                    }
                }
                .background(theme.bgPrimary)
                .cornerRadius(8)
            }

            ForEach(comparisons) { item in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(item.label)
                            .font(TossTypography.caption)
                            .foregroundColor(theme.textPrimary)
                            .lineLimit(1)
                        Spacer()
                        Text(String(format: "%.1f%%", item.diff * 100))
                            .font(TossTypography.caption)
                            .foregroundColor(item.diff >= 0 ? theme.profitColor : theme.lossColor)
                    }

                    // 목표 바 (검정)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(theme.textPrimary.opacity(0.2))
                                .frame(height: 8)

                            // 목표 바
                            RoundedRectangle(cornerRadius: 3)
                                .fill(theme.textPrimary.opacity(0.5))
                                .frame(width: max(CGFloat(item.targetWeight) * geo.size.width, 2), height: 8)
                        }
                    }
                    .frame(height: 8)

                    // 실제 바 (색상)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(theme.accentColor.opacity(0.15))
                                .frame(height: 8)

                            RoundedRectangle(cornerRadius: 3)
                                .fill(theme.accentColor)
                                .frame(width: max(CGFloat(item.actualWeight) * geo.size.width, 2), height: 8)
                        }
                    }
                    .frame(height: 8)

                    HStack {
                        HStack(spacing: 4) {
                            Circle().fill(theme.textPrimary.opacity(0.5)).frame(width: 6, height: 6)
                            Text("목표 \(String(format: "%.1f%%", item.targetWeight * 100))")
                                .font(.system(size: 10))
                                .foregroundColor(theme.textSecondary)
                        }
                        HStack(spacing: 4) {
                            Circle().fill(theme.accentColor).frame(width: 6, height: 6)
                            Text("실제 \(String(format: "%.1f%%", item.actualWeight * 100))")
                                .font(.system(size: 10))
                                .foregroundColor(theme.textSecondary)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding(20)
        .background(theme.bgCard)
        .cornerRadius(16)
    }

    private func toggleButton(title: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(TossTypography.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isActive ? theme.accentColor : Color.clear)
                .foregroundColor(isActive ? .white : theme.textSecondary)
                .cornerRadius(6)
        }
        .buttonStyle(.plain)
    }
}
