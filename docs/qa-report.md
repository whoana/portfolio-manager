# Zero Script QA 종합 보고서

- **프로젝트**: ETF 포트폴리오 관리 웹앱
- **검증일**: 2026-02-22
- **검증 환경**: Next.js 14 dev server (localhost:3001), macOS Darwin 25.3.0
- **검증 도구**: Vitest + RTL + MSW, tsc, curl, Playwright MCP, code-analyzer

---

## 1. 테스트 결과 요약

| Phase | 항목 | 결과 | 비고 |
|-------|------|------|------|
| A-1 | 기존 테스트 | **PASS** (97/97) | 10 파일, 4.94s |
| A-2 | 타입 체크 | **PASS** (에러 0) | `npx tsc --noEmit` |
| A-3 | 커버리지 | 66.82% Stmts | 상세 분석 아래 참조 |
| B-1 | search 정상 (TIGER) | **PASS** | 200, 10 items |
| B-2 | search 한글 (삼성) | **PASS** | 200, 10 items |
| B-3 | search 빈값 | **PASS** | 200, items=[] |
| B-4 | price 유효 (360750) | **PASS** | 200, price=24,700 |
| B-5 | price 무효 (000000) | **PASS** | 409, 에러 응답 |
| B-UI | 인트로 페이지 | **PASS** | 제목, CTA, 복리 시뮬레이션 렌더링 |
| B-UI | 메인 화면 전환 | **PASS** | 6종목 테이블, 투자배분, 요약, 성장전망 |
| B-UI | 테마 전환 | **PASS** | Claude/Dark/Classic 3개 모두 동작 |

---

## 2. 커버리지 분석

### 전체 커버리지

| 지표 | 수치 |
|------|------|
| Statements | 66.82% |
| Branches | 90.62% |
| Functions | 75.8% |
| Lines | 66.82% |

### 파일별 커버리지 상세

| 파일 | Stmts | Branch | Funcs | Lines | 상태 |
|------|-------|--------|-------|-------|------|
| portfolioCalc.ts | 100% | 100% | 100% | 100% | 완전 커버 |
| portfolioStorage.ts | 100% | 100% | 100% | 100% | 완전 커버 |
| settingsStorage.ts | 100% | 76.47% | 100% | 100% | 양호 |
| helpSteps.ts | 100% | 100% | 100% | 100% | 완전 커버 |
| IntroPage.tsx | 100% | 100% | 100% | 100% | 완전 커버 |
| PortfolioTable.tsx | 100% | 94.44% | 100% | 100% | 양호 |
| AddStockModal.tsx | 100% | 92.3% | 80% | 100% | 양호 |
| StockSearch.tsx | 96.92% | 93.33% | 100% | 96.92% | 양호 |
| BalloonTooltip.tsx | 91.53% | 89.18% | 50% | 91.53% | 보통 |
| stock/search/route.ts | 100% | 100% | 100% | 100% | 완전 커버 |
| stock/price/route.ts | 95% | 87.5% | 100% | 95% | 양호 |
| **growthCalc.ts** | **0%** | 100% | 100% | **0%** | **미커버** |
| **naverFinance.ts** | **0%** | 100% | 100% | **0%** | **미커버** |
| **AllocationTable.tsx** | **0%** | 0% | 0% | **0%** | **미커버** |
| **GrowthReport.tsx** | **0%** | 0% | 0% | **0%** | **미커버** |
| **PortfolioSummary.tsx** | **0%** | 0% | 0% | **0%** | **미커버** |
| **SettingsBar.tsx** | **0%** | 0% | 0% | **0%** | **미커버** |
| **ClientProviders.tsx** | **0%** | 0% | 0% | **0%** | **미커버** |
| exportExcel.ts | 제외 | 제외 | 제외 | 제외 | 커버리지 제외 |

### 주요 커버리지 갭

1. **growthCalc.ts (0%)** -- 금융 계산 로직이므로 정확성 검증이 필수. 정상 성장, 0 투자금, 극단값 등 테스트 필요.
2. **AllocationTable.tsx (0%)** -- 투자금액 입력, 배분 테이블, 합계 행 등 핵심 UI.
3. **PortfolioSummary.tsx (0%)** -- 요약 지표 표시, Excel 내보내기 버튼.
4. **GrowthReport.tsx (0%)** -- 성장 전망 파라미터 입력, 10년 시뮬레이션 테이블.
5. **exportExcel.ts (제외)** -- 700줄 모노리식 함수, 최소한 데이터 준비 로직만이라도 테스트 필요.

---

## 3. API 라이브 테스트 결과

### 검색 API (`/api/stock/search`)

| 테스트 | 입력 | HTTP | 응답 | 판정 |
|--------|------|------|------|------|
| 영문 검색 | `q=TIGER` | 200 | 10개 종목 반환 | PASS |
| 한글 검색 | `q=삼성` | 200 | 10개 종목 반환 (삼성전자, SDI 등) | PASS |
| 빈 검색어 | `q=` | 200 | `{"items":[]}` | PASS |

### 시세 API (`/api/stock/price/{code}`)

| 테스트 | 입력 | HTTP | 응답 | 판정 |
|--------|------|------|------|------|
| 유효 코드 | `360750` | 200 | `{"code":"360750","name":"TIGER 미국S&P500","price":24700}` | PASS |
| 무효 코드 | `000000` | 409 | `{"error":"현재가 조회 실패"}` | PASS |

---

## 4. UI 검증 결과

| 시나리오 | 검증 항목 | 결과 | 비고 |
|----------|----------|------|------|
| 인트로 페이지 | 제목 "복리의 마법, 장기 투자의 힘" | PASS | |
| | CTA "포트폴리오 시작하기 →" 버튼 | PASS | |
| | 복리 시뮬레이션 (10/20/30년) | PASS | |
| | 도움말 풍선 툴팁 | PASS | 건너뛰기/다음 동작 확인 |
| 테마 전환 | Claude (기본) | PASS | 주황 계열 |
| | Dark | PASS | 어두운 배경, 밝은 텍스트 |
| | Classic | PASS | 네이비 계열 |
| 메인 화면 | 포트폴리오 탭 | PASS | "내 ETF 포트폴리오" 탭 활성 |
| | 자산배분 전략 테이블 (6종목) | PASS | 구분/종목명/코드/비중/배당률/현재가/전략 |
| | 투자금액별 구성표 | PASS | 매수수량, 실투자금액 자동계산 |
| | 포트폴리오 요약 | PASS | 종목수 6개, 비중 100%, 배당률 3.8% |
| | 자산성장 전망 (10년) | PASS | 파라미터 입력, 10년차 11.49억원 |
| | Excel 내보내기 버튼 | PASS | 비활성화 아님, 클릭 가능 상태 |

---

## 5. 발견사항 (심각도별)

### Critical (즉시 수정 필요) -- 3건

| # | 파일 | 라인 | 내용 |
|---|------|------|------|
| C1 | `api/stock/price/[code]/route.ts` | 14 | **SSRF 위험**: stock code 파라미터가 네이버 API URL에 검증 없이 삽입됨. `../` 등으로 임의 엔드포인트 접근 가능. `/^[A-Za-z0-9]{4,12}$/` 정규식 검증 필요. |
| C2 | `api/stock/search/route.ts` | 30 | **SSRF 위험**: 검색 쿼리에 길이 제한 없음. 최대 100자 제한 및 허용 문자 필터 권장. |
| C3 | `layout.tsx` | 19-21 | **XSS 벡터**: `dangerouslySetInnerHTML`로 인라인 스크립트 삽입. 현재 정적이지만 `localStorage` 독 주입 시 스크립트 탈출 가능. CSP nonce 기반 접근 권장. |

### High (프로덕션 전 수정 권장) -- 8건

| # | 파일 | 라인 | 내용 |
|---|------|------|------|
| H1 | `api/stock/search/route.ts` | 37 | **Rate limiting 없음**: API 프록시에 요청 제한 없어 악용 가능. |
| H2 | `api/stock/price/[code]/route.ts` | 37 | H1과 동일한 rate limiting 부재. |
| H3 | `lib/portfolioStorage.ts` | 10 | **localStorage 데이터 미검증**: `JSON.parse` 후 타입 단언만 사용. 손상된 데이터로 런타임 크래시 가능. |
| H4 | `lib/portfolioStorage.ts` | 40 | **ID 충돌 위험**: `Date.now()` 기반 ID로 빠른 연속 생성 시 중복 가능. `crypto.randomUUID()` 사용 권장. |
| H5 | `components/AddStockModal.tsx` | 57 | H4와 동일한 ID 충돌 위험. |
| H6 | `page.tsx` | 90-116 | **React Strict Mode 이중 마운트**: 데모 포트폴리오가 중복 생성될 수 있음. |
| H7 | `lib/portfolioCalc.ts` | 40-50 | **이중 계산**: `weightedDividendRate` 계산 시 `calcStockAllocation`을 종목별로 중복 호출. `results` 배열 재사용 필요. |
| H8 | `api/stock/price/[code]/route.ts` | 38 | **NaN 전파**: 네이버 API가 예상 외 값 반환 시 `parseInt`가 `NaN`을 리턴하고, 이 값이 모든 계산에 전파됨. |

### Medium (개선 권장) -- 12건

| # | 파일 | 라인 | 내용 |
|---|------|------|------|
| M1 | `AllocationTable.tsx` | 16-18 | 포트폴리오 전환 시 투자금액 입력값이 갱신되지 않는 stale state 버그. |
| M2 | `PortfolioTable.tsx` | 51-73 | `refreshAllPrices`에서 공유 배열 변이 + N번 리렌더링. `Promise.allSettled` 후 1회 업데이트 권장. |
| M3 | `exportExcel.ts` | 1-700 | 700줄 모노리식 함수. 시트별 빌더 함수로 분리 필요. |
| M4 | `growthCalc.ts` | 38 | 배당률 자체에 복리 성장 적용 -- 30년 시 3.5% → 11.3%. 상한 캡 미설정. |
| M5 | `growthCalc.ts` | 22-54 | 입력값 검증 없음 (음수, NaN 허용). |
| M6 | `GrowthReport.tsx` | 17 | 포트폴리오 전환 시 성장 파라미터가 리셋되지 않음. |
| M7 | `page.tsx` | 172 | 마지막 포트폴리오 삭제 시 빈 상태 복구 불가. |
| M8 | `StockSearch.tsx` | 144 | 외부 API 데이터 직접 렌더링 (현재 React JSX 이스케이프로 안전하나 주의 필요). |
| M9 | `api/stock/search/route.ts` | 33-34 | 하드코딩된 User-Agent. 공유 설정으로 추출 권장. |
| M10 | `exportExcel.ts` | 691-699 | 다운로드 실패 시 메모리 누수 가능성. try/finally 래핑 필요. |
| M11 | `PortfolioSummary.tsx` | 20-24 | **가중평균 배당률 불일치**: `targetWeight` 기준 계산. `portfolioCalc.ts`는 `actualAmount` 기준. 결과 차이 발생. |
| M12 | `GrowthReport.tsx` | 25-28 | M11과 동일한 배당률 계산 불일치. |

### Low (참고) -- 8건

| # | 내용 |
|---|------|
| L1 | `growthCalc.ts` 테스트 커버리지 0% -- 금융 계산 정확성 검증 필수. |
| L2 | `exportExcel.ts` 커버리지 제외 -- 데이터 준비 로직 분리 후 테스트 가능. |
| L3 | `page.tsx`의 67줄 `DEFAULT_STOCKS` 인라인 상수 -- 별도 파일 분리 권장. |
| L4 | `exportExcel.ts` 시트 번호 주석 불일치 (Sheet 3이 두 번 등장). |
| L5 | `search/route.ts`의 `response.json()` 미검증 -- 네이버가 HTML 반환 시 파싱 실패. |
| L6 | `BalloonTooltip.tsx` rafRef 초기값 `0` -- 의미적으로 `null` 권장. |
| L7 | 에러 핸들링 패턴 불일치 -- `settingsStorage.ts`에서 에러 무시 (`catch {}`). |
| L8 | `page.tsx`의 `confirm()`/`prompt()` -- 브라우저 기본 다이얼로그 대신 커스텀 모달 권장. |

---

## 6. 가중평균 배당률(weightedDividendRate) 불일치 상세 분석

**동일 데이터에 대해 3가지 다른 계산 방식이 존재한다:**

| 위치 | 수식 | 기준 |
|------|------|------|
| `portfolioCalc.ts:40-50` | `sum(dividendRate * actualAmount / totalActualAmount)` | 실투자금액 가중 |
| `PortfolioSummary.tsx:20-24` | `sum(targetWeight * dividendRate) / totalWeight` | 목표비중 가중 |
| `GrowthReport.tsx:25-28` | `sum(targetWeight * dividendRate) / totalWeight` | 목표비중 가중 |
| `exportExcel.ts:83-84` | `totalAnnualDividend / totalActualAmount` | 실투자금액 가중 |
| `exportExcel.ts:546-548` | `sum(targetWeight * dividendRate) / totalWeight` | 목표비중 가중 (성장 전망 시트) |

**실제 차이 (라이브 확인):**
- 투자배분 합계행: 배당률 **3.8%** (= 18,964,161 / 499,951,040 = 3.793%)
- 포트폴리오 요약: 가중평균 배당률 **3.8%**, 예상 연배당 **18,965,000원**
- 차이: 연배당 기준 약 **839원** 차이

목표비중 방식은 주가 단위로 인한 단수 주 차이를 반영하지 못한다. `portfolioCalc.ts`의 실투자금액 기준이 더 정확하므로, 이를 정규 수식(canonical formula)으로 통일 권장.

---

## 7. Excel 수식-result 정합성 검증

`exportExcel.ts`의 모든 수식 셀을 검사한 결과:

| 셀 종류 | 라인 | formula | result | 판정 |
|---------|------|---------|--------|------|
| 투자금액 (종목별) | 411-414 | `ROUND(B*D,0)` | `calc.investAmount` | PASS |
| 매수수량 (종목별) | 418-421 | `INT(E/C)` | `qtyResult` | PASS |
| 실투자금액 (종목별) | 423-426 | `F*C` | `calc.actualAmount` | PASS |
| 월배당 (종목별) | 428-431 | `ROUND(G*J/12,0)` | `calc.monthlyDividend` | PASS |
| 연배당 (종목별) | 433-436 | `ROUND(G*J,0)` | `calc.annualDividend` | PASS |
| 비중 합계 | 466-469 | `SUM(D:D)` | `totalWeight` | PASS |
| 투자금액 합계 | 473-477 | `SUM(E:E)` | `totalInvestAmount` | PASS |
| 매수수량 합계 | 481-485 | `SUM(F:F)` | `totalQty` | PASS |
| 실투자금액 합계 | 489-494 | `SUM(G:G)` | `totalActualAmount` | PASS |
| 월배당 합계 | 497-502 | `SUM(H:H)` | `totalMonthlyDividend` | PASS |
| 연배당 합계 | 505-510 | `SUM(I:I)` | `totalAnnualDividend` | PASS |
| 가중배당률 합계 | 513-518 | `IFERROR(I/G,0)` | `weightedDivRate` | PASS |

**모든 수식 셀에 result 값이 존재하며, 수식과 result 간 논리적 정합성 확인 완료.**

---

## 8. 중복 코드 분석

| 중복 패턴 | 위치 | 유사도 | 권장 조치 |
|----------|------|--------|----------|
| `weightedDividendRate` 계산 | PortfolioSummary, GrowthReport, exportExcel (3곳) | ~90% | 공유 유틸리티 함수 추출 |
| `totalWeight` 계산 | portfolioCalc, PortfolioTable, AllocationTable, PortfolioSummary, GrowthReport (5곳) | 100% | `calcTotalWeight(stocks)` 함수 추출 |
| 네이버 API fetch 패턴 | search/route.ts, price/route.ts | ~80% | 공유 `naverFetch(url)` 헬퍼 추출 |

---

## 9. 권고사항

### 즉시 조치 (Critical)
1. stock code 입력값 정규식 검증 추가 (`/^[A-Za-z0-9]{4,12}$/`)
2. 검색 쿼리 길이 제한 (max 100자)
3. `dangerouslySetInnerHTML` 인라인 스크립트에 테마 값 화이트리스트 강화

### 프로덕션 전 (High)
4. API 프록시에 rate limiting 미들웨어 추가
5. localStorage 파싱 시 런타임 스키마 검증 (Zod 등)
6. ID 생성을 `crypto.randomUUID()`로 전환
7. React Strict Mode 이중 초기화 방어
8. 시세 API NaN 방어 로직 추가

### 코드 품질 개선 (Medium)
9. `weightedDividendRate` 계산 로직 단일화 (portfolioCalc.ts의 actualAmount 기준으로 통일)
10. `AllocationTable` 포트폴리오 전환 시 stale state 수정
11. `exportExcel.ts` 시트별 함수 분리
12. `growthCalc.ts` 입력값 검증 + 배당률 상한 캡

### 테스트 확충 (Low)
13. `growthCalc.ts` 단위 테스트 작성
14. `AllocationTable`, `PortfolioSummary`, `GrowthReport` 컴포넌트 테스트 추가
15. `exportExcel.ts` 데이터 준비 로직 분리 후 테스트

---

## 10. 품질 점수

| 항목 | 점수 | 비고 |
|------|------|------|
| 기능 동작 | 95/100 | 모든 기능 정상, 배당률 불일치만 있음 |
| 테스트 커버리지 | 67/100 | 66.82% stmts, 주요 컴포넌트 미커버 |
| 코드 품질 | 72/100 | 중복 코드, 모노리식 함수 존재 |
| 보안 | 60/100 | SSRF, rate limiting, 입력 검증 부재 |
| **종합** | **72/100** | |
