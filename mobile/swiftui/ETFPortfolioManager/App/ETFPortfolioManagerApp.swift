import SwiftUI
import SwiftData

@main
struct ETFPortfolioManagerApp: App {
    @State private var themeManager = ThemeManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(themeManager)
                .preferredColorScheme(
                    themeManager.followSystem ? nil : themeManager.currentTheme.colorScheme
                )
        }
        .modelContainer(for: [
            Portfolio.self,
            PortfolioStock.self,
            PortfolioHoldings.self,
            HoldingItem.self,
            CachedPrice.self,
        ])
    }
}

// MARK: - 데모 데이터 시드 (테스트용)

struct DemoDataSeeder {
    static func seedIfNeeded(context: ModelContext) {
        let descriptor = FetchDescriptor<Portfolio>()
        let existing = (try? context.fetch(descriptor)) ?? []

        // 이미 웹앱과 동일한 7종목 구성이고 currentPrice가 설정되어 있으면 스킵
        if let first = existing.first, first.stocks.count == 7,
           first.stocks.allSatisfy({ $0.currentPrice != nil }) {
            return
        }

        // 기존 데이터 삭제
        for p in existing { context.delete(p) }

        // 웹앱 DEFAULT_STOCKS와 동일한 구성 (5억원, 7종목)
        let portfolio = Portfolio(name: "내 ETF 포트폴리오", investmentAmount: 500_000_000)

        let stocks: [PortfolioStock] = [
            PortfolioStock(
                category: "배당성장",
                name: "TIGER 미국배당다우존스",
                code: "458730",
                targetWeight: 0.30,
                dividendRate: 0.035,
                currentPrice: 14200
            ),
            PortfolioStock(
                category: "배당성장",
                name: "TIGER 코리아배당다우존스",
                code: "0052D0",
                targetWeight: 0.10,
                dividendRate: 0.045,
                currentPrice: 13100
            ),
            PortfolioStock(
                category: "고배당",
                name: "KODEX 미국배당커버드콜액티브",
                code: "441640",
                targetWeight: 0.10,
                dividendRate: 0.08,
                currentPrice: 11300
            ),
            PortfolioStock(
                category: "성장동력",
                name: "KODEX 미국S&P500",
                code: "379800",
                targetWeight: 0.12,
                dividendRate: 0.012,
                currentPrice: 19200
            ),
            PortfolioStock(
                category: "성장동력",
                name: "TIGER 미국테크TOP10 INDXX",
                code: "381170",
                targetWeight: 0.08,
                dividendRate: 0.003,
                currentPrice: 16100
            ),
            PortfolioStock(
                category: "안전판",
                name: "KODEX CD금리액티브(합성)",
                code: "459580",
                targetWeight: 0.20,
                dividendRate: 0.035,
                currentPrice: 11150
            ),
            PortfolioStock(
                category: "고배당",
                name: "TIME Korea플러스배당액티브",
                code: "441800",
                targetWeight: 0.10,
                dividendRate: 0.044,
                currentPrice: 12500
            ),
        ]

        portfolio.stocks = stocks
        context.insert(portfolio)

        // 보유 내역 데모 (웹앱 스크린샷 기준 다양한 종목)
        let holdings = PortfolioHoldings(portfolioId: portfolio.id)
        let holdingItems: [HoldingItem] = [
            HoldingItem(id: "holding_458730", category: "배당성장",
                        name: "TIGER 미국배당다우존스", code: "458730",
                        quantity: 8000, avgPrice: 13500, currentPrice: 14200),
            HoldingItem(id: "holding_0052D0", category: "배당성장",
                        name: "TIGER 코리아배당다우존스", code: "0052D0",
                        quantity: 3500, avgPrice: 12800, currentPrice: 13100),
            HoldingItem(id: "holding_441640", category: "고배당",
                        name: "KODEX 미국배당커버드콜액티브", code: "441640",
                        quantity: 4500, avgPrice: 11000, currentPrice: 11300),
            HoldingItem(id: "holding_379800", category: "성장동력",
                        name: "KODEX 미국S&P500", code: "379800",
                        quantity: 3000, avgPrice: 18500, currentPrice: 19200),
            HoldingItem(id: "holding_381170", category: "성장동력",
                        name: "TIGER 미국테크TOP10 INDXX", code: "381170",
                        quantity: 2500, avgPrice: 15000, currentPrice: 16100),
            HoldingItem(id: "holding_459580", category: "안전판",
                        name: "KODEX CD금리액티브(합성)", code: "459580",
                        quantity: 9000, avgPrice: 11100, currentPrice: 11150),
            HoldingItem(id: "holding_441800", category: "고배당",
                        name: "TIME Korea플러스배당액티브", code: "441800",
                        quantity: 4000, avgPrice: 12000, currentPrice: 12500),
        ]
        holdings.items = holdingItems
        context.insert(holdings)

        try? context.save()
    }
}
