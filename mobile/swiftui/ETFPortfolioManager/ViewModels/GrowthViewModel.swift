import Foundation

@Observable
final class GrowthViewModel {
    var params = GrowthParams.default
    var rows: [YearlyGrowthRow] = []

    func calculate(initialAmount: Int, dividendRate: Double) {
        rows = GrowthCalculator.calcGrowthReport(
            initialAmount: initialAmount,
            initialDividendRate: dividendRate,
            params: params
        )
    }
}
