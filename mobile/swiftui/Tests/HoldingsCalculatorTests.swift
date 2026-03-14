import Testing
import Foundation
@testable import ETFPortfolioManager

@Suite("HoldingsCalculator 테스트")
struct HoldingsCalculatorTests {

    // MARK: - evaluateHolding

    @Test("보유종목_평가가_올바르게_계산된다")
    func evaluateHolding_정상() {
        // Given
        let item = HoldingItem(
            category: "배당성장",
            name: "TIGER 미국배당다우존스",
            code: "458730",
            quantity: 100,
            avgPrice: 13000,
            currentPrice: 14500
        )

        // When
        let eval = HoldingsCalculator.evaluateHolding(item)

        // Then
        #expect(eval.investAmount == 100 * 13000)       // 1,300,000
        #expect(eval.evalAmount == 100 * 14500)          // 1,450,000
        #expect(eval.profitLoss == 150000)               // +150,000
        #expect(eval.returnRate > 0)
        #expect(abs(eval.returnRate - 150000.0 / 1300000.0) < 0.0001)
    }

    @Test("현재가가_없으면_평가액이_0이다")
    func evaluateHolding_현재가없음() {
        // Given
        let item = HoldingItem(
            category: "성장동력",
            name: "테스트",
            code: "000000",
            quantity: 50,
            avgPrice: 20000,
            currentPrice: nil
        )

        // When
        let eval = HoldingsCalculator.evaluateHolding(item)

        // Then
        #expect(eval.investAmount == 1_000_000)
        #expect(eval.evalAmount == 0)
        #expect(eval.profitLoss == -1_000_000)
        #expect(eval.returnRate == -1.0)
    }

    @Test("손실_종목의_수익률이_음수이다")
    func evaluateHolding_손실() {
        // Given
        let item = HoldingItem(
            category: "안전판",
            name: "하락종목",
            code: "999999",
            quantity: 200,
            avgPrice: 15000,
            currentPrice: 12000
        )

        // When
        let eval = HoldingsCalculator.evaluateHolding(item)

        // Then
        #expect(eval.profitLoss < 0)
        #expect(eval.returnRate < 0)
        #expect(eval.profitLoss == (200 * 12000) - (200 * 15000))
    }

    // MARK: - evaluateAllHoldings

    @Test("전체_보유종목_합계가_올바르게_집계된다")
    func evaluateAllHoldings_정상() {
        // Given
        let items = [
            HoldingItem(category: "배당성장", name: "A", code: "001",
                        quantity: 100, avgPrice: 10000, currentPrice: 11000),
            HoldingItem(category: "성장동력", name: "B", code: "002",
                        quantity: 50, avgPrice: 20000, currentPrice: 19000),
        ]

        // When
        let result = HoldingsCalculator.evaluateAllHoldings(items)

        // Then
        #expect(result.evaluations.count == 2)
        #expect(result.totalInvest == (100 * 10000) + (50 * 20000))   // 2,000,000
        #expect(result.totalEval == (100 * 11000) + (50 * 19000))     // 2,050,000
        #expect(result.totalProfitLoss == result.totalEval - result.totalInvest)
    }

    @Test("빈_배열이면_합계가_전부_0이다")
    func evaluateAllHoldings_빈배열() {
        // When
        let result = HoldingsCalculator.evaluateAllHoldings([])

        // Then
        #expect(result.evaluations.isEmpty)
        #expect(result.totalInvest == 0)
        #expect(result.totalEval == 0)
        #expect(result.totalProfitLoss == 0)
        #expect(result.totalReturnRate == 0)
    }

    // MARK: - calcCategoryEvaluations

    @Test("카테고리별_평가가_올바르게_집계된다")
    func calcCategoryEvaluations_정상() {
        // Given
        let items = [
            HoldingItem(category: "배당성장", name: "A", code: "001",
                        quantity: 100, avgPrice: 10000, currentPrice: 11000),
            HoldingItem(category: "배당성장", name: "B", code: "002",
                        quantity: 50, avgPrice: 15000, currentPrice: 16000),
            HoldingItem(category: "성장동력", name: "C", code: "003",
                        quantity: 200, avgPrice: 5000, currentPrice: 4500),
        ]

        // When
        let cats = HoldingsCalculator.calcCategoryEvaluations(items)

        // Then
        #expect(cats.count == 2)
        let dividend = cats.first { $0.category == "배당성장" }
        let growth = cats.first { $0.category == "성장동력" }
        #expect(dividend != nil)
        #expect(growth != nil)
        // 배당성장: invest = 100*10000 + 50*15000 = 1,750,000
        #expect(dividend!.investAmount == 1_750_000)
        // 성장동력: profit = (200*4500) - (200*5000) = -100,000
        #expect(growth!.profitLoss == -100_000)
    }

    // MARK: - compareWeightsByCategory

    @Test("카테고리별_목표대비_실제비중_비교가_올바르다")
    func compareWeightsByCategory_정상() {
        // Given
        let stocks = [
            PortfolioStock(category: "배당성장", name: "A", code: "001",
                           targetWeight: 0.60, dividendRate: 0.03),
            PortfolioStock(category: "성장동력", name: "B", code: "002",
                           targetWeight: 0.40, dividendRate: 0.01),
        ]
        let holdings = [
            HoldingItem(category: "배당성장", name: "A", code: "001",
                        quantity: 100, avgPrice: 10000, currentPrice: 10000),
            HoldingItem(category: "성장동력", name: "B", code: "002",
                        quantity: 100, avgPrice: 10000, currentPrice: 10000),
        ]

        // When
        let comparisons = HoldingsCalculator.compareWeightsByCategory(stocks: stocks, holdings: holdings)

        // Then
        #expect(comparisons.count == 2)
        let dividend = comparisons.first { $0.label == "배당성장" }
        #expect(dividend != nil)
        // 목표: 60%, 실제: 50% (동일 금액)
        #expect(abs(dividend!.targetWeight - 0.60) < 0.001)
        #expect(abs(dividend!.actualWeight - 0.50) < 0.001)
        #expect(dividend!.diff < 0)  // 실제 < 목표
    }

    // MARK: - compareWeightsByStock

    @Test("종목별_비중비교가_올바르게_계산된다")
    func compareWeightsByStock_정상() {
        // Given
        let stocks = [
            PortfolioStock(category: "배당성장", name: "종목A", code: "001",
                           targetWeight: 0.30, dividendRate: 0.03),
            PortfolioStock(category: "성장동력", name: "종목B", code: "002",
                           targetWeight: 0.70, dividendRate: 0.01),
        ]
        let holdings = [
            HoldingItem(category: "배당성장", name: "종목A", code: "001",
                        quantity: 100, avgPrice: 10000, currentPrice: 10000),
        ]

        // When
        let comparisons = HoldingsCalculator.compareWeightsByStock(stocks: stocks, holdings: holdings)

        // Then
        // 종목A: 목표 30%, 실제 100% (보유종목 중 유일)
        let stockA = comparisons.first { $0.label == "종목A" }
        #expect(stockA != nil)
        #expect(abs(stockA!.targetWeight - 0.30) < 0.001)
        #expect(abs(stockA!.actualWeight - 1.0) < 0.001)
    }
}
