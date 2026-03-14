import Testing
import Foundation
@testable import ETFPortfolioManager

@Suite("PortfolioCalculator 테스트")
struct PortfolioCalculatorTests {

    // MARK: - calcStockAllocation

    @Test("정상_입력시_투자배분이_올바르게_계산된다")
    func calcStockAllocation_정상입력() {
        // Given
        let stock = PortfolioStock(
            category: "배당성장",
            name: "TIGER 미국배당다우존스",
            code: "458730",
            targetWeight: 0.30,
            dividendRate: 0.035,
            currentPrice: 14000
        )
        let totalAmount = 100_000_000

        // When
        let result = PortfolioCalculator.calcStockAllocation(stock: stock, totalAmount: totalAmount)

        // Then
        #expect(result.investAmount == 30_000_000)
        #expect(result.quantity == 2142)  // 30,000,000 / 14,000 = 2142
        #expect(result.actualAmount == 2142 * 14000)
        #expect(result.annualDividend == Int(round(Double(result.actualAmount) * 0.035)))
        #expect(result.monthlyDividend == Int(round(Double(result.actualAmount) * 0.035 / 12.0)))
    }

    @Test("현재가가_없으면_수량은_0이다")
    func calcStockAllocation_현재가없음() {
        // Given
        let stock = PortfolioStock(
            category: "배당성장",
            name: "테스트종목",
            code: "000000",
            targetWeight: 0.50,
            dividendRate: 0.05,
            currentPrice: nil
        )

        // When
        let result = PortfolioCalculator.calcStockAllocation(stock: stock, totalAmount: 100_000_000)

        // Then
        #expect(result.investAmount == 50_000_000)
        #expect(result.quantity == 0)
        #expect(result.actualAmount == 0)
        #expect(result.monthlyDividend == 0)
        #expect(result.annualDividend == 0)
    }

    @Test("비중이_0이면_투자금이_0이다")
    func calcStockAllocation_비중0() {
        // Given
        let stock = PortfolioStock(
            category: "기타",
            name: "테스트",
            code: "111111",
            targetWeight: 0.0,
            dividendRate: 0.03,
            currentPrice: 10000
        )

        // When
        let result = PortfolioCalculator.calcStockAllocation(stock: stock, totalAmount: 100_000_000)

        // Then
        #expect(result.investAmount == 0)
        #expect(result.quantity == 0)
        #expect(result.actualAmount == 0)
    }

    // MARK: - calcPortfolioTotals

    @Test("포트폴리오_전체_합계가_올바르게_집계된다")
    func calcPortfolioTotals_정상() {
        // Given
        let stocks = [
            PortfolioStock(category: "배당성장", name: "종목A", code: "001",
                           targetWeight: 0.60, dividendRate: 0.035, currentPrice: 10000),
            PortfolioStock(category: "성장동력", name: "종목B", code: "002",
                           targetWeight: 0.40, dividendRate: 0.01, currentPrice: 20000),
        ]

        // When
        let totals = PortfolioCalculator.calcPortfolioTotals(stocks: stocks, totalAmount: 100_000_000)

        // Then
        #expect(totals.totalWeight == 1.0)
        #expect(totals.results.count == 2)
        #expect(totals.totalActualAmount > 0)
        #expect(totals.totalMonthlyDividend > 0)
        // 개별 종목별 반올림 누적으로 total 수준에서 오차 발생 가능 → 종목별 검증
        for r in totals.results {
            let expectedMonthly = Int(round(Double(r.calc.annualDividend) / 12.0))
            #expect(r.calc.monthlyDividend == expectedMonthly)
        }
        #expect(totals.weightedDividendRate > 0)
    }

    @Test("종목이_없으면_합계가_전부_0이다")
    func calcPortfolioTotals_빈배열() {
        // Given
        let stocks: [PortfolioStock] = []

        // When
        let totals = PortfolioCalculator.calcPortfolioTotals(stocks: stocks, totalAmount: 100_000_000)

        // Then
        #expect(totals.totalWeight == 0)
        #expect(totals.totalActualAmount == 0)
        #expect(totals.totalMonthlyDividend == 0)
        #expect(totals.totalAnnualDividend == 0)
        #expect(totals.weightedDividendRate == 0)
    }

    // MARK: - calcCategoryPositions

    @Test("카테고리별_포지션이_올바르게_집계된다")
    func calcCategoryPositions_정상() {
        // Given
        let stocks = [
            PortfolioStock(category: "배당성장", name: "A", code: "001", targetWeight: 0.30, dividendRate: 0.03),
            PortfolioStock(category: "배당성장", name: "B", code: "002", targetWeight: 0.20, dividendRate: 0.04),
            PortfolioStock(category: "성장동력", name: "C", code: "003", targetWeight: 0.50, dividendRate: 0.01),
        ]

        // When
        let positions = PortfolioCalculator.calcCategoryPositions(stocks: stocks, investmentAmount: 100_000_000)

        // Then
        #expect(positions.count == 2)
        let dividend = positions.first { $0.category == "배당성장" }
        let growth = positions.first { $0.category == "성장동력" }
        #expect(dividend != nil)
        #expect(growth != nil)
        #expect(dividend!.amount == 50_000_000)
        #expect(growth!.amount == 50_000_000)
        #expect(abs(dividend!.weight - 0.5) < 0.001)
    }

    // MARK: - formatNumber / formatPercent

    @Test("숫자_포맷팅이_천단위_구분자를_포함한다")
    func formatNumber_정상() {
        #expect(PortfolioCalculator.formatNumber(1000000) == "1,000,000")
        #expect(PortfolioCalculator.formatNumber(0) == "0")
        #expect(PortfolioCalculator.formatNumber(999) == "999")
    }

    @Test("퍼센트_포맷팅이_올바르다")
    func formatPercent_정상() {
        #expect(PortfolioCalculator.formatPercent(0.035) == "3.5%")
        #expect(PortfolioCalculator.formatPercent(0.1) == "10.0%")
        #expect(PortfolioCalculator.formatPercent(0) == "0.0%")
        #expect(PortfolioCalculator.formatPercent(1.0) == "100.0%")
    }
}
