import Foundation

// growthCalc.ts:22-54 -> Swift 포팅

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
