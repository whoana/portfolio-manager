import Testing
import Foundation
@testable import ETFPortfolioManager

@Suite("NaverStockService 해외주식 감지 테스트")
struct NaverStockServiceTests {

    let service = NaverStockService.shared

    // MARK: - isOverseasCode

    @Test("점이_포함된_코드는_해외주식이다")
    func isOverseasCode_점포함() {
        #expect(service.isOverseasCode("AAPL.O") == true)
        #expect(service.isOverseasCode("MSFT.O") == true)
        #expect(service.isOverseasCode("7203.T") == true)
    }

    @Test("순수_영문자_코드는_해외주식이다")
    func isOverseasCode_순수영문() {
        #expect(service.isOverseasCode("AAPL") == true)
        #expect(service.isOverseasCode("MSFT") == true)
        #expect(service.isOverseasCode("GOOGL") == true)
        #expect(service.isOverseasCode("TSM") == true)
    }

    @Test("6자리_숫자코드는_국내주식이다")
    func isOverseasCode_국내() {
        #expect(service.isOverseasCode("005930") == false)
        #expect(service.isOverseasCode("458730") == false)
        #expect(service.isOverseasCode("379800") == false)
    }

    @Test("숫자와_영문_혼합코드는_국내주식이다")
    func isOverseasCode_혼합() {
        // 영숫자 혼합은 순수 영문이 아니므로 국내로 판별
        #expect(service.isOverseasCode("123ABC") == false)
        #expect(service.isOverseasCode("A1B2") == false)
    }
}
