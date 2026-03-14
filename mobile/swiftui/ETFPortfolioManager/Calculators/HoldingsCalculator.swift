import Foundation

// holdingsCalc.ts -> Swift 포팅

enum HoldingsCalculator {

    // MARK: - evaluateHolding (holdingsCalc.ts:26-32)

    static func evaluateHolding(_ item: HoldingItem) -> HoldingEvaluation {
        let investAmount = item.quantity * Int(item.avgPrice)
        let evalAmount = item.quantity * (item.currentPrice ?? 0)
        let profitLoss = evalAmount - investAmount
        let returnRate = investAmount > 0 ? Double(profitLoss) / Double(investAmount) : 0
        return HoldingEvaluation(
            item: item, investAmount: investAmount, evalAmount: evalAmount,
            profitLoss: profitLoss, returnRate: returnRate
        )
    }

    // MARK: - evaluateAllHoldings (holdingsCalc.ts:34-47)

    struct AllHoldingsResult {
        let evaluations: [HoldingEvaluation]
        let totalInvest: Int
        let totalEval: Int
        let totalProfitLoss: Int
        let totalReturnRate: Double
    }

    static func evaluateAllHoldings(_ items: [HoldingItem]) -> AllHoldingsResult {
        let evaluations = items.map { evaluateHolding($0) }
        let totalInvest = evaluations.reduce(0) { $0 + $1.investAmount }
        let totalEval = evaluations.reduce(0) { $0 + $1.evalAmount }
        let totalProfitLoss = totalEval - totalInvest
        let totalReturnRate = totalInvest > 0 ? Double(totalProfitLoss) / Double(totalInvest) : 0
        return AllHoldingsResult(
            evaluations: evaluations, totalInvest: totalInvest, totalEval: totalEval,
            totalProfitLoss: totalProfitLoss, totalReturnRate: totalReturnRate
        )
    }

    // MARK: - calcCategoryEvaluations (holdingsCalc.ts:49-64)

    static func calcCategoryEvaluations(_ items: [HoldingItem]) -> [CategoryEvaluation] {
        var map: [String: (invest: Int, eval: Int)] = [:]
        for item in items {
            let invest = item.quantity * Int(item.avgPrice)
            let eval = item.quantity * (item.currentPrice ?? 0)
            let curr = map[item.category] ?? (invest: 0, eval: 0)
            map[item.category] = (invest: curr.invest + invest, eval: curr.eval + eval)
        }
        return map.map { cat, data in
            CategoryEvaluation(
                category: cat, investAmount: data.invest, evalAmount: data.eval,
                profitLoss: data.eval - data.invest,
                returnRate: data.invest > 0 ? Double(data.eval - data.invest) / Double(data.invest) : 0
            )
        }
    }

    // MARK: - compareWeightsByCategory (holdingsCalc.ts:66-95)

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

    // MARK: - compareWeightsByStock (holdingsCalc.ts:97-123)

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
