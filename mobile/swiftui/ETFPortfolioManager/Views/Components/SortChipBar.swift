import SwiftUI

struct SortChipBar: View {
    @Environment(ThemeManager.self) private var theme
    let options: [String]
    @Binding var selected: String
    @Binding var ascending: Bool

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    Button {
                        if selected == option {
                            ascending.toggle()
                        } else {
                            selected = option
                            ascending = true
                        }
                        Haptics.selection()
                    } label: {
                        HStack(spacing: 4) {
                            Text(option)
                                .font(TossTypography.caption)
                            if selected == option {
                                Image(systemName: ascending ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 8, weight: .bold))
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(selected == option ? theme.accentColor : theme.bgCard)
                        .foregroundColor(selected == option ? .white : theme.textSecondary)
                        .cornerRadius(16)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }
}
