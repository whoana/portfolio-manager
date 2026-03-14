# HANDOFF: ETF 포트폴리오 매니저

## Goal

누구나 쉽게 사용할 수 있는 ETF 포트폴리오 관리 웹앱 + iOS 네이티브 앱.
종목 검색(코드/한글/영문) -> 포트폴리오 구성(비중 설정) -> 투자금액별 자동계산 -> Excel 내보내기 -> 자산성장 전망 리포트.
**모바일 UX는 토스앱 스타일로 리디자인 완료.**
**보유 내역 관리 + 평가액 기능 구현 완료.**
**SwiftUI 네이티브 iOS 앱 구현 + 시뮬레이터 실행 + XCUITest 자동화 테스트 완료.**
**데이터 관리(CSV/JSON Import/Export) + 인트로 화면 + 앱 아이콘/표시이름 + iPhone 실기기 배포 완료.**

---

## Current Progress

**웹앱: 전체 기능 구현 완료. (136 tests)**
**iOS SwiftUI 앱: 전체 구현 + 유닛 27 + UI 15 = 42 tests 전체 통과. 시뮬레이터 실행 검증 완료.**
**iOS 앱: 데이터 관리 6개 메뉴 + 인트로 화면 + 앱 아이콘 + 표시이름 + iPhone 실기기 배포 완료. (2026-03-14)**

### 웹앱 (Next.js)

- [x] 초기 구현 완료 (Phase 1~6)
- [x] 한글 종목 검색 지원 추가
- [x] 키보드 내비게이션 (ArrowUp/Down/Enter/Escape)
- [x] 행 더블클릭 수정 모드
- [x] Vitest 테스트 인프라 구축 -- 136 tests, 13 test files, 모두 통과
- [x] Excel 내보내기 버그 수정 2건
- [x] 자산성장 전망 리포트 기능 추가
- [x] 종목 추가 시 ETF 분배율(TTM) 자동 조회 및 채움
- [x] 모바일 반응형 레이아웃 전면 적용
- [x] **토스앱 스타일 모바일 UI 리디자인** (f769917)
- [x] **보유 내역 관리 + 평가액 기능 전체 구현** (559f0da)

### iOS SwiftUI 앱 (mobile/swiftui/)

- [x] 설계서 2종 작성 (`docs/ios-swiftui-design.md`, `docs/ios-expo-design.md`)
- [x] 설계서 Gap Analysis 완료 (98.5% Match Rate)
- [x] **SwiftUI 네이티브 전체 구현 (32 Swift 소스 파일)**
- [x] **유닛 테스트 27개 전체 통과 (4 스위트)**
- [x] **xcodegen으로 .xcodeproj 생성 (project.yml 기반)**
- [x] **iOS 시뮬레이터에서 앱 실행 확인 (iPhone 17 Pro)**
- [x] **XCUITest 자동화 15개 전체 통과 (2 스위트)**
- [x] **데모 데이터 시더 (DemoDataSeeder) — 441640 50% + 458730 50% 자동 구성**
- [x] **데이터 관리 기능 (와플 메뉴 6개 항목)** — CSV/JSON Import/Export
- [x] **인트로 화면** — 웹앱 IntroPage 포팅 (5장 카드 캐러셀 + 복리 시뮬레이션)
- [x] **앱 아이콘** — 1024x1024 universal icon (Assets.xcassets)
- [x] **앱 표시이름** — "마이포트맨" (CFBundleDisplayName)
- [x] **타이틀 클릭 → 인트로 복귀** — "포트폴리오 매니저" 헤더 버튼
- [x] **iPhone 실기기(13 Pro) 배포** — xcodebuild + devicectl

#### 데이터 관리 메뉴 (DataMenuSheet)

| # | 메뉴 | 방향 | 포맷 |
|---|------|------|------|
| 1 | 포트폴리오 저장 | Export | CSV (`구분,종목,종목코드,비중,배당률,전략`) |
| 2 | 보유내역 들여오기 | Import | CSV (`구분,종목,종목코드,수량,평단가`) |
| 3 | 보유내역 내보내기 | Export | CSV (동일) |
| 4 | 보유내역 템플릿 내보내기 | Export | CSV (헤더만) |
| 5 | 전체데이터 내보내기(백업) | Export | JSON (ExportFileFormat) |
| 6 | 전체데이터 들여오기(덮어씌우기) | Import | JSON (동일) |

#### iOS 테스트 결과 상세 (42 tests, 전체 통과)

| 스위트 | 유형 | 테스트 수 | 검증 대상 |
|--------|------|-----------|-----------|
| PortfolioCalculator 테스트 | Unit | 8 | 투자배분, 합계, 카테고리포지션, 포맷팅 |
| GrowthCalculator 테스트 | Unit | 6 | 10년 성장 시뮬레이션, 배당성장 복리 |
| HoldingsCalculator 테스트 | Unit | 7 | 보유종목 평가, 카테고리집계, 비중비교 |
| NaverStockService 테스트 | Unit | 4+2 | 해외주식 감지 (점포함/순수영문/국내/혼합) |
| FullFeatureUITests | UI | 10 | 탭전환, 종목추가시트, 포트폴리오메뉴, 각탭콘텐츠 |
| ScreenshotTests | UI | 5 | 2종목50/50 구성, 각탭 데이터 검증+스크린샷 |

#### iOS 구현 상세

| 계층 | 파일 수 | 주요 내용 |
|------|---------|-----------|
| Models | 4 | SwiftData `@Model` (Portfolio, Holdings, CachedPrice) + 계산 구조체 |
| Calculators | 3 | PortfolioCalculator, GrowthCalculator, HoldingsCalculator (웹앱 1:1 포팅) |
| Services | 3 | NaverStockService (actor), BiometricAuth, DataManager (CSV/JSON) |
| ViewModels | 4 | MVVM 패턴 (Portfolio, Allocation, Growth, Holdings) |
| Views | 14 | 5탭 TabView + 컴포넌트 4 + 시트 5 (DataMenu, AddHolding, DocumentPicker 추가) + IntroView |
| Theme | 3 | TossColors, TossTypography, ThemeManager |
| Constants | 1 | Categories |
| Utilities | 1 | Haptics (`#if canImport(UIKit)`) |
| Tests | 4 | 유닛 27 tests |
| UITests | 2 | XCUITest 15 tests |

---

## What Worked

### 웹앱

| 항목 | 결정 |
|------|------|
| 프레임워크 | Next.js 14.2.30 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS + CSS 변수 기반 테마 시스템 (claude/dark/classic/toss 4테마) |
| 주가 데이터 | 네이버 증권 비공식 API (서버사이드 프록시, CORS 우회) |
| Excel 내보내기 | ExcelJS (수식+result 캐시, 스타일, 병합 셀) |
| 저장소 | localStorage (JSON) -- DB 없이 |
| 테스트 | Vitest 2.1.9 + @testing-library/react + MSW 2.6.4 |

### iOS SwiftUI

| 항목 | 결정 |
|------|------|
| 아키텍처 | MVVM + SwiftData (`@Model`) |
| 최소 지원 | iOS 17.0 |
| 네이버 API | actor 기반 NaverStockService (CORS 제약 없이 직접 호출) |
| 해외주식 감지 | `code.allSatisfy { $0.isLetter && $0.isASCII }` (Swift 6 regex 대체) |
| 빌드 시스템 | Package.swift (유닛 테스트용) + xcodegen project.yml (앱+UITest용) |
| UI | 토스 스타일 5탭 TabView, Swift Charts SectorMark 파이차트 |
| UI 테스트 | XCUITest — accessibilityIdentifier로 요소 찾기, takeScreenshot 패턴 |
| 데모 데이터 | DemoDataSeeder — 앱 첫 실행 시 2종목 50/50 포트폴리오 + 보유내역 자동 생성 |
| 파일 공유 | ShareHelper (UIKit 직접 present) — SwiftUI 중첩 sheet 제약 우회 |
| 파일 가져오기 | DocumentPicker (UIDocumentPickerViewController 래퍼) |
| 온보딩 | @AppStorage("hasSeenIntro") 게이팅 + IntroView 캐러셀 |
| 실기기 배포 | xcodebuild build → xcrun devicectl device install app |

### 네이버 API 엔드포인트
- 종목 검색: `https://ac.stock.naver.com/ac?q={query}&target=stock&st=111`
- 국내 현재가: `https://m.stock.naver.com/api/stock/{code}/basic` + `/integration`
- 해외 현재가: `https://api.stock.naver.com/stock/{code}/basic` (접미사 순차 시도: `.O .N .A .K`)
- 환율: `https://api.stock.naver.com/marketindex/exchange/{FX코드}`

### XCUITest 팁
- `accessibilityIdentifier`를 SwiftUI View에 추가하여 UI 요소를 안정적으로 찾기
- `NSPredicate(format: "label CONTAINS '...'")` — 부분 텍스트 매칭에 유용
- `app.staticTexts["정확한 텍스트"]` — 정확한 매칭
- `continueAfterFailure = true` — 하나 실패해도 나머지 검증 계속
- 각 테스트는 앱을 재실행하므로 데이터 시더가 필수

---

## What Didn't Work

### 웹앱
- `vite-tsconfig-paths` 패키지 -> ESM only로 vitest.config.ts에서 CJS require 불가, 직접 alias 설정으로 대체
- **Playwright/Puppeteer 스크린샷** -> Chrome 실행 중 충돌, timeout 이슈
- **MapIterator spread** -> `Array.from(map.keys())` 로 해결

### iOS SwiftUI
- **`swift build`로 iOS 앱 빌드** -> macOS 타겟으로 빌드되어 UIKit/SwiftUI iOS-only API 오류 → `xcodebuild` + iOS Simulator destination으로 전환
- **Swift 6 regex literal `/^[A-Za-z]+$/`** -> `' is not an identifier` 컴파일 에러 → `allSatisfy` 방식으로 대체
- **`navigationBarTitleDisplayMode` macOS 에러** -> iOS 전용 API, `xcodebuild` 타겟으로 해결
- **Scheme 이름 불일치** -> `xcodebuild -list`로 실제 scheme 확인 필요
- **`pow`/`round` in scope 에러** -> 테스트 파일에 `import Foundation` 누락
- **월배당 반올림 누적 오차** -> total 수준 비교 대신 개별 종목별로 `annualDividend / 12 == monthlyDividend` 검증
- **Package.swift만으로는 .app 생성 불가** -> xcodegen으로 .xcodeproj 생성하여 시뮬레이터 실행
- **osascript 접근성 권한 없음** -> AppleScript로 시뮬레이터 UI 조작 불가 → XCUITest로 전환
- **HoldingItem ID 충돌** -> 밀리초 타임스탬프 ID가 연속 생성 시 겹힘 → UUID().uuidString으로 해결
- **보유 탭 XCUITest 콘텐츠 탐지** -> currentPrice nil이면 totalEval=0 → "평가 요약" 카드 미표시, "보유 종목이 없습니다"도 미표시 → 종목명(KODEX/TIGER)으로 콘텐츠 존재 확인
- **XCUITest에서 탭 순서 누적 지연** -> 이전 탭 전환이 쌓이면 보유 탭 로딩 시간 증가 → sleep 및 timeout 여유 필요
- **SwiftUI 중첩 sheet 빈 화면** -> DataMenuSheet(.sheet) 내에서 ShareSheet(.sheet)을 또 열면 빈 팝업 → UIKit UIActivityViewController 직접 present로 해결 (ShareHelper)
- **CSV 내보내기 ShareSheet 빈 내용** -> String을 직접 넘기면 표시 안 됨 → 임시 파일 URL로 저장 후 공유
- **보유내역 임포트 데이터 뻥튀기** -> append 방식이라 기존+신규 합산됨 → replaceAllHoldings로 교체 방식 전환
- **SwiftData @Attribute(.unique) 충돌** -> 임포트 시 holdingsVM.holdings nil 상태에서 새 객체 insert하면 portfolioId 중복 → loadHoldings() 선호출로 해결
- **Swift 타입 체커 타임아웃** -> IntroView에서 큰 배열 리터럴이 타입 추론 실패 → 함수로 분리 (`makeIntroCards()`)
- **디바이스 ID 혼동** -> ECID(00008130-...)를 devicectl에 넘기면 "not found" → CoreDevice Identifier(UUID 형태)만 인식
- **pbxproj 중복 등록** -> 같은 파일을 FileReference/BuildFile에 2번 등록하면 빌드 에러 → 등록 전 기존 항목 확인 필수

---

## File Structure

```
portfolio-manager/
├── app/                              # 웹앱 (Next.js)
│   ├── api/stock/                    # 네이버 API 프록시
│   ├── components/                   # React 컴포넌트 (17개)
│   ├── lib/                          # 비즈니스 로직 (11개)
│   ├── globals.css                   # 4개 테마 CSS 변수
│   └── page.tsx                      # 메인 페이지
├── tests/                            # 웹앱 테스트 (136 tests)
├── mobile/
│   └── swiftui/                      # iOS SwiftUI 앱
│       ├── Package.swift             # SPM 패키지 (유닛 테스트용)
│       ├── project.yml               # xcodegen 스펙 (앱+UITest 3타겟)
│       ├── ETFPortfolioManager.xcodeproj/  # 생성된 Xcode 프로젝트
│       ├── ETFPortfolioManager/      # Swift 소스 (41파일)
│       │   ├── App/                  # @main, ContentView, DemoDataSeeder
│       │   ├── Models/               # SwiftData 모델
│       │   ├── Calculators/          # 비즈니스 로직 (웹앱 포팅)
│       │   ├── Services/             # NaverStockService, BiometricAuth, DataManager
│       │   ├── ViewModels/           # MVVM ViewModel
│       │   ├── Views/                # Tabs(5) + Components(7) + Sheets(5) + IntroView
│       │   ├── Theme/                # 토스 컬러/타이포/테마매니저
│       │   ├── Constants/            # 카테고리
│       │   ├── Utilities/            # Haptics
│       │   └── Assets.xcassets/      # 앱 아이콘 (1024x1024 universal)
│       ├── Tests/                    # Swift Testing 유닛 (27 tests)
│       └── UITests/                  # XCUITest (15 tests)
│           ├── FullFeatureUITests.swift   # 10개 기능별 테스트
│           └── ScreenshotTests.swift      # 5개 탭별 스크린샷+검증
├── docs/
│   ├── ios-swiftui-design.md         # SwiftUI 설계서
│   ├── ios-expo-design.md            # Expo 설계서
│   ├── ios-considerations.md         # iOS 접근법 비교
│   └── mobile-toss-redesign.md       # 토스 스타일 UI 설계
├── CLAUDE.md
└── HANDOFF.md
```

---

## iOS 시뮬레이터 실행 방법

```bash
cd /Users/whoana/DEV/workspaces/claude-code/portfolio-manager/mobile/swiftui

# 프로젝트 재생성 (project.yml 변경 시)
xcodegen generate

# 빌드
xcodebuild build -project ETFPortfolioManager.xcodeproj \
  -scheme ETFPortfolioManager \
  -destination "platform=iOS Simulator,id=60D6B006-DAB7-4363-B7E2-744A742B7E53"

# 시뮬레이터에 설치 + 실행
APP_PATH="/Users/whoana/Library/Developer/Xcode/DerivedData/ETFPortfolioManager-gmjcpigfijmrtzfkqckodonpzfkt/Build/Products/Debug-iphonesimulator/ETFPortfolioManager.app"
xcrun simctl install 60D6B006-DAB7-4363-B7E2-744A742B7E53 "$APP_PATH"
xcrun simctl launch 60D6B006-DAB7-4363-B7E2-744A742B7E53 com.etfportfolio.manager

# 유닛 테스트 (27 tests)
xcodebuild test -project ETFPortfolioManager.xcodeproj \
  -scheme ETFPortfolioManager \
  -destination "platform=iOS Simulator,id=60D6B006-DAB7-4363-B7E2-744A742B7E53" \
  -only-testing:ETFPortfolioManagerTests

# UI 테스트 (15 tests)
xcodebuild test -project ETFPortfolioManager.xcodeproj \
  -scheme ETFPortfolioManager \
  -destination "platform=iOS Simulator,id=60D6B006-DAB7-4363-B7E2-744A742B7E53" \
  -only-testing:ETFPortfolioManagerUITests

# 전체 테스트 (42 tests)
xcodebuild test -project ETFPortfolioManager.xcodeproj \
  -scheme ETFPortfolioManager \
  -destination "platform=iOS Simulator,id=60D6B006-DAB7-4363-B7E2-744A742B7E53"

# 스크린샷 캡처
xcrun simctl io 60D6B006-DAB7-4363-B7E2-744A742B7E53 screenshot /tmp/screenshot.png

# 클린 재설치 (데이터 초기화)
xcrun simctl uninstall 60D6B006-DAB7-4363-B7E2-744A742B7E53 com.etfportfolio.manager
```

Simulator ID `60D6B006-DAB7-4363-B7E2-744A742B7E53` = iPhone 17 Pro

### iPhone 실기기 배포

```bash
cd /Users/whoana/DEV/workspaces/claude-code/portfolio-manager/mobile/swiftui

# 빌드 (실기기용)
xcodebuild -project ETFPortfolioManager.xcodeproj \
  -scheme ETFPortfolioManager \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build build

# 연결 디바이스 확인 (CoreDevice Identifier 확인)
xcrun devicectl list devices

# 설치
xcrun devicectl device install app \
  --device "CEAB8862-57B4-558D-9644-EB5F05744E71" \
  "build/Build/Products/Debug-iphoneos/ETFPortfolioManager.app"
```

실기기 ID `CEAB8862-57B4-558D-9644-EB5F05744E71` = iPhone 13 Pro (후아나)

---

## 웹앱 테스트/실행 명령

```bash
cd /Users/whoana/DEV/workspaces/claude-code/portfolio-manager
npm run dev              # 개발 서버 (http://localhost:3000)
npm run test             # 전체 테스트 (136 tests)
npm run test:coverage    # 커버리지 리포트
npm run build            # 프로덕션 빌드
```

---

## Environment

- macOS Darwin 25.3.0 (Apple Silicon)
- Node.js v24.3.0, npm 11.4.2
- Next.js 14.2.30, Vitest 2.1.9
- Xcode 16.x, Swift 5.9+, iOS 17.0 target
- xcodegen 2.45.3, cliclick (설치됨)
- 실기기: iPhone 13 Pro (CoreDevice ID: CEAB8862-57B4-558D-9644-EB5F05744E71)
- iOS 개발 스킬: `~/.claude/skills/ios-dev/skill.md` (통합 iOS 개발 가이드)
- 프로젝트 경로: `/Users/whoana/DEV/workspaces/claude-code/portfolio-manager/`

---

## DemoDataSeeder 동작

앱 첫 실행 시 (`ContentView.onAppear`) `DemoDataSeeder.seedIfNeeded(context:)`가 호출됨:
- 기존 포트폴리오가 2종목이면 스킵
- 아니면 기존 데이터 삭제 후 아래 구성 생성:
  - **포트폴리오** "테스트" (투자금액 1억원)
  - **종목 1**: 고배당 / KODEX 미국배당커버드콜액티브 / 441640 / 50% / 배당률 10%
  - **종목 2**: 배당 / TIGER 미국배당다우존스 / 458730 / 50% / 배당률 3.5%
  - **보유 내역**: 441640 500주 평단 11,000원 + 458730 300주 평단 13,500원

프로덕션 배포 시 `DemoDataSeeder` 호출을 제거하거나 조건부로 변경해야 함.

---

## Next Steps (잠재적 개선 사항)

### iOS 앱 — 즉시 가능
- [ ] 시세 갱신 (pull-to-refresh) 후 배분/요약/성장 탭 데이터 변화 확인
- [ ] DemoDataSeeder를 디버그 빌드 전용으로 분리 (`#if DEBUG`)
- [x] ~~앱 아이콘, 런치스크린 리소스 추가~~ (앱 아이콘 완료, 런치스크린 미정)
- [ ] 종목 삭제 (스와이프) 기능 확인/구현
- [ ] 오늘 추가된 기능에 대한 테스트 보강 (DataManager, IntroView 등)
- [ ] git commit — 오늘 작업분 미커밋 상태

### iOS 앱 — 중기
- [ ] Expo (React Native) 버전 구현 (`mobile/expo/`, 설계서 `docs/ios-expo-design.md` 있음)
- [ ] WidgetKit 위젯 구현 (설계서에 포함)
- [ ] iCloud 동기화 구현
- [ ] Face ID 잠금 기능 연동 (BiometricAuth 서비스 구현 완료)
- [ ] 보유 탭에서 시세 갱신 후 평가 요약 카드 표시 검증

### 웹앱
- [ ] 자산성장 전망 차트 시각화 (Chart.js 또는 Recharts)
- [ ] 포트폴리오 내보내기/가져오기 (JSON)
- [ ] 포트폴리오 간 비교 기능
- [ ] PWA 지원 (오프라인 접근, 홈화면 추가)
- [ ] 리밸런싱 가이드 (목표비중 vs 실제비중 차이 기반 매수/매도 추천)
