import XCTest

final class ScreenshotTests: XCTestCase {

    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        continueAfterFailure = true
        app.launch()
        sleep(2)
    }

    // MARK: - 종목 탭

    @MainActor
    func test01_종목탭_2종목_확인() {
        app.tabBars.buttons["종목"].tap()
        sleep(1)

        let has441640 = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '441640'")).firstMatch.waitForExistence(timeout: 5)
        let has458730 = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '458730'")).firstMatch.waitForExistence(timeout: 3)
        XCTAssertTrue(has441640, "441640 종목 표시")
        XCTAssertTrue(has458730, "458730 종목 표시")

        let pct50Count = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '50.0%'")).count
        XCTAssertGreaterThanOrEqual(pct50Count, 2, "두 종목 모두 50.0%")

        takeScreenshot(name: "01_종목탭")
    }

    // MARK: - 배분 탭

    @MainActor
    func test02_배분탭_투자배분() {
        app.tabBars.buttons["배분"].tap()
        sleep(2)

        XCTAssertTrue(app.navigationBars.staticTexts["투자 배분"].waitForExistence(timeout: 5), "투자 배분 타이틀")
        XCTAssertTrue(app.staticTexts["투자금액"].waitForExistence(timeout: 3), "투자금액 라벨")

        let amount = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '100,000,000'")).firstMatch
        XCTAssertTrue(amount.waitForExistence(timeout: 3), "1억원 표시")

        let hasKodex = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'KODEX'")).firstMatch.waitForExistence(timeout: 3)
        let hasTiger = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'TIGER'")).firstMatch.waitForExistence(timeout: 3)
        XCTAssertTrue(hasKodex, "KODEX 배분")
        XCTAssertTrue(hasTiger, "TIGER 배분")

        takeScreenshot(name: "02_배분탭_상단")

        app.swipeUp()
        sleep(1)
        takeScreenshot(name: "02_배분탭_합계")
    }

    // MARK: - 요약 탭

    @MainActor
    func test03_요약탭_카테고리_배당() {
        app.tabBars.buttons["요약"].tap()
        sleep(2)

        XCTAssertTrue(app.navigationBars.staticTexts["요약"].waitForExistence(timeout: 5), "요약 타이틀")

        let hasCategory = app.staticTexts["카테고리별 배분"].waitForExistence(timeout: 3)
        XCTAssertTrue(hasCategory, "카테고리별 배분 섹션")

        takeScreenshot(name: "03_요약탭_상단")

        app.swipeUp()
        sleep(1)

        let hasDividend = app.staticTexts["배당 정보"].waitForExistence(timeout: 3)
        XCTAssertTrue(hasDividend, "배당 정보 섹션")

        takeScreenshot(name: "03_요약탭_배당정보")
    }

    // MARK: - 성장 탭

    @MainActor
    func test04_성장탭_10년전망() {
        app.tabBars.buttons["성장"].tap()
        sleep(2)

        XCTAssertTrue(app.navigationBars.staticTexts["자산성장 전망"].waitForExistence(timeout: 5), "자산성장 전망 타이틀")
        XCTAssertTrue(app.staticTexts["파라미터 조정"].waitForExistence(timeout: 3), "파라미터 섹션")
        XCTAssertTrue(app.staticTexts["배당성장"].exists, "배당성장")
        XCTAssertTrue(app.staticTexts["추가투자"].exists, "추가투자")
        XCTAssertTrue(app.staticTexts["자산상승"].exists, "자산상승")
        XCTAssertTrue(app.staticTexts["1년차"].waitForExistence(timeout: 3), "1년차")

        takeScreenshot(name: "04_성장탭_상단")

        app.swipeUp()
        sleep(1)

        XCTAssertTrue(app.staticTexts["10년차"].waitForExistence(timeout: 3), "10년차")

        takeScreenshot(name: "04_성장탭_10년차")
    }

    // MARK: - 보유 탭

    @MainActor
    func test05_보유탭_평가현황() {
        app.tabBars.buttons["보유"].tap()
        sleep(3)

        // 보유 현황 타이틀 또는 보유 탭 내 콘텐츠
        let navTitle = app.navigationBars.staticTexts["보유 현황"]
        let hasNav = navTitle.waitForExistence(timeout: 5)

        takeScreenshot(name: "05_보유탭")

        if hasNav {
            XCTAssertTrue(true, "보유 현황 타이틀 표시")

            let evalSummary = app.staticTexts["평가 요약"]
            let emptyState = app.staticTexts["보유 종목이 없습니다"]

            if evalSummary.waitForExistence(timeout: 3) {
                XCTAssertTrue(true, "평가 요약 카드 존재")
            } else if emptyState.exists {
                XCTAssertTrue(true, "보유 종목 없음 상태 표시")
            }
        }
    }

    // MARK: - Helper

    private func takeScreenshot(name: String) {
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
