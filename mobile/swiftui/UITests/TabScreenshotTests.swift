import XCTest

/// 5개 탭을 순회하며 스크린샷을 캡처하는 테스트.
/// 스크린샷은 Xcode Results Bundle에 저장되며,
/// /tmp/screenshots/ 에도 PNG로 내보낸다.
final class TabScreenshotTests: XCTestCase {

    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        continueAfterFailure = true
        app.launch()
        // 앱 로딩 + 데모 데이터 시드 대기
        sleep(3)
    }

    @MainActor
    func testCaptureAllTabs() {
        let tabs = ["종목", "배분", "요약", "성장", "보유"]

        for (index, tabName) in tabs.enumerated() {
            // 탭 전환
            let tabButton = app.tabBars.buttons[tabName]
            XCTAssertTrue(tabButton.waitForExistence(timeout: 5), "\(tabName) 탭 버튼 존재")
            tabButton.tap()
            sleep(2)

            // 상단 스크린샷
            takeScreenshot(name: "\(String(format: "%02d", index))_\(tabName)_상단")

            // 스크롤 다운 후 하단 스크린샷
            app.swipeUp()
            sleep(1)
            takeScreenshot(name: "\(String(format: "%02d", index))_\(tabName)_하단")

            // 보유 탭은 더 아래 콘텐츠가 있으므로 한 번 더 스크롤
            if tabName == "보유" || tabName == "성장" {
                app.swipeUp()
                sleep(1)
                takeScreenshot(name: "\(String(format: "%02d", index))_\(tabName)_최하단")
            }
        }
    }

    private func takeScreenshot(name: String) {
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
