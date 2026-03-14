import Testing
import Foundation
@testable import ETFPortfolioManager

@Suite("GrowthCalculator 테스트")
struct GrowthCalculatorTests {

    // MARK: - calcGrowthReport

    @Test("10년_성장_시뮬레이션이_올바른_행수를_반환한다")
    func calcGrowthReport_행수() {
        // Given
        let initialAmount = 100_000_000
        let initialDividendRate = 0.035
        let params = GrowthParams.default

        // When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: initialAmount,
            initialDividendRate: initialDividendRate,
            params: params
        )

        // Then
        #expect(rows.count == 10)
        #expect(rows.first?.year == 1)
        #expect(rows.last?.year == 10)
    }

    @Test("매년_자산이_증가한다")
    func calcGrowthReport_자산증가() {
        // Given
        let params = GrowthParams(dividendGrowthRate: 0.04, annualAddition: 12_000_000, assetGrowthRate: 0.07)

        // When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000,
            initialDividendRate: 0.035,
            params: params
        )

        // Then: 자산은 매년 단조 증가해야 함
        for i in 1..<rows.count {
            #expect(rows[i].assetValue > rows[i - 1].assetValue,
                    "\(rows[i].year)년차 자산이 \(rows[i-1].year)년차보다 크지 않음")
        }
    }

    @Test("누적투자금이_매년_추가투자만큼_증가한다")
    func calcGrowthReport_누적투자() {
        // Given
        let params = GrowthParams(dividendGrowthRate: 0.0, annualAddition: 10_000_000, assetGrowthRate: 0.0)

        // When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: 50_000_000,
            initialDividendRate: 0.03,
            params: params
        )

        // Then
        #expect(rows[0].totalInvested == 60_000_000)  // 50M + 10M
        #expect(rows[4].totalInvested == 100_000_000)  // 50M + 5 * 10M
        #expect(rows[9].totalInvested == 150_000_000)  // 50M + 10 * 10M
    }

    @Test("배당률이_복리로_성장한다")
    func calcGrowthReport_배당성장() {
        // Given
        let initialRate = 0.04
        let growthRate = 0.05  // 5% 배당성장
        let params = GrowthParams(dividendGrowthRate: growthRate, annualAddition: 0, assetGrowthRate: 0.0)

        // When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000,
            initialDividendRate: initialRate,
            params: params
        )

        // Then: 1년차 배당률 = 0.04 * (1.05)^1
        let expectedYear1Rate = initialRate * pow(1 + growthRate, 1)
        #expect(abs(rows[0].dividendRate - expectedYear1Rate) < 0.0001)

        // 10년차 배당률 = 0.04 * (1.05)^10
        let expectedYear10Rate = initialRate * pow(1 + growthRate, 10)
        #expect(abs(rows[9].dividendRate - expectedYear10Rate) < 0.0001)
    }

    @Test("월배당은_연배당의_12분의_1이다")
    func calcGrowthReport_월배당() {
        // Given & When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000,
            initialDividendRate: 0.04,
            params: GrowthParams.default
        )

        // Then
        for row in rows {
            let expectedMonthly = Int(round(Double(row.annualDividend) / 12.0))
            #expect(row.monthlyDividend == expectedMonthly)
        }
    }

    @Test("추가투자_0이고_성장률_0이면_자산은_원금과_동일하다")
    func calcGrowthReport_제로성장() {
        // Given
        let params = GrowthParams(dividendGrowthRate: 0.0, annualAddition: 0, assetGrowthRate: 0.0)

        // When
        let rows = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000,
            initialDividendRate: 0.03,
            params: params
        )

        // Then
        for row in rows {
            #expect(row.assetValue == 100_000_000)
            #expect(row.totalInvested == 100_000_000)
        }
    }

    @Test("커스텀_연수_파라미터가_동작한다")
    func calcGrowthReport_커스텀연수() {
        // When
        let rows5 = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000, initialDividendRate: 0.03,
            params: GrowthParams.default, years: 5
        )
        let rows20 = GrowthCalculator.calcGrowthReport(
            initialAmount: 100_000_000, initialDividendRate: 0.03,
            params: GrowthParams.default, years: 20
        )

        // Then
        #expect(rows5.count == 5)
        #expect(rows20.count == 20)
    }
}
