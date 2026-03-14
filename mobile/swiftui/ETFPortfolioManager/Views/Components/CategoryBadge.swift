import SwiftUI

struct CategoryBadge: View {
    @Environment(ThemeManager.self) private var theme
    let category: String

    var body: some View {
        // 웹앱과 동일: 56pt 사각형 rounded-xl, 카테고리명 전체 표시
        Text(category)
            .font(.system(size: 11, weight: .bold))
            .foregroundColor(.white)
            .multilineTextAlignment(.center)
            .lineLimit(2)
            .frame(width: 48, height: 48)
            .background(theme.categoryColor(for: category))
            .cornerRadius(12)
    }
}
