import SwiftUI

struct StockSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    let onSelect: (StockSearchResult) -> Void

    @State private var query = ""
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        NavigationStack {
            ZStack {
                theme.bgPrimary.ignoresSafeArea()

                VStack(spacing: 0) {
                    // 검색 입력
                    HStack(spacing: 12) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(theme.textTertiary)
                        TextField("종목명 또는 코드 검색", text: $query)
                            .font(TossTypography.body)
                            .autocorrectionDisabled()
                            #if os(iOS)
                            .textInputAutocapitalization(.never)
                            #endif
                        if !query.isEmpty {
                            Button {
                                query = ""
                                viewModel.searchResults = []
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(theme.textTertiary)
                            }
                        }
                    }
                    .padding(14)
                    .background(theme.bgCard)
                    .cornerRadius(12)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    // 검색 결과
                    List(viewModel.searchResults) { result in
                        Button {
                            onSelect(result)
                            dismiss()
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(result.name)
                                        .font(TossTypography.bodyLarge)
                                        .foregroundColor(theme.textPrimary)
                                    Text(result.reutersCode ?? result.code)
                                        .font(TossTypography.caption)
                                        .foregroundColor(theme.textSecondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(theme.textTertiary)
                            }
                            .padding(.vertical, 4)
                        }
                        .listRowBackground(theme.bgCard)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("종목 검색")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .onChange(of: query) { _, newValue in
                searchTask?.cancel()
                searchTask = Task {
                    try? await Task.sleep(for: .milliseconds(300))
                    guard !Task.isCancelled else { return }
                    await viewModel.searchStocks(query: newValue)
                }
            }
        }
    }
}
