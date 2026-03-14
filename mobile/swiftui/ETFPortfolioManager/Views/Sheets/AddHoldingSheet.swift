import SwiftUI

struct AddHoldingSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeManager.self) private var theme

    @Bindable var portfolioVM: PortfolioViewModel
    let holdingsVM: HoldingsViewModel
    let portfolioId: String

    @State private var name = ""
    @State private var code = ""
    @State private var reutersCode: String?
    @State private var category = "배당성장"
    @State private var quantity = ""
    @State private var avgPrice = ""
    @State private var showSearch = false

    var body: some View {
        NavigationStack {
            ZStack {
                theme.bgPrimary.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        // 종목 선택
                        VStack(alignment: .leading, spacing: 8) {
                            Text("종목")
                                .font(TossTypography.caption)
                                .foregroundColor(theme.textSecondary)
                            Button {
                                showSearch = true
                            } label: {
                                HStack {
                                    Text(name.isEmpty ? "종목 검색" : name)
                                        .foregroundColor(name.isEmpty ? theme.textTertiary : theme.textPrimary)
                                    Spacer()
                                    if !code.isEmpty {
                                        Text(code)
                                            .font(TossTypography.caption)
                                            .foregroundColor(theme.textSecondary)
                                    }
                                    Image(systemName: "magnifyingglass")
                                        .foregroundColor(theme.textTertiary)
                                }
                                .padding(14)
                                .background(theme.bgCard)
                                .cornerRadius(12)
                            }
                        }

                        // 카테고리
                        VStack(alignment: .leading, spacing: 8) {
                            Text("구분")
                                .font(TossTypography.caption)
                                .foregroundColor(theme.textSecondary)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(CATEGORY_OPTIONS, id: \.self) { cat in
                                        Button(cat) {
                                            category = cat
                                            Haptics.selection()
                                        }
                                        .font(TossTypography.body)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(category == cat ? theme.accentColor : theme.bgCard)
                                        .foregroundColor(category == cat ? .white : theme.textPrimary)
                                        .cornerRadius(20)
                                    }
                                }
                            }
                        }

                        // 수량 / 평균매입가
                        HStack(spacing: 12) {
                            inputField(title: "수량 (주)", text: $quantity, placeholder: "100", isNumber: true)
                            inputField(title: "평균매입가 (원)", text: $avgPrice, placeholder: "10000", isNumber: true)
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("보유내역 추가")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("추가") {
                        saveHolding()
                    }
                    .disabled(name.isEmpty || code.isEmpty || quantity.isEmpty || avgPrice.isEmpty)
                    .fontWeight(.bold)
                }
            }
            .sheet(isPresented: $showSearch) {
                StockSearchView(viewModel: portfolioVM) { result in
                    name = result.name
                    code = result.code
                    reutersCode = result.reutersCode
                    showSearch = false
                }
            }
        }
    }

    private func inputField(title: String, text: Binding<String>, placeholder: String, isNumber: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)
            TextField(placeholder, text: text)
                .font(TossTypography.body)
                #if os(iOS)
                .keyboardType(isNumber ? .decimalPad : .default)
                #endif
                .padding(14)
                .background(theme.bgCard)
                .cornerRadius(12)
        }
    }

    private func saveHolding() {
        guard let qty = Int(quantity),
              let price = Double(avgPrice) else { return }

        let item = HoldingItem(
            category: category,
            name: name,
            code: code,
            reutersCode: reutersCode,
            quantity: qty,
            avgPrice: price
        )
        holdingsVM.addHolding(portfolioId: portfolioId, item: item)
        Haptics.success()
        dismiss()
    }
}
