import SwiftUI

struct AddStockSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeManager.self) private var theme
    @Bindable var viewModel: PortfolioViewModel
    let portfolio: Portfolio
    var editingStock: PortfolioStock?

    @State private var name = ""
    @State private var code = ""
    @State private var reutersCode: String?
    @State private var category = "배당성장"
    @State private var targetWeight = ""
    @State private var dividendRate = ""
    @State private var strategy = ""
    @State private var showSearch = false

    var isEditing: Bool { editingStock != nil }

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

                        // 목표비중 / 배당률
                        HStack(spacing: 12) {
                            inputField(title: "목표비중 (%)", text: $targetWeight, placeholder: "30.0")
                            inputField(title: "배당률 (%)", text: $dividendRate, placeholder: "3.5")
                        }

                        // 전략특성
                        inputField(title: "전략특성", text: $strategy, placeholder: "선택 입력")
                    }
                    .padding(20)
                }
            }
            .navigationTitle(isEditing ? "종목 수정" : "종목 추가")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isEditing ? "저장" : "추가") {
                        saveStock()
                    }
                    .disabled(name.isEmpty || code.isEmpty)
                    .fontWeight(.bold)
                }
            }
            .sheet(isPresented: $showSearch) {
                StockSearchView(viewModel: viewModel) { result in
                    name = result.name
                    code = result.code
                    reutersCode = result.reutersCode
                    showSearch = false
                    // 배당률 자동 조회 (웹앱 handleSelect 로직과 동일)
                    if dividendRate.isEmpty {
                        Task {
                            let lookupCode = result.reutersCode ?? result.code
                            if let priceResult = await NaverStockService.shared.getStockPriceWithFallback(code: lookupCode),
                               let dy = priceResult.dividendYield, dy > 0 {
                                await MainActor.run {
                                    if dividendRate.isEmpty {
                                        dividendRate = String(format: "%.1f", dy)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .onAppear {
                if let stock = editingStock {
                    name = stock.name
                    code = stock.code
                    reutersCode = stock.reutersCode
                    category = stock.category
                    targetWeight = String(format: "%.1f", stock.targetWeight * 100)
                    dividendRate = String(format: "%.1f", stock.dividendRate * 100)
                    strategy = stock.strategy
                }
            }
        }
    }

    private func inputField(title: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(TossTypography.caption)
                .foregroundColor(theme.textSecondary)
            TextField(placeholder, text: text)
                .font(TossTypography.body)
                #if os(iOS)
                .keyboardType(title.contains("%") ? .decimalPad : .default)
                #endif
                .padding(14)
                .background(theme.bgCard)
                .cornerRadius(12)
        }
    }

    private func saveStock() {
        let weight = (Double(targetWeight) ?? 0) / 100
        let dividend = (Double(dividendRate) ?? 0) / 100

        if let stock = editingStock {
            stock.name = name
            stock.code = code
            stock.reutersCode = reutersCode
            stock.category = category
            stock.targetWeight = weight
            stock.dividendRate = dividend
            stock.strategy = strategy
            viewModel.updateStock(stock)
        } else {
            let stock = PortfolioStock(
                category: category,
                name: name,
                code: code,
                reutersCode: reutersCode,
                targetWeight: weight,
                dividendRate: dividend,
                strategy: strategy
            )
            viewModel.addStock(to: portfolio, stock: stock)
        }

        Haptics.success()
        dismiss()
    }
}
