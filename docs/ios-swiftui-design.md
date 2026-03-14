# ETF 포트폴리오 매니저 — SwiftUI 네이티브 설계서

> 작성일: 2026-03-14
> 상태: 초안
> 기반 문서: `docs/ios-considerations.md`, `docs/mobile-toss-redesign.md`

---

## 1. 개요

기존 Next.js 14 웹앱의 전체 기능을 SwiftUI로 완전 재작성한다. 데이터 모델과 비즈니스 로직을 Swift로 포팅하고, 토스 스타일 UI를 네이티브 컴포넌트로 구현한다. iOS 전용 기능(WidgetKit, Face ID, iCloud)을 적극 활용하여 최상의 네이티브 경험을 제공한다.

---

## 2. 데이터 모델

`app/lib/types.ts`의 6개 인터페이스를 Swift `Codable` struct로 변환한다.

### 2.1 핵심 모델

```swift
import Foundation
import SwiftData

// MARK: - Portfolio Stock

@Model
final class PortfolioStock: Identifiable {
    @Attribute(.unique) var id: String
    var category: String          // "배당성장", "고배당", "성장동력", "안전판", "채권", "원자재", "기타"
    var name: String              // ETF 종목명
    var code: String              // 종목코드 (국내: "458730", 해외: "AAPL")
    var reutersCode: String?      // 해외: "AAPL.O", 국내: nil
    var targetWeight: Double      // 목표비중 (0~1)
    var dividendRate: Double      // 연배당률 (0~1)
    var strategy: String          // 전략특성
    var analysis: String          // 핵심역할
    var rationale: String         // 선정근거
    var currentPrice: Int?        // 현재가 (KRW)

    init(id: String = UUID().uuidString, category: String, name: String, code: String,
         reutersCode: String? = nil, targetWeight: Double, dividendRate: Double,
         strategy: String = "", analysis: String = "", rationale: String = "",
         currentPrice: Int? = nil) {
        self.id = id
        self.category = category
        self.name = name
        self.code = code
        self.reutersCode = reutersCode
        self.targetWeight = targetWeight
        self.dividendRate = dividendRate
        self.strategy = strategy
        self.analysis = analysis
        self.rationale = rationale
        self.currentPrice = currentPrice
    }
}

// MARK: - Portfolio

@Model
final class Portfolio: Identifiable {
    @Attribute(.unique) var id: String
    var name: String
    @Relationship(deleteRule: .cascade) var stocks: [PortfolioStock]
    var investmentAmount: Int      // 투자 원금 (원)
    var createdAt: Date
    var updatedAt: Date

    init(id: String = UUID().uuidString, name: String, stocks: [PortfolioStock] = [],
         investmentAmount: Int = 100_000_000) {
        self.id = id
        self.name = name
        self.stocks = stocks
        self.investmentAmount = investmentAmount
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// MARK: - Holding Item

@Model
final class HoldingItem: Identifiable {
    @Attribute(.unique) var id: String
    var category: String
    var name: String
    var code: String
    var reutersCode: String?
    var quantity: Int              // 보유수량
    var avgPrice: Double           // 평균매수단가 (원)
    var currentPrice: Int?         // 현재가

    init(id: String = "holding_\(Date().timeIntervalSince1970)", category: String,
         name: String, code: String, reutersCode: String? = nil,
         quantity: Int, avgPrice: Double, currentPrice: Int? = nil) {
        self.id = id
        self.category = category
        self.name = name
        self.code = code
        self.reutersCode = reutersCode
        self.quantity = quantity
        self.avgPrice = avgPrice
        self.currentPrice = currentPrice
    }
}

// MARK: - Portfolio Holdings

@Model
final class PortfolioHoldings: Identifiable {
    var id: String { portfolioId }
    @Attribute(.unique) var portfolioId: String
    @Relationship(deleteRule: .cascade) var items: [HoldingItem]
    var updatedAt: Date

    init(portfolioId: String, items: [HoldingItem] = []) {
        self.portfolioId = portfolioId
        self.items = items
        self.updatedAt = Date()
    }
}
```

### 2.2 계산용 구조체 (비영속)

```swift
// MARK: - Calculation Results (Non-persistent)

struct StockCalcResult {
    let investAmount: Int
    let quantity: Int
    let actualAmount: Int
    let monthlyDividend: Int
    let annualDividend: Int
}

struct StockSearchResult: Codable, Identifiable {
    var id: String { code }
    let name: String
    let code: String
    let reutersCode: String?
}

struct StockPriceResult: Codable {
    let code: String
    let name: String
    let price: Int              // KRW
    let dividendYield: Double?
    let priceOriginal: Double?  // 해외 원래 통화 가격
    let currency: String?
    let exchangeRate: Double?
}
```

### 2.3 TS → Swift 변환 규칙

| TypeScript | Swift | 비고 |
|-----------|-------|------|
| `string` | `String` | |
| `number` (정수 의미) | `Int` | `currentPrice`, `quantity` 등 |
| `number` (소수 의미) | `Double` | `targetWeight`, `dividendRate` 등 |
| `number?` / `undefined` | `Int?` / `Double?` | Optional |
| `interface` | `struct` (계산용) / `@Model class` (영속용) | SwiftData는 class 필요 |
| `Date.now()` 기반 ID | `UUID().uuidString` | 충돌 방지 |

---

## 3. 비즈니스 로직

웹앱의 3개 계산 모듈을 Swift로 1:1 포팅한다. 순수 함수로 유지하여 단위 테스트를 용이하게 한다.

### 3.1 PortfolioCalculator.swift

`portfolioCalc.ts` (93줄) → Swift 포팅

```swift
import Foundation

enum PortfolioCalculator {

    // portfolioCalc.ts:3-15 — calcStockAllocation
    static func calcStockAllocation(stock: PortfolioStock, totalAmount: Int) -> StockCalcResult {
        let investAmount = Int(round(Double(totalAmount) * stock.targetWeight))
        let quantity: Int = {
            guard let price = stock.currentPrice, price > 0 else { return 0 }
            return investAmount / price
        }()
        let actualAmount = quantity * (stock.currentPrice ?? 0)
        let monthlyDividend = Int(round(Double(actualAmount) * stock.dividendRate / 12.0))
        let annualDividend = Int(round(Double(actualAmount) * stock.dividendRate))
        return StockCalcResult(
            investAmount: investAmount,
            quantity: quantity,
            actualAmount: actualAmount,
            monthlyDividend: monthlyDividend,
            annualDividend: annualDividend
        )
    }

    // portfolioCalc.ts:17-60 — calcPortfolioTotals
    struct PortfolioTotals {
        let results: [(stock: PortfolioStock, calc: StockCalcResult)]
        let totalWeight: Double
        let totalActualAmount: Int
        let totalMonthlyDividend: Int
        let totalAnnualDividend: Int
        let weightedDividendRate: Double
    }

    static func calcPortfolioTotals(stocks: [PortfolioStock], totalAmount: Int) -> PortfolioTotals {
        let results = stocks.map { stock in
            (stock: stock, calc: calcStockAllocation(stock: stock, totalAmount: totalAmount))
        }
        let totalWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        let totalActualAmount = results.reduce(0) { $0 + $1.calc.actualAmount }
        let totalMonthlyDividend = results.reduce(0) { $0 + $1.calc.monthlyDividend }
        let totalAnnualDividend = results.reduce(0) { $0 + $1.calc.annualDividend }

        let weightedDividendRate: Double = {
            guard totalActualAmount > 0 else { return 0 }
            return stocks.reduce(0.0) { sum, s in
                let calc = calcStockAllocation(stock: s, totalAmount: totalAmount)
                return sum + s.dividendRate * (Double(calc.actualAmount) / Double(totalActualAmount))
            }
        }()

        return PortfolioTotals(
            results: results, totalWeight: totalWeight,
            totalActualAmount: totalActualAmount,
            totalMonthlyDividend: totalMonthlyDividend,
            totalAnnualDividend: totalAnnualDividend,
            weightedDividendRate: weightedDividendRate
        )
    }

    // portfolioCalc.ts:68-84 — calcCategoryPositions
    struct CategoryPosition {
        let category: String
        let amount: Int
        let weight: Double
    }

    static func calcCategoryPositions(stocks: [PortfolioStock], investmentAmount: Int) -> [CategoryPosition] {
        var categoryMap: [String: Double] = [:]
        for s in stocks {
            categoryMap[s.category, default: 0] += s.targetWeight
        }
        let totalWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        return categoryMap.map { (category, weight) in
            CategoryPosition(
                category: category,
                amount: Int(round(weight * Double(investmentAmount))),
                weight: totalWeight > 0 ? weight / totalWeight : 0
            )
        }
    }

    // portfolioCalc.ts:86-92 — formatNumber, formatPercent
    static func formatNumber(_ n: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = Locale(identifier: "ko_KR")
        return formatter.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    static func formatPercent(_ n: Double) -> String {
        String(format: "%.1f%%", n * 100)
    }
}
```

### 3.2 GrowthCalculator.swift

`growthCalc.ts` (55줄) → Swift 포팅

```swift
import Foundation

struct GrowthParams {
    var dividendGrowthRate: Double   // 연배당성장율 (e.g., 0.04)
    var annualAddition: Int          // 연추가투자금액 (원)
    var assetGrowthRate: Double      // 자산상승율 (e.g., 0.07)

    static let `default` = GrowthParams(
        dividendGrowthRate: 0.04,
        annualAddition: 12_000_000,
        assetGrowthRate: 0.07
    )
}

struct YearlyGrowthRow: Identifiable {
    let id: Int
    let year: Int
    let assetValue: Int
    let totalInvested: Int
    let annualDividend: Int
    let monthlyDividend: Int
    let dividendRate: Double

    init(year: Int, assetValue: Int, totalInvested: Int,
         annualDividend: Int, monthlyDividend: Int, dividendRate: Double) {
        self.id = year
        self.year = year
        self.assetValue = assetValue
        self.totalInvested = totalInvested
        self.annualDividend = annualDividend
        self.monthlyDividend = monthlyDividend
        self.dividendRate = dividendRate
    }
}

enum GrowthCalculator {

    static func calcGrowthReport(
        initialAmount: Int,
        initialDividendRate: Double,
        params: GrowthParams,
        years: Int = 10
    ) -> [YearlyGrowthRow] {
        var rows: [YearlyGrowthRow] = []
        var asset = Double(initialAmount)
        var totalInvested = Double(initialAmount)

        for year in 1...years {
            asset = asset * (1 + params.assetGrowthRate) + Double(params.annualAddition)
            totalInvested += Double(params.annualAddition)

            let dividendRate = initialDividendRate * pow(1 + params.dividendGrowthRate, Double(year))
            let annualDividend = Int(round(asset * dividendRate))
            let monthlyDividend = Int(round(Double(annualDividend) / 12.0))

            rows.append(YearlyGrowthRow(
                year: year,
                assetValue: Int(round(asset)),
                totalInvested: Int(round(totalInvested)),
                annualDividend: annualDividend,
                monthlyDividend: monthlyDividend,
                dividendRate: dividendRate
            ))
        }
        return rows
    }
}
```

### 3.3 HoldingsCalculator.swift

`holdingsCalc.ts` (123줄) → Swift 포팅

```swift
import Foundation

struct HoldingEvaluation: Identifiable {
    var id: String { item.id }
    let item: HoldingItem
    let investAmount: Int       // quantity * avgPrice
    let evalAmount: Int         // quantity * currentPrice
    let profitLoss: Int
    let returnRate: Double      // 0~1
}

struct CategoryEvaluation: Identifiable {
    var id: String { category }
    let category: String
    let investAmount: Int
    let evalAmount: Int
    let profitLoss: Int
    let returnRate: Double
}

struct WeightComparison: Identifiable {
    var id: String { label }
    let label: String
    let targetWeight: Double
    let actualWeight: Double
    let diff: Double
}

enum HoldingsCalculator {

    static func evaluateHolding(_ item: HoldingItem) -> HoldingEvaluation {
        let investAmount = item.quantity * Int(item.avgPrice)
        let evalAmount = item.quantity * (item.currentPrice ?? 0)
        let profitLoss = evalAmount - investAmount
        let returnRate = investAmount > 0 ? Double(profitLoss) / Double(investAmount) : 0
        return HoldingEvaluation(item: item, investAmount: investAmount,
                                  evalAmount: evalAmount, profitLoss: profitLoss,
                                  returnRate: returnRate)
    }

    static func evaluateAllHoldings(_ items: [HoldingItem])
        -> (evaluations: [HoldingEvaluation], totalInvest: Int, totalEval: Int,
            totalProfitLoss: Int, totalReturnRate: Double) {
        let evaluations = items.map { evaluateHolding($0) }
        let totalInvest = evaluations.reduce(0) { $0 + $1.investAmount }
        let totalEval = evaluations.reduce(0) { $0 + $1.evalAmount }
        let totalProfitLoss = totalEval - totalInvest
        let totalReturnRate = totalInvest > 0 ? Double(totalProfitLoss) / Double(totalInvest) : 0
        return (evaluations, totalInvest, totalEval, totalProfitLoss, totalReturnRate)
    }

    static func calcCategoryEvaluations(_ items: [HoldingItem]) -> [CategoryEvaluation] {
        var map: [String: (invest: Int, eval: Int)] = [:]
        for item in items {
            let invest = item.quantity * Int(item.avgPrice)
            let eval = item.quantity * (item.currentPrice ?? 0)
            let curr = map[item.category] ?? (invest: 0, eval: 0)
            map[item.category] = (invest: curr.invest + invest, eval: curr.eval + eval)
        }
        return map.map { (cat, data) in
            CategoryEvaluation(
                category: cat, investAmount: data.invest, evalAmount: data.eval,
                profitLoss: data.eval - data.invest,
                returnRate: data.invest > 0 ? Double(data.eval - data.invest) / Double(data.invest) : 0
            )
        }
    }

    static func compareWeightsByCategory(
        stocks: [PortfolioStock], holdings: [HoldingItem]
    ) -> [WeightComparison] {
        let totalTargetWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        var targetMap: [String: Double] = [:]
        stocks.forEach { targetMap[$0.category, default: 0] += $0.targetWeight }

        let totalEval = holdings.reduce(0) { $0 + $1.quantity * ($1.currentPrice ?? 0) }
        var actualMap: [String: Int] = [:]
        holdings.forEach { actualMap[$0.category, default: 0] += $0.quantity * ($0.currentPrice ?? 0) }

        let categories = Set(targetMap.keys).union(actualMap.keys)
        return categories.map { cat in
            let tw = totalTargetWeight > 0 ? (targetMap[cat] ?? 0) / totalTargetWeight : 0
            let aw = totalEval > 0 ? Double(actualMap[cat] ?? 0) / Double(totalEval) : 0
            return WeightComparison(label: cat, targetWeight: tw, actualWeight: aw, diff: aw - tw)
        }
    }

    static func compareWeightsByStock(
        stocks: [PortfolioStock], holdings: [HoldingItem]
    ) -> [WeightComparison] {
        let totalTargetWeight = stocks.reduce(0.0) { $0 + $1.targetWeight }
        let totalEval = holdings.reduce(0) { $0 + $1.quantity * ($1.currentPrice ?? 0) }

        var holdingEvalMap: [String: Int] = [:]
        holdings.forEach { holdingEvalMap[$0.code, default: 0] += $0.quantity * ($0.currentPrice ?? 0) }

        let codes = Set(stocks.map(\.code)).union(holdings.map(\.code))
        return codes.map { code in
            let stock = stocks.first { $0.code == code }
            let label = stock?.name ?? holdings.first { $0.code == code }?.name ?? code
            let tw = (stock != nil && totalTargetWeight > 0) ? stock!.targetWeight / totalTargetWeight : 0
            let aw = totalEval > 0 ? Double(holdingEvalMap[code] ?? 0) / Double(totalEval) : 0
            return WeightComparison(label: label, targetWeight: tw, actualWeight: aw, diff: aw - tw)
        }
    }
}
```

---

## 4. 저장소 레이어

### 4.1 SwiftData

| 용도 | 모델 | 비고 |
|------|------|------|
| 포트폴리오 | `Portfolio` + `PortfolioStock` | `@Relationship(deleteRule: .cascade)` |
| 보유 현황 | `PortfolioHoldings` + `HoldingItem` | 동일 |
| 시세 캐시 | `CachedPrice` | 오프라인 표시용. code + price + fetchedAt |
| 설정 | `@AppStorage` / `UserDefaults` | 테마, 도움말 토글 등 |

```swift
// SwiftData ModelContainer 설정
@main
struct PortfolioManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Portfolio.self, PortfolioHoldings.self, CachedPrice.self])
    }
}

@Model
final class CachedPrice {
    @Attribute(.unique) var code: String
    var price: Int
    var name: String
    var fetchedAt: Date

    init(code: String, price: Int, name: String) {
        self.code = code
        self.price = price
        self.name = name
        self.fetchedAt = Date()
    }
}
```

### 4.2 Keychain (민감 데이터)

- Face ID/Touch ID 보호 설정 상태
- 사용자 암호화 키 (iCloud 동기화 시)

```swift
import Security

enum KeychainService {
    static func save(key: String, data: Data) -> Bool { /* ... */ }
    static func load(key: String) -> Data? { /* ... */ }
    static func delete(key: String) -> Bool { /* ... */ }
}
```

### 4.3 iCloud 동기화

SwiftData의 `CloudKitConfiguration`을 활용:

```swift
let container = try ModelContainer(
    for: Portfolio.self, PortfolioHoldings.self,
    configurations: ModelConfiguration(cloudKitDatabase: .automatic)
)
```

- 설정 → iCloud 동기화 on/off 토글
- 첫 동기화 시 충돌 해결: 타임스탬프 기반 최신 데이터 우선

### 4.4 웹 데이터 이전

기존 웹앱의 `dataExportImport.ts` JSON 형식과 호환:

```swift
struct PortfolioExportData: Codable {
    let portfolios: [PortfolioCodable]
    let holdings: [PortfolioHoldingsCodable]
    let exportedAt: String
    let version: String
}

// JSON 파일 가져오기 (Files 앱 또는 공유 시트)
func importFromJSON(data: Data) throws {
    let export = try JSONDecoder().decode(PortfolioExportData.self, from: data)
    // SwiftData에 저장
}
```

---

## 5. 네이버 API 서비스

`app/api/stock/price/[code]/route.ts`와 `search/route.ts`의 로직을 `NaverStockService`로 통합한다. 앱에서 직접 호출하므로 프록시가 불필요하다.

### 5.1 NaverStockService

```swift
import Foundation

actor NaverStockService {

    static let shared = NaverStockService()

    private let headers: [String: String] = [
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://m.stock.naver.com"
    ]

    // MARK: - 해외 주식 감지 (route.ts:29-33)

    func isOverseasCode(_ code: String) -> Bool {
        if code.contains(".") { return true }
        // 순수 영문자만으로 구성 → 해외 (국내는 6자리 숫자)
        let pattern = /^[A-Za-z]+$/
        return code.wholeMatch(of: pattern) != nil
    }

    // MARK: - 거래소 접미사 (route.ts:66)
    private let exchangeSuffixes = [".O", ".N", ".A", ".K"]

    // MARK: - 국가별 환율/통화 매핑 (route.ts:37-48)
    private let nationToFX: [String: String] = [
        "USA": "FX_USDKRW", "JPN": "FX_JPYKRW", "HKG": "FX_HKDKRW",
        "GBR": "FX_GBPKRW", "CHN": "FX_CNYKRW", "EUR": "FX_EURKRW"
    ]
    private let nationToCurrency: [String: String] = [
        "USA": "USD", "JPN": "JPY", "HKG": "HKD",
        "GBR": "GBP", "CHN": "CNY", "EUR": "EUR"
    ]

    // MARK: - 종목 검색 (search/route.ts)

    func searchStocks(query: String) async throws -> [StockSearchResult] {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }

        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let url = URL(string: "https://ac.stock.naver.com/ac?q=\(encoded)&target=stock&st=111")!

        var request = URLRequest(url: url)
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }

        let (data, _) = try await URLSession.shared.data(for: request)

        struct ACResponse: Codable {
            struct Item: Codable {
                let name: String?
                let code: String?
                let reutersCode: String?
            }
            let items: [Item]?
        }

        let response = try JSONDecoder().decode(ACResponse.self, from: data)
        return (response.items ?? []).compactMap { item in
            guard let name = item.name, let code = item.code else { return nil }
            let rc = (item.reutersCode != nil && item.reutersCode != code) ? item.reutersCode : nil
            return StockSearchResult(name: name, code: code, reutersCode: rc)
        }
    }

    // MARK: - 시세 조회 (price/[code]/route.ts)

    func getStockPrice(code: String) async throws -> StockPriceResult {
        if isOverseasCode(code) {
            return try await fetchOverseasPrice(code: code)
        } else {
            return try await fetchDomesticPrice(code: code)
        }
    }

    // MARK: - 국내 시세 (route.ts:139-174)

    private func fetchDomesticPrice(code: String) async throws -> StockPriceResult {
        async let basicTask = fetchJSON(
            url: "https://m.stock.naver.com/api/stock/\(code)/basic"
        ) as NaverStockBasic
        async let integrationTask = fetchJSONOptional(
            url: "https://m.stock.naver.com/api/stock/\(code)/integration"
        ) as NaverIntegration?

        let basic = try await basicTask
        let integration = try? await integrationTask

        let price = Int(basic.closePrice?.replacingOccurrences(of: ",", with: "") ?? "0") ?? 0
        let dividendYield = integration?.etfKeyIndicator?.dividendYieldTtm

        return StockPriceResult(
            code: code, name: basic.stockName ?? code, price: price,
            dividendYield: dividendYield, priceOriginal: nil,
            currency: nil, exchangeRate: nil
        )
    }

    // MARK: - 해외 시세 (route.ts:68-136)

    private func fetchOverseasPrice(code: String) async throws -> StockPriceResult {
        let basic: NaverStockBasic = try await fetchOverseasBasic(code: code)

        let priceOriginal = Double(basic.closePrice?.replacingOccurrences(of: ",", with: "") ?? "0") ?? 0
        let nationCode = basic.stockExchangeType?.nationCode ?? "USA"
        let exchangeRate = await fetchExchangeRate(nationCode: nationCode)
        let price = Int(round(priceOriginal * exchangeRate))
        let currency = nationToCurrency[nationCode] ?? "USD"

        return StockPriceResult(
            code: code, name: basic.stockName ?? code, price: price,
            dividendYield: nil, priceOriginal: priceOriginal,
            currency: currency, exchangeRate: exchangeRate
        )
    }

    // 접미사 순차 시도 (route.ts:68-93)
    private func fetchOverseasBasic(code: String) async throws -> NaverStockBasic {
        if code.contains(".") {
            return try await fetchJSON(url: "https://api.stock.naver.com/stock/\(code)/basic")
        }

        // 원본 코드 먼저 시도
        if let result: NaverStockBasic = try? await fetchJSON(
            url: "https://api.stock.naver.com/stock/\(code)/basic"
        ) {
            return result
        }

        // 거래소 접미사 순차 시도
        for suffix in exchangeSuffixes {
            if let result: NaverStockBasic = try? await fetchJSON(
                url: "https://api.stock.naver.com/stock/\(code)\(suffix)/basic"
            ) {
                return result
            }
        }

        throw NaverAPIError.stockNotFound(code)
    }

    // MARK: - 환율 조회 (route.ts:51-63)

    private func fetchExchangeRate(nationCode: String) async -> Double {
        guard let fxCode = nationToFX[nationCode] else { return 1.0 }
        do {
            struct FXResponse: Codable {
                struct ExchangeInfo: Codable { let calcPrice: String? }
                let exchangeInfo: ExchangeInfo?
            }
            let data: FXResponse = try await fetchJSON(
                url: "https://api.stock.naver.com/marketindex/exchange/\(fxCode)"
            )
            return Double(data.exchangeInfo?.calcPrice ?? "1") ?? 1.0
        } catch {
            return 1.0
        }
    }

    // MARK: - 네트워크 헬퍼

    private func fetchJSON<T: Codable>(url: String) async throws -> T {
        guard let url = URL(string: url) else { throw NaverAPIError.invalidURL }
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw NaverAPIError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func fetchJSONOptional<T: Codable>(url: String) async -> T? {
        try? await fetchJSON(url: url)
    }
}

// MARK: - 응답 모델

private struct NaverStockBasic: Codable {
    let stockName: String?
    let closePrice: String?
    let stockExchangeType: StockExchangeType?

    struct StockExchangeType: Codable {
        let nationCode: String?
    }
}

private struct NaverIntegration: Codable {
    let etfKeyIndicator: ETFKeyIndicator?

    struct ETFKeyIndicator: Codable {
        let dividendYieldTtm: Double?
    }
}

enum NaverAPIError: LocalizedError {
    case invalidURL
    case httpError(Int)
    case stockNotFound(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "잘못된 URL입니다."
        case .httpError(let code): return "HTTP 오류 (\(code))"
        case .stockNotFound(let code): return "종목을 찾을 수 없습니다: \(code)"
        }
    }
}
```

### 5.2 폴백 전략

네이버가 모바일 User-Agent를 차단할 경우 기존 Next.js 프록시를 폴백으로 사용:

```swift
// NaverStockService 내
private let proxyBaseURL = "https://your-nextjs-app.vercel.app"

func getStockPriceWithFallback(code: String) async throws -> StockPriceResult {
    do {
        return try await getStockPrice(code: code)
    } catch {
        // 폴백: 웹 프록시 경유
        return try await fetchJSON(url: "\(proxyBaseURL)/api/stock/price/\(code)")
    }
}
```

### 5.3 캐싱

```swift
// 조회 성공 시 SwiftData에 캐싱
func cachePrice(_ result: StockPriceResult, context: ModelContext) {
    let cached = CachedPrice(code: result.code, price: result.price, name: result.name)
    context.insert(cached)
    try? context.save()
}

// 오프라인 시 캐시 조회
func getCachedPrice(code: String, context: ModelContext) -> CachedPrice? {
    let descriptor = FetchDescriptor<CachedPrice>(
        predicate: #Predicate { $0.code == code }
    )
    return try? context.fetch(descriptor).first
}
```

---

## 6. UI 아키텍처

### 6.1 토스 스타일 디자인 토큰

```swift
import SwiftUI

enum TossColors {
    static let blue = Color(hex: "#3182F6")        // 주요 액센트
    static let red = Color(hex: "#F04452")          // 상승 (한국식)
    static let green = Color(hex: "#00C853")        // 추가 강조

    static let textPrimary = Color(hex: "#191F28")
    static let textSecondary = Color(hex: "#8B95A1")
    static let textTertiary = Color(hex: "#B0B8C1")

    static let bgPrimary = Color(hex: "#F4F4F4")
    static let bgCard = Color.white
    static let border = Color(hex: "#EDEFF1")
    static let shadow = Color.black.opacity(0.04)

    // 카테고리 색상 (constants.ts 기반)
    static let categoryColors: [String: Color] = [
        "배당성장": Color(hex: "#3B82F6"),
        "고배당": Color(hex: "#8B5CF6"),
        "성장동력": Color(hex: "#10B981"),
        "안전판": Color(hex: "#94A3B8"),
        "채권": Color(hex: "#F59E0B"),
        "원자재": Color(hex: "#F97316"),
        "기타": Color(hex: "#06B6D4"),
    ]
}

enum TossTypography {
    static let heroAmount = Font.system(size: 32, weight: .bold)
    static let sectionTitle = Font.system(size: 18, weight: .bold)
    static let bodyLarge = Font.system(size: 16, weight: .medium)
    static let body = Font.system(size: 14, weight: .regular)
    static let caption = Font.system(size: 12, weight: .regular)
    static let tabLabel = Font.system(size: 11, weight: .medium)
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}
```

### 6.2 5탭 TabView

```swift
struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            StocksTab()
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "list.bullet.circle.fill" : "list.bullet.circle")
                    Text("종목")
                }
                .tag(0)

            AllocationTab()
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "chart.pie.fill" : "chart.pie")
                    Text("배분")
                }
                .tag(1)

            SummaryTab()
                .tabItem {
                    Image(systemName: selectedTab == 2 ? "square.grid.2x2.fill" : "square.grid.2x2")
                    Text("요약")
                }
                .tag(2)

            GrowthTab()
                .tabItem {
                    Image(systemName: selectedTab == 3 ? "chart.line.uptrend.xyaxis.circle.fill" : "chart.line.uptrend.xyaxis.circle")
                    Text("성장")
                }
                .tag(3)

            HoldingsTab()
                .tabItem {
                    Image(systemName: selectedTab == 4 ? "briefcase.fill" : "briefcase")
                    Text("보유")
                }
                .tag(4)
        }
        .tint(TossColors.blue)
    }
}
```

### 6.3 주요 컴포넌트 패턴

#### 히어로 자산 카드

```swift
struct AssetHeroCard: View {
    let totalAsset: Int
    let profitLoss: Int
    let returnRate: Double
    let monthlyDividend: Int
    let annualDividend: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("내 투자")
                .font(TossTypography.caption)
                .foregroundColor(TossColors.textSecondary)

            Text(PortfolioCalculator.formatNumber(totalAsset) + "원")
                .font(TossTypography.heroAmount)
                .foregroundColor(TossColors.textPrimary)

            HStack(spacing: 4) {
                Image(systemName: profitLoss >= 0 ? "arrowtriangle.up.fill" : "arrowtriangle.down.fill")
                    .font(.system(size: 10))
                Text("\(profitLoss >= 0 ? "+" : "")\(PortfolioCalculator.formatNumber(profitLoss))원")
                Text("(\(PortfolioCalculator.formatPercent(returnRate)))")
            }
            .font(TossTypography.body)
            .foregroundColor(profitLoss >= 0 ? TossColors.red : TossColors.blue)

            HStack(spacing: 12) {
                DividendMiniCard(title: "월배당", amount: monthlyDividend)
                DividendMiniCard(title: "연배당", amount: annualDividend)
            }
        }
        .padding(20)
        .background(TossColors.bgCard)
        .cornerRadius(20)
        .shadow(color: TossColors.shadow, radius: 8, y: 2)
    }
}
```

#### ListRow 패턴 (종목 리스트)

```swift
struct StockListRow: View {
    let stock: PortfolioStock

    var body: some View {
        HStack(spacing: 12) {
            // 카테고리 아이콘
            Circle()
                .fill(TossColors.categoryColors[stock.category] ?? TossColors.blue)
                .frame(width: 36, height: 36)
                .overlay(
                    Text(String(stock.category.prefix(1)))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(stock.name)
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(TossColors.textPrimary)
                    .lineLimit(1)
                Text("\(stock.code) · \(PortfolioCalculator.formatPercent(stock.targetWeight))")
                    .font(TossTypography.caption)
                    .foregroundColor(TossColors.textSecondary)
            }

            Spacer()

            if let price = stock.currentPrice {
                Text(PortfolioCalculator.formatNumber(price) + "원")
                    .font(TossTypography.bodyLarge)
                    .foregroundColor(TossColors.textPrimary)
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(TossColors.textTertiary)
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 20)
    }
}
```

### 6.4 테마 시스템

```swift
enum AppTheme: String, CaseIterable {
    case toss = "토스"
    case dark = "다크"

    var colorScheme: ColorScheme? {
        switch self {
        case .toss: return .light
        case .dark: return .dark
        }
    }
}

class ThemeManager: ObservableObject {
    @AppStorage("app_theme") var currentTheme: String = AppTheme.toss.rawValue
    @AppStorage("follow_system") var followSystem: Bool = true

    var theme: AppTheme {
        AppTheme(rawValue: currentTheme) ?? .toss
    }
}
```

---

## 7. iOS 전용 기능

### 7.1 WidgetKit — 자산 요약 위젯

```swift
import WidgetKit

struct PortfolioEntry: TimelineEntry {
    let date: Date
    let totalAsset: Int
    let profitLoss: Int
    let returnRate: Double
    let portfolioName: String
}

struct PortfolioWidgetView: View {
    let entry: PortfolioEntry

    var body: some View {
        VStack(alignment: .leading) {
            Text(entry.portfolioName)
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(PortfolioCalculator.formatNumber(entry.totalAsset) + "원")
                .font(.system(size: 20, weight: .bold))
            HStack {
                Image(systemName: entry.profitLoss >= 0 ? "arrowtriangle.up.fill" : "arrowtriangle.down.fill")
                Text(PortfolioCalculator.formatPercent(entry.returnRate))
            }
            .font(.caption)
            .foregroundColor(entry.profitLoss >= 0 ? .red : .blue)
        }
        .containerBackground(for: .widget) {
            Color.white
        }
    }
}
```

### 7.2 Face ID / Touch ID

```swift
import LocalAuthentication

class BiometricAuth {
    static func authenticate() async -> Bool {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return false
        }
        do {
            return try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "포트폴리오 데이터에 접근합니다"
            )
        } catch {
            return false
        }
    }
}
```

### 7.3 Pull-to-Refresh

```swift
struct StocksTab: View {
    @State private var isRefreshing = false

    var body: some View {
        List { /* ... */ }
            .refreshable {
                await refreshAllPrices()
            }
    }
}
```

### 7.4 햅틱 피드백

```swift
enum Haptics {
    static func light() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func medium() { UIImpactFeedbackGenerator(style: .medium).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
}
```

---

## 8. 프로젝트 구조

MVVM 패턴 기반:

```
ETFPortfolioManager/
├── App/
│   ├── ETFPortfolioManagerApp.swift       // @main, ModelContainer 설정
│   └── ContentView.swift                  // 5탭 TabView
│
├── Models/                                // 데이터 모델 (SwiftData @Model)
│   ├── Portfolio.swift                    // Portfolio + PortfolioStock
│   ├── PortfolioHoldings.swift            // PortfolioHoldings + HoldingItem
│   ├── CachedPrice.swift                  // 시세 캐시
│   └── CalculationModels.swift            // StockCalcResult 등 비영속 구조체
│
├── Calculators/                           // 비즈니스 로직 (순수 함수)
│   ├── PortfolioCalculator.swift          // portfolioCalc.ts 포팅
│   ├── GrowthCalculator.swift             // growthCalc.ts 포팅
│   └── HoldingsCalculator.swift           // holdingsCalc.ts 포팅
│
├── Services/                              // 외부 API, 저장소
│   ├── NaverStockService.swift            // 네이버 API (검색 + 시세 + 환율)
│   ├── KeychainService.swift              // Keychain 래퍼
│   └── BiometricAuth.swift                // Face ID / Touch ID
│
├── ViewModels/                            // MVVM ViewModel
│   ├── PortfolioViewModel.swift           // 포트폴리오 CRUD + 시세 갱신
│   ├── AllocationViewModel.swift          // 투자 배분 계산
│   ├── SummaryViewModel.swift             // 요약 대시보드
│   ├── GrowthViewModel.swift              // 성장 전망 시뮬레이션
│   └── HoldingsViewModel.swift            // 보유 현황 관리
│
├── Views/                                 // SwiftUI 뷰
│   ├── Tabs/
│   │   ├── StocksTab.swift                // 종목 탭
│   │   ├── AllocationTab.swift            // 배분 탭
│   │   ├── SummaryTab.swift               // 요약 탭
│   │   ├── GrowthTab.swift                // 성장 탭
│   │   └── HoldingsTab.swift              // 보유 탭
│   ├── Components/
│   │   ├── AssetHeroCard.swift            // 자산 히어로 카드
│   │   ├── StockListRow.swift             // ListRow 패턴
│   │   ├── DividendMiniCard.swift         // 배당 미니 카드
│   │   ├── CategoryBadge.swift            // 카테고리 뱃지
│   │   ├── PieChartView.swift             // Swift Charts 파이차트
│   │   └── BarChartView.swift             // Swift Charts 바차트
│   ├── Sheets/
│   │   ├── AddStockSheet.swift            // 종목 추가/수정
│   │   ├── StockSearchView.swift          // 자동완성 검색
│   │   └── SettingsSheet.swift            // 설정
│   └── Intro/
│       └── IntroView.swift                // 온보딩 인트로
│
├── Theme/                                 // 디자인 시스템
│   ├── TossColors.swift                   // 토스 컬러 토큰
│   ├── TossTypography.swift               // 타이포그래피
│   └── ThemeManager.swift                 // 라이트/다크/시스템 관리
│
├── Widget/                                // WidgetKit 확장
│   ├── PortfolioWidget.swift
│   └── PortfolioEntry.swift
│
├── Constants/                             // 상수
│   └── Categories.swift                   // CATEGORY_OPTIONS, CATEGORY_COLORS
│
└── Utilities/
    ├── Haptics.swift                      // 햅틱 피드백
    └── ExcelExporter.swift                // xlsxwriter 또는 CSV 내보내기
```

---

## 9. 의존성

| 패키지 | 용도 | 비고 |
|--------|------|------|
| SwiftData | 데이터 영속화 | iOS 17+ 내장 |
| Swift Charts | 파이/바 차트 | iOS 16+ 내장 |
| WidgetKit | 홈 화면 위젯 | 내장 |
| LocalAuthentication | Face ID | 내장 |
| (선택) xlsxwriter | Excel 내보내기 | SPM. 대안: CSV만 지원 |

> 외부 의존성 최소화. 대부분 Apple 내장 프레임워크로 해결.

---

## 10. 구현 계획

```
Phase 1: 프로젝트 셋업 + 모델 (2일)
├── Xcode 프로젝트 생성 (iOS 17+, SwiftUI)
├── SwiftData 모델 정의
├── Calculators 포팅 + 단위 테스트 (XCTest)
└── Constants 정의

Phase 2: 서비스 레이어 (2-3일)
├── NaverStockService 구현
├── 환율 변환 + 접미사 순차 시도
├── CachedPrice 저장/조회
└── 폴백 로직

Phase 3: ViewModel + 기본 UI (3-4일)
├── PortfolioViewModel (CRUD + 시세 갱신)
├── ContentView (5탭 TabView)
├── StocksTab (ListRow + 검색)
├── 테마 시스템 (TossColors)
└── Pull-to-Refresh

Phase 4: 나머지 탭 (3-4일)
├── AllocationTab (투자 배분)
├── SummaryTab (히어로 카드 + 파이차트)
├── GrowthTab (10년 시뮬레이션)
└── HoldingsTab (보유 종목 + 손익)

Phase 5: iOS 전용 기능 (2-3일)
├── Face ID / Touch ID
├── WidgetKit 구현
├── iCloud 동기화
├── 햅틱 피드백
└── 데이터 이전 (JSON 가져오기)

Phase 6: 마무리 + 출시 (3-5일)
├── Excel/CSV 내보내기
├── 온보딩 인트로
├── 앱 아이콘 + 스플래시
├── 개인정보 처리방침
├── TestFlight 배포
└── App Store 심사

총 예상 기간: 6-8주 (1인 개발)
```

---

## 11. 기술 요구사항

| 항목 | 요구사항 |
|------|---------|
| **최소 iOS 버전** | iOS 17.0 (SwiftData 필수) |
| **Xcode** | 15.0 이상 |
| **Swift** | 5.9 이상 |
| **Apple Developer** | 개인 또는 조직 계정 ($99/년) |
| **테스트** | XCTest (단위) + XCUITest (UI) |

---

## 12. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 네이버 API 모바일 차단 | HIGH | User-Agent 변경 + 프록시 폴백 |
| App Store 금융앱 심사 | HIGH | 면책 조항 + "시세 표시용" 명시 |
| iOS 17 미만 사용자 배제 | MEDIUM | iOS 17+ 점유율 80%+ (2026 기준 충분) |
| Excel 내보내기 복잡도 | MEDIUM | 1차는 CSV만, 이후 xlsx 추가 |
| 코드 재사용 불가 | LOW | 알고리즘 로직은 동일, 언어만 다름 |
