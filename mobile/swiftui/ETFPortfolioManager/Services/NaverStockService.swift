import Foundation

actor NaverStockService {

    static let shared = NaverStockService()

    private let headers: [String: String] = [
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://m.stock.naver.com",
    ]

    private let proxyBaseURL = "https://your-nextjs-app.vercel.app"

    // MARK: - 해외 주식 감지 (route.ts:29-33)

    nonisolated func isOverseasCode(_ code: String) -> Bool {
        if code.contains(".") { return true }
        // 순수 영문자(A-Z)만으로 구성된 코드는 해외 주식 (국내는 6자리 숫자)
        return code.allSatisfy { $0.isLetter && $0.isASCII } && !code.isEmpty
    }

    // MARK: - 거래소 접미사 (route.ts:66)

    private let exchangeSuffixes = [".O", ".N", ".A", ".K"]

    // MARK: - 국가별 매핑 (route.ts:37-48)

    private let nationToFX: [String: String] = [
        "USA": "FX_USDKRW", "JPN": "FX_JPYKRW", "HKG": "FX_HKDKRW",
        "GBR": "FX_GBPKRW", "CHN": "FX_CNYKRW", "EUR": "FX_EURKRW",
    ]

    private let nationToCurrency: [String: String] = [
        "USA": "USD", "JPN": "JPY", "HKG": "HKD",
        "GBR": "GBP", "CHN": "CNY", "EUR": "EUR",
    ]

    // MARK: - 종목 검색 (search/route.ts)

    func searchStocks(query: String) async throws -> [StockSearchResult] {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }

        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        guard let url = URL(string: "https://ac.stock.naver.com/ac?q=\(encoded)&target=stock&st=111") else {
            throw NaverAPIError.invalidURL
        }

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

    func getStockPriceWithFallback(code: String) async -> StockPriceResult? {
        do {
            return try await getStockPrice(code: code)
        } catch {
            return try? await fetchJSON(url: "\(proxyBaseURL)/api/stock/price/\(code)")
        }
    }

    // MARK: - 국내 시세 (route.ts:139-174)

    private func fetchDomesticPrice(code: String) async throws -> StockPriceResult {
        async let basicTask: NaverStockBasic = fetchJSON(
            url: "https://m.stock.naver.com/api/stock/\(code)/basic"
        )
        async let integrationTask: NaverIntegration? = fetchJSONOptional(
            url: "https://m.stock.naver.com/api/stock/\(code)/integration"
        )

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
        let basic = try await fetchOverseasBasic(code: code)

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
        let baseURL = "https://api.stock.naver.com/stock"

        if code.contains(".") {
            return try await fetchJSON(url: "\(baseURL)/\(code)/basic")
        }

        if let result: NaverStockBasic = try? await fetchJSON(url: "\(baseURL)/\(code)/basic") {
            return result
        }

        for suffix in exchangeSuffixes {
            if let result: NaverStockBasic = try? await fetchJSON(url: "\(baseURL)/\(code)\(suffix)/basic") {
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
