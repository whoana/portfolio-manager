import SwiftUI
import SwiftData
import UniformTypeIdentifiers

struct DataMenuSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Environment(ThemeManager.self) private var theme

    let portfolioVM: PortfolioViewModel
    let holdingsVM: HoldingsViewModel

    @State private var showCsvPicker = false
    @State private var showJsonPicker = false
    @State private var showOverwriteAlert = false
    @State private var pendingBackupData: Data?
    @State private var importResultMessage: String?
    @State private var showImportResult = false

    var body: some View {
        NavigationStack {
            List {
                Section("포트폴리오") {
                    menuRow(
                        icon: "square.and.arrow.up",
                        title: "포트폴리오 저장 (CSV)",
                        subtitle: "종목 구성을 CSV로 내보내기"
                    ) {
                        exportPortfolioCsv()
                    }
                }

                Section("보유내역") {
                    menuRow(
                        icon: "square.and.arrow.down",
                        title: "보유내역 들여오기 (CSV)",
                        subtitle: "CSV 파일에서 보유내역 가져오기"
                    ) {
                        showCsvPicker = true
                    }

                    menuRow(
                        icon: "square.and.arrow.up",
                        title: "보유내역 내보내기 (CSV)",
                        subtitle: "현재 보유내역을 CSV로 저장"
                    ) {
                        exportHoldingsCsv()
                    }

                    menuRow(
                        icon: "doc.text",
                        title: "보유내역 템플릿 내보내기",
                        subtitle: "빈 양식 CSV 다운로드"
                    ) {
                        exportHoldingsTemplate()
                    }
                }

                Section("전체 데이터") {
                    menuRow(
                        icon: "externaldrive",
                        title: "전체데이터 내보내기 (백업)",
                        subtitle: "모든 포트폴리오·보유내역을 JSON으로 백업"
                    ) {
                        exportBackupJson()
                    }

                    menuRow(
                        icon: "externaldrive.badge.plus",
                        title: "전체데이터 들여오기 (덮어씌우기)",
                        subtitle: "JSON 백업에서 복원 (기존 데이터 삭제)"
                    ) {
                        showJsonPicker = true
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(theme.bgPrimary)
            .navigationTitle("데이터 관리")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("완료") { dismiss() }
                }
            }
            .sheet(isPresented: $showCsvPicker) {
                DocumentPicker(types: [.commaSeparatedText, UTType(filenameExtension: "csv") ?? .commaSeparatedText]) { url in
                    importHoldingsCsv(from: url)
                }
            }
            .sheet(isPresented: $showJsonPicker) {
                DocumentPicker(types: [.json]) { url in
                    prepareJsonImport(from: url)
                }
            }
            .alert("전체데이터 덮어씌우기", isPresented: $showOverwriteAlert) {
                Button("취소", role: .cancel) {
                    pendingBackupData = nil
                }
                Button("덮어씌우기", role: .destructive) {
                    performJsonImport()
                }
            } message: {
                Text("기존 데이터가 모두 삭제되고 백업 데이터로 교체됩니다.\n이 작업은 되돌릴 수 없습니다.")
            }
            .alert("결과", isPresented: $showImportResult) {
                Button("확인") {}
            } message: {
                Text(importResultMessage ?? "")
            }
        }
    }

    // MARK: - Menu Row

    @ViewBuilder
    private func menuRow(icon: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(theme.accentColor)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.body)
                        .foregroundColor(theme.textPrimary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(theme.textSecondary)
                }
            }
        }
        .listRowBackground(theme.bgCard)
    }

    // MARK: - Export Actions

    private func exportPortfolioCsv() {
        guard let portfolio = portfolioVM.selectedPortfolio else { return }
        let csv = DataManager.exportPortfolioCsv(portfolio.stocks)
        shareFile(content: csv, filename: DataManager.portfolioCsvFilename(name: portfolio.name))
    }

    private func exportHoldingsCsv() {
        guard let items = holdingsVM.holdings?.items, !items.isEmpty else {
            importResultMessage = "내보낼 보유내역이 없습니다."
            showImportResult = true
            return
        }
        let csv = DataManager.exportHoldingsCsv(items)
        shareFile(content: csv, filename: DataManager.holdingsCsvFilename())
    }

    private func exportHoldingsTemplate() {
        let csv = DataManager.exportHoldingsTemplate()
        shareFile(content: csv, filename: DataManager.holdingsTemplateFilename)
    }

    private func exportBackupJson() {
        let allHoldings = fetchAllHoldings()
        let themeString = theme.currentTheme.rawValue
        guard let data = DataManager.exportAllData(
            portfolios: portfolioVM.portfolios,
            allHoldings: allHoldings,
            theme: themeString
        ) else { return }

        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(DataManager.backupJsonFilename())
        try? data.write(to: tempURL)
        ShareHelper.share(items: [tempURL])
    }

    // MARK: - Import Actions

    private func importHoldingsCsv(from url: URL) {
        guard url.startAccessingSecurityScopedResource() else {
            importResultMessage = "파일 접근 권한이 없습니다."
            showImportResult = true
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        guard let text = try? String(contentsOf: url, encoding: .utf8) else {
            importResultMessage = "파일을 읽을 수 없습니다."
            showImportResult = true
            return
        }

        guard let portfolioId = portfolioVM.selectedPortfolio?.id else {
            importResultMessage = "포트폴리오를 먼저 선택해주세요."
            showImportResult = true
            return
        }

        // 기존 보유내역 로드 후 교체 (기존 데이터 삭제 → 새 데이터로 대체)
        holdingsVM.loadHoldings(portfolioId: portfolioId)

        let (items, errors) = DataManager.parseHoldingsCsv(text)

        holdingsVM.replaceAllHoldings(portfolioId: portfolioId, items: items)

        if errors.isEmpty {
            importResultMessage = "기존 보유내역을 삭제하고 \(items.count)개를 가져왔습니다."
        } else {
            importResultMessage = "\(items.count)개 가져옴, \(errors.count)개 오류:\n" + errors.prefix(5).joined(separator: "\n")
        }
        showImportResult = true
    }

    private func prepareJsonImport(from url: URL) {
        guard url.startAccessingSecurityScopedResource() else {
            importResultMessage = "파일 접근 권한이 없습니다."
            showImportResult = true
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        guard let data = try? Data(contentsOf: url) else {
            importResultMessage = "파일을 읽을 수 없습니다."
            showImportResult = true
            return
        }

        guard DataManager.parseBackupJson(data) != nil else {
            importResultMessage = "유효하지 않은 백업 파일입니다."
            showImportResult = true
            return
        }

        pendingBackupData = data
        showOverwriteAlert = true
    }

    private func performJsonImport() {
        guard let data = pendingBackupData,
              let backup = DataManager.parseBackupJson(data) else { return }

        DataManager.applyBackupData(backup, modelContext: modelContext)

        // ViewModel 새로고침
        portfolioVM.fetchPortfolios()
        if let pid = portfolioVM.selectedPortfolio?.id {
            holdingsVM.loadHoldings(portfolioId: pid)
        }

        // 테마 복원
        if let newTheme = AppTheme.allCases.first(where: { $0.rawValue == backup.data.settings.theme }) {
            theme.currentTheme = newTheme
        }

        pendingBackupData = nil
        importResultMessage = "백업 데이터를 복원했습니다.\n포트폴리오 \(backup.data.portfolios.count)개, 보유내역 \(backup.data.holdings.count)개"
        showImportResult = true
    }

    // MARK: - Helpers

    private func shareFile(content: String, filename: String) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? content.write(to: tempURL, atomically: true, encoding: .utf8)
        ShareHelper.share(items: [tempURL])
    }

    private func fetchAllHoldings() -> [PortfolioHoldings] {
        let descriptor = FetchDescriptor<PortfolioHoldings>()
        return (try? modelContext.fetch(descriptor)) ?? []
    }
}
