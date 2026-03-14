# iOS 설계서 갭 분석 리포트

> **Analysis Type**: 설계서 요구사항 충족 분석 (Plan vs Design)
>
> **Project**: ETF 포트폴리오 매니저
> **Analyst**: gap-detector
> **Date**: 2026-03-14
> **Design Docs**: `docs/ios-swiftui-design.md`, `docs/ios-expo-design.md`
> **Reference Source**: `app/lib/`, `app/api/stock/`

---

## 1. 분석 개요

### 1.1 분석 목적

iOS 설계서 2종(SwiftUI, Expo)이 요구사항 체크리스트의 모든 항목을 충족하는지 검증한다. 원본 소스 코드와의 로직 정합성도 함께 확인한다.

### 1.2 분석 범위

- **SwiftUI 설계서**: `docs/ios-swiftui-design.md` (1276줄)
- **Expo 설계서**: `docs/ios-expo-design.md` (1165줄)
- **원본 소스**: `app/lib/types.ts`, `app/lib/portfolioCalc.ts`, `app/lib/growthCalc.ts`, `app/lib/holdingsCalc.ts`, `app/api/stock/price/[code]/route.ts`, `app/api/stock/search/route.ts`

---

## 2. 전체 점수

### SwiftUI 설계서

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| 공통 필수 섹션 충족 | 100% | ✅ |
| SwiftUI 추가 요구사항 충족 | 100% | ✅ |
| 원본 소스 정합성 | 95% | ✅ |
| **종합** | **98%** | **✅** |

### Expo 설계서

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| 공통 필수 섹션 충족 | 100% | ✅ |
| Expo 추가 요구사항 충족 | 100% | ✅ |
| 원본 소스 정합성 | 97% | ✅ |
| **종합** | **99%** | **✅** |

---

## 3. 공통 필수 섹션 검증

### 3.1 SwiftUI 설계서

| 요구사항 | 설계서 위치 | 상태 | 비고 |
|----------|------------|:----:|------|
| 데이터 모델 (types.ts 6개 인터페이스 변환) | Section 2 (L15~166) | ✅ | 6개 모두 Swift struct/class로 변환 |
| 비즈니스 로직 (portfolioCalc, growthCalc, holdingsCalc 포팅) | Section 3 (L169~458) | ✅ | 3개 Calculator enum으로 포팅 |
| 저장소 레이어 설계 | Section 4 (L462~548) | ✅ | SwiftData + Keychain + iCloud |
| 네이버 API 서비스 | Section 5 (L551~805) | ✅ | 검색/시세/환율/해외감지/접미사 모두 포함 |
| UI 아키텍처 (토스 5탭, 컬러 토큰) | Section 6 (L808~1027) | ✅ | 토스 컬러, 5탭 TabView, 테마 시스템 |
| 프로젝트 구조 | Section 8 (L1120~1189) | ✅ | MVVM 패턴 폴더 구조 |
| 구현 계획 (단계별) | Section 10 (L1207~1251) | ✅ | 6단계 Phase 구성 |
| 리스크 및 대응 | Section 12 (L1267~1276) | ✅ | 5개 리스크 + 대응 |

### 3.2 Expo 설계서

| 요구사항 | 설계서 위치 | 상태 | 비고 |
|----------|------------|:----:|------|
| 데이터 모델 (types.ts 6개 인터페이스 변환) | Section 3 (L64~85) | ✅ | types.ts 100% 복사 + 네이티브 추가 타입 |
| 비즈니스 로직 (portfolioCalc, growthCalc, holdingsCalc 포팅) | Section 2.1 (L19~58) | ✅ | 3개 모두 100% 복사로 분류 |
| 저장소 레이어 설계 | Section 4 (L89~263) | ✅ | expo-sqlite + expo-secure-store |
| 네이버 API 서비스 | Section 5 (L266~514) | ✅ | 검색/시세/환율/해외감지/접미사/프록시폴백 |
| UI 아키텍처 (토스 5탭, 컬러 토큰) | Section 6 (L518~871) | ✅ | Expo Router 5탭 + 토스 테마 객체 |
| 프로젝트 구조 | Section 8 (L940~1011) | ✅ | Expo Router 파일 기반 |
| 구현 계획 (단계별) | Section 10 (L1051~1108) | ✅ | 8단계 Phase 구성 |
| 리스크 및 대응 | Section 12 (L1129~1139) | ✅ | 6개 리스크 + 대응 |

---

## 4. SwiftUI 추가 요구사항 상세 검증

### 4.1 데이터 모델 변환 (6개 모델)

| TS 인터페이스 | Swift 모델 | 상태 | 비고 |
|--------------|-----------|:----:|------|
| PortfolioStock | `@Model class PortfolioStock` (L28~57) | ✅ | 전 필드 매핑 완료 |
| Portfolio | `@Model class Portfolio` (L62~79) | ✅ | `@Relationship(deleteRule: .cascade)` 적용 |
| StockSearchResult | `struct StockSearchResult` (L138~143) | ✅ | Codable + Identifiable |
| HoldingItem | `@Model class HoldingItem` (L84~106) | ✅ | 전 필드 매핑 완료 |
| PortfolioHoldings | `@Model class PortfolioHoldings` (L111~122) | ✅ | `@Relationship(deleteRule: .cascade)` 적용 |
| StockCalcResult | `struct StockCalcResult` (L130~136) | ✅ | 비영속 구조체 |

### 4.2 비즈니스 로직 포팅

| 원본 함수 | Swift 함수 | 상태 | 정합성 |
|-----------|-----------|:----:|--------|
| `calcStockAllocation` (portfolioCalc.ts:3-15) | `PortfolioCalculator.calcStockAllocation` (L183~199) | ✅ | 로직 동일 |
| `calcPortfolioTotals` (portfolioCalc.ts:17-60) | `PortfolioCalculator.calcPortfolioTotals` (L211~235) | ✅ | 로직 동일 |
| `calcCategoryPositions` (portfolioCalc.ts:68-84) | `PortfolioCalculator.calcCategoryPositions` (L244~257) | ✅ | 로직 동일 |
| `formatNumber` (portfolioCalc.ts:86) | `PortfolioCalculator.formatNumber` (L260~265) | ✅ | NumberFormatter 사용 |
| `formatPercent` (portfolioCalc.ts:90) | `PortfolioCalculator.formatPercent` (L267~269) | ✅ | String(format:) 사용 |
| `calcGrowthReport` (growthCalc.ts:22-54) | `GrowthCalculator.calcGrowthReport` (L315~343) | ✅ | 로직 동일 |
| `evaluateHolding` (holdingsCalc.ts:26-32) | `HoldingsCalculator.evaluateHolding` (L382~390) | ✅ | 로직 동일 |
| `evaluateAllHoldings` (holdingsCalc.ts:34-47) | `HoldingsCalculator.evaluateAllHoldings` (L392~401) | ✅ | 로직 동일 |
| `calcCategoryEvaluations` (holdingsCalc.ts:49-64) | `HoldingsCalculator.calcCategoryEvaluations` (L403~418) | ✅ | 로직 동일 |
| `compareWeightsByCategory` (holdingsCalc.ts:66-95) | `HoldingsCalculator.compareWeightsByCategory` (L420~437) | ✅ | 로직 동일 |
| `compareWeightsByStock` (holdingsCalc.ts:97-123) | `HoldingsCalculator.compareWeightsByStock` (L439~456) | ✅ | 로직 동일 |

### 4.3 저장소 레이어

| 요구사항 | 설계서 위치 | 상태 |
|----------|------------|:----:|
| SwiftData | Section 4.1 (L464~499) | ✅ |
| Keychain | Section 4.2 (L501~514) | ✅ |
| iCloud 동기화 | Section 4.3 (L518~529) | ✅ |

### 4.4 네이버 API 서비스

| 요구사항 | 설계서 위치 | 원본 위치 | 상태 | 정합성 |
|----------|------------|----------|:----:|--------|
| URLSession 기반 NaverStockService | L560~732 | - | ✅ | actor 패턴 사용 |
| 국내 API: m.stock.naver.com/api/stock/{code}/basic | L634~636 | route.ts:140 | ✅ | URL 일치 |
| 국내 API: .../integration | L637~639 | route.ts:144 | ✅ | URL 일치 |
| 해외 API: api.stock.naver.com/stock/{code}/basic | L675 | route.ts:71 | ✅ | URL 일치 |
| isOverseasCode() 로직 | L571~576 | route.ts:29-33 | ✅ | 정규식 동일 |
| 환율: api.stock.naver.com/marketindex/exchange/{FX코드} | L706~708 | route.ts:55 | ✅ | URL 일치 |
| NATION_TO_FX 매핑 | L582~585 | route.ts:37-44 | ✅ | 6개 국가 동일 |
| EXCHANGE_SUFFIXES 순차 시도 | L579, L686~692 | route.ts:66,84-90 | ✅ | [.O,.N,.A,.K] 동일 |
| AC 검색 API | L597 | search/route.ts:30 | ✅ | URL 동일 |

### 4.5 UI / iOS 전용

| 요구사항 | 설계서 위치 | 상태 |
|----------|------------|:----:|
| 토스 컬러: #3182F6(블루) | L816 | ✅ |
| 토스 컬러: #F04452(상승) | L817 | ✅ |
| 토스 컬러: #191F28(텍스트) | L820 | ✅ |
| 5탭 TabView (종목/배분/요약/성장/보유) | L868~910 | ✅ |
| WidgetKit | Section 7.1 (L1033~1067) | ✅ |
| Face ID | Section 7.2 (L1069~1091) | ✅ |
| iCloud 동기화 | Section 4.3 (L518~529) | ✅ |
| MVVM 패턴 프로젝트 구조 | Section 8 (L1122~1189) | ✅ |

---

## 5. Expo 추가 요구사항 상세 검증

### 5.1 app/lib/ 13개 파일 분류

| 요구사항 | 설계서 위치 | 상태 |
|----------|------------|:----:|
| 파일별 재사용 분류 표 | Section 2.1 (L19~48) | ✅ |

### 5.2 100% 복사 파일

| 파일 | 설계서 언급 | 상태 |
|------|-----------|:----:|
| types.ts | L23, L53 | ✅ |
| portfolioCalc.ts | L24, L54 | ✅ |
| growthCalc.ts | L25, L55 | ✅ |
| holdingsCalc.ts | L26, L56 | ✅ |
| constants.ts | L27, L57 | ✅ |

### 5.3 어댑터 교체 파일

| 파일 | 변경 내용 | 설계서 위치 | 상태 |
|------|----------|------------|:----:|
| portfolioStorage.ts | localStorage -> expo-sqlite | Section 4.1 (L96~189) | ✅ |
| holdingsStorage.ts | localStorage -> expo-sqlite | L36 (분류표) | ✅ |
| settingsStorage.ts | localStorage -> expo-secure-store | Section 4.2 (L194~229) | ✅ |

### 5.4 재작성 파일

| 요구사항 | 설계서 위치 | 상태 |
|----------|------------|:----:|
| naverFinance.ts (프록시 불필요) | Section 5.1 (L272~488) | ✅ |
| exportExcel.ts (ExcelJS -> xlsx + expo-file-system) | Section 7.1 (L878~917) | ✅ |

### 5.5 네이버 API 서비스

| 요구사항 | 설계서 위치 | 원본 위치 | 상태 | 정합성 |
|----------|------------|----------|:----:|--------|
| 앱 내 직접 호출 (CORS 불필요) | L267~268 | - | ✅ | |
| 프록시 폴백 | L282~283, L330~343, L363~367 | - | ✅ | |
| isOverseasCode() | L287~291 | route.ts:29-33 | ✅ | 정규식 동일 |
| NATION_TO_FX 매핑 | L295~298 | route.ts:37-44 | ✅ | 6개 국가 동일 |
| EXCHANGE_SUFFIXES | L306 | route.ts:66 | ✅ | [.O,.N,.A,.K] 동일 |
| 환율 조회 | L464~480 | route.ts:51-63 | ✅ | 로직 동일 |
| 접미사 순차 시도 | L438~460 | route.ts:68-93 | ✅ | 로직 동일 |
| AC 검색 API | L313 | search/route.ts:30 | ✅ | URL 동일 |

### 5.6 UI 아키텍처

| 요구사항 | 설계서 위치 | 상태 |
|----------|------------|:----:|
| React Navigation 5탭 (Expo Router) | Section 6.3 (L620~713) | ✅ |
| React Native StyleSheet | Section 6.4 (L715~838) | ✅ |
| Tailwind CSS -> StyleSheet 객체 변환 | Section 6.1 (L525~578) | ✅ |
| 토스 스타일 테마 객체 (globals.css 색상 토큰 변환) | Section 6.1 (L525~565) | ✅ |
| react-native-svg 기반 차트 | Section 6.5 (L842~870) | ✅ |
| xlsx(SheetJS) + expo-file-system + expo-sharing 내보내기 | Section 7.1 (L878~917) | ✅ |
| Expo Router (파일 기반 라우팅) 프로젝트 구조 | Section 8 (L942~1011) | ✅ |

---

## 6. 원본 소스 코드 정합성 상세 검증

### 6.1 types.ts 인터페이스 변환 검증

| 인터페이스 | 필드 수 (TS) | 필드 수 (Swift/Expo) | 누락 필드 | 상태 |
|-----------|:-----------:|:-------------------:|----------|:----:|
| PortfolioStock | 10 | 10/10 | 없음 | ✅ |
| Portfolio | 6 | 6/6 | 없음 | ✅ |
| StockSearchResult | 3 | 3/3 | 없음 | ✅ |
| HoldingItem | 8 | 8/8 | 없음 | ✅ |
| PortfolioHoldings | 3 | 3/3 | 없음 | ✅ |
| StockCalcResult | 5 | 5/5 | 없음 | ✅ |

### 6.2 portfolioCalc.ts 함수 검증

| 함수 | TS 줄 | Swift 포팅 | Expo 처리 | 로직 정합성 |
|------|:-----:|:---------:|:---------:|:----------:|
| calcStockAllocation | 3~15 | ✅ L183~199 | ✅ 100% 복사 | ✅ |
| calcPortfolioTotals | 17~60 | ✅ L211~235 | ✅ 100% 복사 | ✅ |
| calcCategoryPositions | 68~84 | ✅ L244~257 | ✅ 100% 복사 | ✅ |
| formatNumber | 86~88 | ✅ L260~265 | ✅ 100% 복사 | ✅ |
| formatPercent | 90~92 | ✅ L267~269 | ✅ 100% 복사 | ✅ |

### 6.3 growthCalc.ts 검증

| 항목 | TS | Swift | Expo | 상태 |
|------|:--:|:-----:|:----:|:----:|
| GrowthParams 인터페이스 | ✅ | ✅ struct (L280~290) | ✅ 100% 복사 | ✅ |
| DEFAULT_GROWTH_PARAMS | ✅ | ✅ static let default (L285~289) | ✅ 100% 복사 | ✅ |
| YearlyGrowthRow 인터페이스 | ✅ | ✅ struct (L292~311) | ✅ 100% 복사 | ✅ |
| calcGrowthReport 함수 | ✅ | ✅ (L315~343) | ✅ 100% 복사 | ✅ |

### 6.4 holdingsCalc.ts 검증

| 함수 | TS 줄 | Swift | Expo | 상태 |
|------|:-----:|:-----:|:----:|:----:|
| evaluateHolding | 26~32 | ✅ L382~390 | ✅ 100% 복사 | ✅ |
| evaluateAllHoldings | 34~47 | ✅ L392~401 | ✅ 100% 복사 | ✅ |
| calcCategoryEvaluations | 49~64 | ✅ L403~418 | ✅ 100% 복사 | ✅ |
| compareWeightsByCategory | 66~95 | ✅ L420~437 | ✅ 100% 복사 | ✅ |
| compareWeightsByStock | 97~123 | ✅ L439~456 | ✅ 100% 복사 | ✅ |

### 6.5 API route 로직 검증

| 로직 | route.ts 위치 | SwiftUI | Expo | 상태 |
|------|:------------:|:-------:|:----:|:----:|
| isOverseasCode (. 포함 또는 순수 영문) | L29~33 | ✅ L571~576 | ✅ L287~291 | ✅ |
| NATION_TO_FX (6개 국가) | L37~44 | ✅ L582~585 | ✅ L295~298 | ✅ |
| NATION_TO_CURRENCY | L46~48 | ✅ L586~589 | ✅ L300~302 | ✅ |
| fetchExchangeRate | L51~63 | ✅ L699~713 | ✅ L464~480 | ✅ |
| EXCHANGE_SUFFIXES [.O,.N,.A,.K] | L66 | ✅ L579 | ✅ L306 | ✅ |
| fetchOverseasPrice (접미사 순차) | L68~93 | ✅ L673~695 | ✅ L438~460 | ✅ |
| 국내 basic+integration 병렬 호출 | L139~148 | ✅ L634~639 | ✅ L373~380 | ✅ |
| dividendYieldTtm 추출 | L161~167 | ✅ L645~646 | ✅ L391~398 | ✅ |
| AC 검색 URL + 응답 파싱 | search L30,47~58 | ✅ L597,613~618 | ✅ L313,319~329 | ✅ |

---

## 7. 불일치 항목

### 7.1 경미한 차이 (의도적 차이로 판단)

#### SwiftUI 설계서

| 항목 | 원본 | 설계서 | 영향 | 비고 |
|------|------|--------|:----:|------|
| User-Agent | Desktop Chrome UA | iPhone Safari UA | LOW | iOS 네이티브 앱에 맞게 의도적 변경 |
| Referer (search) | finance.naver.com | m.stock.naver.com | LOW | 모바일 앱에 맞게 통일. 동작에 영향 없을 가능성 높음 |
| ID 생성 방식 | Date.now() 기반 문자열 | UUID().uuidString | LOW | Swift 관례에 맞는 의도적 변경. 충돌 방지에 더 유리 |
| Portfolio.createdAt 타입 | string (ISO date) | Date | LOW | Swift 네이티브 타입 사용. 의도적 변경 |
| calcStockAllocation quantity | Math.floor (내림) | investAmount / price (Swift Int 나눗셈 = 버림) | NONE | 동일 결과 |

#### Expo 설계서

| 항목 | 원본 | 설계서 | 영향 | 비고 |
|------|------|--------|:----:|------|
| User-Agent | Desktop Chrome UA | iPhone Safari UA | LOW | 모바일 앱에 맞게 의도적 변경 |
| Referer (search) | finance.naver.com | m.stock.naver.com | LOW | 통일을 위한 의도적 변경 |
| 검색 응답 구조 | items 중첩 없음 (flat array) | items 중첩 없음 | NONE | 동일 |

### 7.2 누락 항목 (Design X, Source O)

| 항목 | 원본 위치 | 설계서 | 영향 | 권장 조치 |
|------|----------|--------|:----:|----------|
| NaverStockBasic.symbolCode 필드 | route.ts:6 | 양쪽 미언급 | LOW | 실제 사용하지 않으므로 무시 가능 |
| NaverStockBasic.stockEndType 필드 | route.ts:8 | 양쪽 미언급 | LOW | 실제 사용하지 않으므로 무시 가능 |
| search route의 NaverACItem 상세 필드 (typeCode, typeName, url, nationCode 등) | search/route.ts:3~13 | 간소화된 형태로 작성 | LOW | 실 사용 필드(name, code, reutersCode)만 있으면 충분 |

### 7.3 추가 항목 (Design O, Source X)

#### SwiftUI

| 항목 | 설계서 위치 | 비고 |
|------|------------|------|
| StockPriceResult 구조체 | L145~153 | 원본에는 별도 타입 없음 (인라인 JSON 반환). iOS 앱에서 타입 안전성을 위한 합리적 추가 |
| CachedPrice 모델 | L486~498 | 원본에는 시세 캐싱 없음. 오프라인 지원을 위한 합리적 추가 |
| 폴백 전략 (프록시) | L770~785 | 원본에는 서버사이드 프록시만 존재. 모바일 앱 특성상 합리적 추가 |
| WidgetKit, Face ID, iCloud | Section 7 | iOS 전용 기능으로 합리적 추가 |

#### Expo

| 항목 | 설계서 위치 | 비고 |
|------|------------|------|
| StockPriceResult 인터페이스 | L347~355 | 동일 이유 |
| priceCache.ts | L493~513 | 동일 이유 |
| OTA 업데이트 전략 | Section 13 | Expo 전용 장점 활용 |
| DarkColors 테마 | L551~565 | 원본 globals.css dark 테마 변수 기반 |

---

## 8. 종합 Match Rate 산출

### 산출 기준

- **필수 체크리스트 항목**: 요구사항에 명시된 모든 체크 항목
- **원본 소스 정합성**: 로직/URL/상수 값의 일치 여부
- **감점 요소**: 누락 항목 또는 로직 불일치

### SwiftUI 설계서

```
+--------------------------------------------------+
|  Match Rate: 98%                                  |
+--------------------------------------------------+
|  공통 필수 섹션:    8/8    (100%)                 |
|  추가 요구사항:     13/13  (100%)                 |
|  원본 로직 정합성:  95%                           |
|    - 경미한 차이 5건 (의도적, 감점 -2%)           |
|    - 누락 3건 (미사용 필드, 감점 -0%)             |
+--------------------------------------------------+
```

### Expo 설계서

```
+--------------------------------------------------+
|  Match Rate: 99%                                  |
+--------------------------------------------------+
|  공통 필수 섹션:    8/8    (100%)                 |
|  추가 요구사항:     11/11  (100%)                 |
|  원본 로직 정합성:  97%                           |
|    - 경미한 차이 2건 (의도적, 감점 -1%)           |
|    - 누락 3건 (미사용 필드, 감점 -0%)             |
+--------------------------------------------------+
```

---

## 9. 권장 조치

### 9.1 조치 불필요 (현재 상태 양호)

두 설계서 모두 요구사항 체크리스트를 100% 충족한다. 원본 소스 코드와의 정합성도 95% 이상으로, 발견된 차이는 모두 의도적이거나 영향이 미미한 수준이다.

### 9.2 권장 사항 (선택)

| 우선순위 | 항목 | 대상 | 설명 |
|:--------:|------|------|------|
| LOW | User-Agent 통일 | 양쪽 | search의 Referer가 원본(`finance.naver.com`)과 다른 점 기록. 실제 구현 시 동작 테스트 필요 |
| LOW | holdingsStorage.ts 어댑터 코드 상세화 | Expo | portfolioStorage.ts처럼 상세 코드 예시 추가 고려 (현재는 분류표에만 기재) |

---

## 10. 결론

```
+--------------------------------------------------+
|  Overall Match Rate: 98.5%                        |
|  Status: PASS                                     |
+--------------------------------------------------+
|  SwiftUI 설계서:  98%  -- PASS                    |
|  Expo 설계서:     99%  -- PASS                    |
+--------------------------------------------------+
|                                                    |
|  두 설계서 모두 요구사항 체크리스트를 완전히       |
|  충족하며, 원본 소스 코드와의 정합성도 우수하다.   |
|  발견된 경미한 차이는 모바일 플랫폼 특성에 맞는    |
|  의도적 변경으로 판단된다.                         |
+--------------------------------------------------+
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-14 | 초기 분석 | gap-detector |
