import Foundation
import SwiftData

// MARK: - Export/Import Codable Models

struct ExportFileFormat: Codable {
    let appName: String
    let version: Int
    let exportedAt: String
    let data: ExportData
}

struct ExportData: Codable {
    let portfolios: [ExportPortfolio]
    let holdings: [ExportHoldings]
    let settings: ExportSettings
}

struct ExportSettings: Codable {
    let theme: String
    let helpEnabled: Bool
}

struct ExportPortfolio: Codable {
    let id: String
    let name: String
    let stocks: [ExportStock]
    let investmentAmount: Int
    let createdAt: String
    let updatedAt: String
}

struct ExportStock: Codable {
    let id: String
    let category: String
    let name: String
    let code: String
    let reutersCode: String?
    let targetWeight: Double
    let dividendRate: Double
    let strategy: String
    let analysis: String
    let rationale: String
    let currentPrice: Int?
}

struct ExportHoldings: Codable {
    let portfolioId: String
    let items: [ExportHoldingItem]
    let updatedAt: String
}

struct ExportHoldingItem: Codable {
    let id: String
    let category: String
    let name: String
    let code: String
    let reutersCode: String?
    let quantity: Int
    let avgPrice: Int
    let currentPrice: Int?
}

// MARK: - DataManager

enum DataManager {

    private static let bom = "\u{FEFF}"
    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    // MARK: - CSV — 보유내역

    static func parseHoldingsCsv(_ text: String) -> (items: [HoldingItem], errors: [String]) {
        var items: [HoldingItem] = []
        var errors: [String] = []

        let cleaned = text.replacingOccurrences(of: bom, with: "")
        let lines = cleaned.components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        guard lines.count > 1 else {
            errors.append("CSV 파일에 데이터가 없습니다.")
            return (items, errors)
        }

        for (index, line) in lines.dropFirst().enumerated() {
            let cols = parseCsvLine(line)
            guard cols.count >= 5 else {
                errors.append("행 \(index + 2): 컬럼 수 부족 (\(cols.count)개)")
                continue
            }

            let category = cols[0]
            let name = cols[1]
            let code = cols[2]

            guard let quantity = Int(cols[3]) else {
                errors.append("행 \(index + 2): 수량 변환 실패 '\(cols[3])'")
                continue
            }
            guard let avgPrice = Double(cols[4]) else {
                errors.append("행 \(index + 2): 평단가 변환 실패 '\(cols[4])'")
                continue
            }

            let item = HoldingItem(
                category: category,
                name: name,
                code: code,
                quantity: quantity,
                avgPrice: avgPrice
            )
            items.append(item)
        }

        return (items, errors)
    }

    static func exportHoldingsCsv(_ items: [HoldingItem]) -> String {
        var csv = bom
        csv += "구분,종목,종목코드,수량,평단가\n"
        for item in items {
            let avgPriceInt = Int(item.avgPrice.rounded())
            csv += "\(escapeCsv(item.category)),\(escapeCsv(item.name)),\(item.code),\(item.quantity),\(avgPriceInt)\n"
        }
        return csv
    }

    static func exportHoldingsTemplate() -> String {
        return bom + "구분,종목,종목코드,수량,평단가\n"
    }

    // MARK: - CSV — 포트폴리오

    static func exportPortfolioCsv(_ stocks: [PortfolioStock]) -> String {
        var csv = bom
        csv += "구분,종목,종목코드,비중,배당률,전략\n"
        for stock in stocks {
            let weight = String(format: "%.1f", stock.targetWeight * 100)
            let dividend = String(format: "%.1f", stock.dividendRate * 100)
            csv += "\(escapeCsv(stock.category)),\(escapeCsv(stock.name)),\(stock.code),\(weight),\(dividend),\(escapeCsv(stock.strategy))\n"
        }
        return csv
    }

    // MARK: - JSON — 전체 백업

    static func exportAllData(
        portfolios: [Portfolio],
        allHoldings: [PortfolioHoldings],
        theme: String
    ) -> Data? {
        let exportPortfolios = portfolios.map { p in
            ExportPortfolio(
                id: p.id,
                name: p.name,
                stocks: p.stocks.map { s in
                    ExportStock(
                        id: s.id,
                        category: s.category,
                        name: s.name,
                        code: s.code,
                        reutersCode: s.reutersCode,
                        targetWeight: s.targetWeight,
                        dividendRate: s.dividendRate,
                        strategy: s.strategy,
                        analysis: s.analysis,
                        rationale: s.rationale,
                        currentPrice: s.currentPrice
                    )
                },
                investmentAmount: p.investmentAmount,
                createdAt: isoFormatter.string(from: p.createdAt),
                updatedAt: isoFormatter.string(from: p.updatedAt)
            )
        }

        let exportHoldings = allHoldings.map { h in
            ExportHoldings(
                portfolioId: h.portfolioId,
                items: h.items.map { item in
                    ExportHoldingItem(
                        id: item.id,
                        category: item.category,
                        name: item.name,
                        code: item.code,
                        reutersCode: item.reutersCode,
                        quantity: item.quantity,
                        avgPrice: Int(item.avgPrice.rounded()),
                        currentPrice: item.currentPrice
                    )
                },
                updatedAt: isoFormatter.string(from: h.updatedAt)
            )
        }

        let format = ExportFileFormat(
            appName: "etf-portfolio-manager",
            version: 1,
            exportedAt: isoFormatter.string(from: Date()),
            data: ExportData(
                portfolios: exportPortfolios,
                holdings: exportHoldings,
                settings: ExportSettings(theme: theme, helpEnabled: false)
            )
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try? encoder.encode(format)
    }

    static func parseBackupJson(_ data: Data) -> ExportFileFormat? {
        let decoder = JSONDecoder()
        return try? decoder.decode(ExportFileFormat.self, from: data)
    }

    // MARK: - JSON → SwiftData 적용

    static func applyBackupData(
        _ backup: ExportFileFormat,
        modelContext: ModelContext
    ) {
        // 1. 기존 데이터 삭제
        try? modelContext.delete(model: PortfolioStock.self)
        try? modelContext.delete(model: Portfolio.self)
        try? modelContext.delete(model: HoldingItem.self)
        try? modelContext.delete(model: PortfolioHoldings.self)

        // 2. 포트폴리오 복원
        for ep in backup.data.portfolios {
            let stocks = ep.stocks.map { es in
                PortfolioStock(
                    id: es.id,
                    category: es.category,
                    name: es.name,
                    code: es.code,
                    reutersCode: es.reutersCode,
                    targetWeight: es.targetWeight,
                    dividendRate: es.dividendRate,
                    strategy: es.strategy,
                    analysis: es.analysis,
                    rationale: es.rationale,
                    currentPrice: es.currentPrice
                )
            }

            let portfolio = Portfolio(
                id: ep.id,
                name: ep.name,
                stocks: stocks,
                investmentAmount: ep.investmentAmount
            )
            if let date = isoFormatter.date(from: ep.createdAt) {
                portfolio.createdAt = date
            }
            if let date = isoFormatter.date(from: ep.updatedAt) {
                portfolio.updatedAt = date
            }
            modelContext.insert(portfolio)
        }

        // 3. 보유내역 복원
        for eh in backup.data.holdings {
            let items = eh.items.map { ei in
                HoldingItem(
                    id: ei.id,
                    category: ei.category,
                    name: ei.name,
                    code: ei.code,
                    reutersCode: ei.reutersCode,
                    quantity: ei.quantity,
                    avgPrice: Double(ei.avgPrice),
                    currentPrice: ei.currentPrice
                )
            }
            let holdings = PortfolioHoldings(portfolioId: eh.portfolioId, items: items)
            if let date = isoFormatter.date(from: eh.updatedAt) {
                holdings.updatedAt = date
            }
            modelContext.insert(holdings)
        }

        try? modelContext.save()
    }

    // MARK: - Helpers

    private static func escapeCsv(_ value: String) -> String {
        if value.contains(",") || value.contains("\"") || value.contains("\n") {
            return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
        }
        return value
    }

    private static func parseCsvLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false

        for char in line {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                result.append(current)
                current = ""
            } else {
                current.append(char)
            }
        }
        result.append(current)
        return result
    }

    // MARK: - File Naming

    static func portfolioCsvFilename(name: String) -> String {
        "portfolio-\(name).csv"
    }

    static func holdingsCsvFilename() -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return "holdings-\(df.string(from: Date())).csv"
    }

    static let holdingsTemplateFilename = "holdings-template.csv"

    static func backupJsonFilename() -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        return "portfolio-backup-\(df.string(from: Date())).json"
    }
}
