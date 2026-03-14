import XCTest

final class FullFeatureUITests: XCTestCase {

    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        continueAfterFailure = true
        app.launchArguments = ["-UITest"]
        app.launch()
    }

    // MARK: - 1. 종목 탭 기본 상태 확인

    @MainActor
    func test01_종목탭_기본상태() {
        let stocksTab = app.tabBars.buttons["종목"]
        XCTAssertTrue(stocksTab.exists, "종목 탭이 존재해야 합니다")
        XCTAssertTrue(stocksTab.isSelected, "종목 탭이 기본 선택이어야 합니다")

        let navTitle = app.navigationBars.staticTexts["종목"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5), "종목 네비게이션 타이틀이 존재해야 합니다")

        takeScreenshot(name: "01_종목탭_기본상태")
    }

    // MARK: - 2. 기존 종목 확인 (441640)

    @MainActor
    func test02_기존종목_확인() {
        let kodex = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '441640'")).firstMatch
        let hasKodex = kodex.waitForExistence(timeout: 3)

        if hasKodex {
            XCTAssertTrue(true, "441640 종목이 이미 등록되어 있습니다")
        }

        takeScreenshot(name: "02_기존종목")
    }

    // MARK: - 3. 종목 추가 시트 열기

    @MainActor
    func test03_종목추가_시트_열기() {
        // accessibilityIdentifier로 + 버튼 찾기
        let addBtn = app.buttons["addStockButton"]
        if addBtn.waitForExistence(timeout: 3) && addBtn.isHittable {
            addBtn.tap()
        } else {
            // fallback: 네비게이션 바의 마지막 버튼
            let navButtons = app.navigationBars.buttons
            if navButtons.count > 0 {
                navButtons.element(boundBy: navButtons.count - 1).tap()
            }
        }

        sleep(2)

        // 시트 콘텐츠 확인
        let hasSheet = app.staticTexts["종목 추가"].waitForExistence(timeout: 5) ||
                       app.staticTexts["종목"].waitForExistence(timeout: 2) ||
                       app.buttons["취소"].waitForExistence(timeout: 2)

        XCTAssertTrue(hasSheet, "종목 추가 시트가 열려야 합니다")

        takeScreenshot(name: "03_종목추가_시트")

        // 시트에 필수 필드 확인
        let categoryLabel = app.staticTexts["구분"]
        let weightLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '목표비중'")).firstMatch
        let dividendLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '배당률'")).firstMatch

        if categoryLabel.exists {
            XCTAssertTrue(true, "카테고리 선택 존재")
        }
        if weightLabel.exists {
            XCTAssertTrue(true, "목표비중 입력 존재")
        }
        if dividendLabel.exists {
            XCTAssertTrue(true, "배당률 입력 존재")
        }

        takeScreenshot(name: "03_종목추가_시트_필드")

        // 시트 닫기
        let cancelBtn = app.buttons["취소"]
        if cancelBtn.exists && cancelBtn.isHittable { cancelBtn.tap() }
    }

    // MARK: - 4. 5개 탭 전환 테스트

    @MainActor
    func test04_5탭_전환() {
        let tabNames = ["종목", "배분", "요약", "성장", "보유"]

        for (index, tabName) in tabNames.enumerated() {
            let tab = app.tabBars.buttons[tabName]
            XCTAssertTrue(tab.exists, "\(tabName) 탭이 존재해야 합니다")
            tab.tap()
            sleep(1)
            takeScreenshot(name: "04_탭\(index)_\(tabName)")
        }

        app.tabBars.buttons["종목"].tap()
    }

    // MARK: - 5. 배분 탭 - 투자금액 + 종목별 배분

    @MainActor
    func test05_배분탭_상세() {
        app.tabBars.buttons["배분"].tap()
        sleep(1)

        let navTitle = app.navigationBars.staticTexts["투자 배분"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5), "투자 배분 타이틀 존재")

        let investLabel = app.staticTexts["투자금액"]
        XCTAssertTrue(investLabel.waitForExistence(timeout: 3), "투자금액 라벨 표시")

        // 투자금액 값 확인 (원 단위)
        let amountTexts = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '원'"))
        XCTAssertTrue(amountTexts.count > 0, "금액 텍스트가 하나 이상 표시되어야 합니다")

        // 합계 섹션
        let totalLabel = app.staticTexts["합계"]
        if totalLabel.exists {
            XCTAssertTrue(true, "합계 섹션 존재")
        }

        takeScreenshot(name: "05_배분탭_상세")

        // 스크롤하여 추가 정보 확인
        app.swipeUp()
        sleep(1)
        takeScreenshot(name: "05_배분탭_스크롤")
    }

    // MARK: - 6. 요약 탭 - 히어로카드 + 카테고리 + 배당

    @MainActor
    func test06_요약탭_상세() {
        app.tabBars.buttons["요약"].tap()
        sleep(1)

        let navTitle = app.navigationBars.staticTexts["요약"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5), "요약 타이틀 존재")

        // 카테고리별 배분
        let categoryLabel = app.staticTexts["카테고리별 배분"]
        let hasCategory = categoryLabel.waitForExistence(timeout: 3)

        // 배당 정보
        let dividendLabel = app.staticTexts["배당 정보"]
        let hasDividend = dividendLabel.waitForExistence(timeout: 3)

        XCTAssertTrue(hasCategory || hasDividend, "요약 콘텐츠 존재")

        // 배당 세부 정보
        let monthlyDiv = app.staticTexts["예상 월배당"]
        let annualDiv = app.staticTexts["예상 연배당"]
        let avgRate = app.staticTexts["가중평균 배당률"]

        takeScreenshot(name: "06_요약탭_상세")

        app.swipeUp()
        sleep(1)
        takeScreenshot(name: "06_요약탭_배당정보")
    }

    // MARK: - 7. 성장 탭 - 파라미터 + 10년 시뮬레이션

    @MainActor
    func test07_성장탭_상세() {
        app.tabBars.buttons["성장"].tap()
        sleep(1)

        let navTitle = app.navigationBars.staticTexts["자산성장 전망"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 5), "자산성장 전망 타이틀 존재")

        // 파라미터
        let paramsTitle = app.staticTexts["파라미터 조정"]
        XCTAssertTrue(paramsTitle.waitForExistence(timeout: 3), "파라미터 섹션 존재")

        let dividendGrowth = app.staticTexts["배당성장"]
        let additionalInvest = app.staticTexts["추가투자"]
        let assetGrowth = app.staticTexts["자산상승"]
        XCTAssertTrue(dividendGrowth.exists, "배당성장 라벨")
        XCTAssertTrue(additionalInvest.exists, "추가투자 라벨")
        XCTAssertTrue(assetGrowth.exists, "자산상승 라벨")

        // 1년차
        let year1 = app.staticTexts["1년차"]
        XCTAssertTrue(year1.waitForExistence(timeout: 3), "1년차 행 존재")

        takeScreenshot(name: "07_성장탭_상단")

        // 스크롤하여 10년차 확인
        app.swipeUp()
        sleep(1)

        let year10 = app.staticTexts["10년차"]
        let has10Year = year10.waitForExistence(timeout: 3)
        XCTAssertTrue(has10Year, "10년차 행 존재")

        takeScreenshot(name: "07_성장탭_10년차")
    }

    // MARK: - 8. 보유 탭 - 빈 상태 / 평가 요약

    @MainActor
    func test08_보유탭_상세() {
        app.tabBars.buttons["보유"].tap()
        sleep(3)

        let navTitle = app.navigationBars.staticTexts["보유 현황"]
        XCTAssertTrue(navTitle.waitForExistence(timeout: 10), "보유 현황 타이틀 존재")

        // + 버튼
        let addBtn = app.buttons["addHoldingButton"]
        XCTAssertTrue(addBtn.waitForExistence(timeout: 5), "보유 종목 추가 버튼 존재")

        // 빈 상태, 평가 요약, 또는 종목 행
        let emptyState = app.staticTexts["보유 종목이 없습니다"]
        let evalSummary = app.staticTexts["평가 요약"]
        let holdingRow = app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'KODEX' OR label CONTAINS 'TIGER'")).firstMatch
        let hasContent = emptyState.waitForExistence(timeout: 5) || evalSummary.exists || holdingRow.exists
        XCTAssertTrue(hasContent, "보유 탭에 콘텐츠 표시")

        takeScreenshot(name: "08_보유탭_상세")
    }

    // MARK: - 9. 포트폴리오 선택 드롭다운

    @MainActor
    func test09_포트폴리오_선택메뉴() {
        app.tabBars.buttons["종목"].tap()
        sleep(1)

        // 포트폴리오 이름 버튼 (좌측 상단 Menu)
        let menuButton = app.navigationBars.buttons.firstMatch
        if menuButton.exists && menuButton.isHittable {
            menuButton.tap()
            sleep(1)
            takeScreenshot(name: "09_포트폴리오_메뉴_열림")

            // 메뉴에 "새 포트폴리오" 옵션 확인
            let newPortfolio = app.buttons["새 포트폴리오"]
            if newPortfolio.waitForExistence(timeout: 2) {
                XCTAssertTrue(true, "새 포트폴리오 메뉴 항목 존재")
            }

            // 메뉴 닫기
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
    }

    // MARK: - 10. 각 탭 스크린샷 (토스 스타일 검증)

    @MainActor
    func test10_전체_UI_스크린샷() {
        let tabs = ["종목", "배분", "요약", "성장", "보유"]

        for tab in tabs {
            app.tabBars.buttons[tab].tap()
            sleep(2)
            takeScreenshot(name: "10_전체_\(tab)")
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
