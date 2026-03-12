# HANDOFF: ETF 포트폴리오 매니저

## Goal

누구나 쉽게 사용할 수 있는 ETF 포트폴리오 관리 웹앱.
종목 검색(코드/한글/영문) -> 포트폴리오 구성(비중 설정) -> 투자금액별 자동계산 -> Excel 내보내기 -> 자산성장 전망 리포트.
**모바일 UX는 토스앱 스타일로 리디자인 완료.**
**보유 내역 관리 + 평가액 기능 구현 완료.**

---

## Current Progress

**전체 기능 구현 완료. 보유 내역 관리 기능 추가. 빌드/테스트 모두 정상. (136 tests)**

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

### 최근 커밋 (최신순)

```
559f0da feat: 보유 내역 관리 + 평가액 기능 전체 구현
fae1a74 chore: 기본 테마를 toss로 변경
4de6819 fix: 모바일 설정바를 접이식 기어 아이콘으로 변경
b96ac15 feat: 포트폴리오 요약에 종목 구분별 포지션 원형차트 추가
f769917 feat: 토스앱 스타일 모바일 UI 리디자인
```

### 보유 내역 기능 (559f0da) 상세

5개 Phase로 구현 완료:

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 데이터 모델 + 저장소 + 수동 입력 + 그리드 | 완료 |
| 2 | CSV Import / Export (드래그앤드롭, 자동 구분자 감지, RFC 4180) | 완료 |
| 3 | 카테고리별 평가액 원형차트 (HoldingsSummary) | 완료 |
| 4 | 목표비중 vs 실제비중 비교 바차트 (카테고리별/종목별 토글) | 완료 |
| 5 | Excel 보유내역 시트 추가 + 공통 상수 추출 (constants.ts) | 완료 |

**신규 파일 11개, 수정 파일 6개, 테스트 3개 (34 tests)**

**설계 체크 완료 사항:**
- 포트폴리오에 없는 종목이 보유내역에 포함되어도 문제 없음
- 비중 비교 함수들은 양쪽 합집합으로 동작 (targetWeight: 0으로 표시)
- 현재가 조회는 종목코드 기반 (포트폴리오 stocks와 독립적)
- CSV import 시 currentPrice 미설정 → `|| 0` 방어 + HoldingsTable 마운트 시 자동 갱신

---

## What Worked

### 플랫폼 / 기술 스택
| 항목 | 결정 |
|------|------|
| 프레임워크 | Next.js 14.2.30 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS + CSS 변수 기반 테마 시스템 (claude/dark/classic/toss 4테마) |
| 주가 데이터 | 네이버 증권 비공식 API (서버사이드 프록시, CORS 우회) |
| Excel 내보내기 | ExcelJS (수식+result 캐시, 스타일, 병합 셀) |
| 저장소 | localStorage (JSON) -- DB 없이 |
| 테스트 | Vitest 2.1.9 + @testing-library/react + MSW 2.6.4 |

### 네이버 API 엔드포인트
- 종목 검색: `https://ac.stock.naver.com/ac?q={query}&target=stock&st=111` (영문/한글/코드 모두 지원)
- 현재가 조회: `https://m.stock.naver.com/api/stock/{code}/basic`

### Vitest 설정 핵심
- `vite-tsconfig-paths` ESM 충돌 -> `resolve.alias: { "@": path.resolve(__dirname, ".") }` 로 대체
- `vi.useFakeTimers()` + `waitFor` 타임아웃 -> 실제 타이머 + `delay: null` 방식으로 해결
- `scrollIntoView` jsdom 미구현 -> `tests/setup.ts`에 `Element.prototype.scrollIntoView = vi.fn()` 추가

### Excel 수식 셀 빈 값 버그 원인
ExcelJS로 `{ formula: '...' }` 만 쓰면 캐시값(`<v>`)이 없어 Numbers/Excel에서 빈 셀로 표시됨.
-> 모든 수식 셀에 `result` 값 추가: `{ formula: '...', result: 계산값 }` 으로 해결.

### 보유 내역 기능 설계 포인트
- `HoldingItem`은 `PortfolioStock`과 독립적 -- `code`가 조인 키 (비중 비교용)
- 평가액(`quantity * currentPrice`)은 파생값으로 저장하지 않고 런타임 계산
- `holdingsCalc.ts`의 모든 `currentPrice` 참조는 `|| 0` 패턴으로 undefined 방어
- `compareWeightsByCategory/Stock` 함수는 양쪽 합집합(Set)으로 순회 → 한쪽에만 있는 항목도 안전
- MapIterator spread 시 `Array.from()` 필수 (TypeScript downlevelIteration 미사용)

### 토스 스타일 모바일 리디자인 (f769917)

**적용된 토스 UX 패턴:**
- **한 화면, 한 기능** -- 히어로 카드로 핵심 정보 즉시 노출
- **큰 숫자, 작은 라벨** -- 금액 text-2xl~3xl, 라벨 text-[10px]~[11px]
- **여유로운 여백** -- px-5, py-5~6
- **미세한 그림자** -- shadow-sm (border 대신)
- **rounded-2xl** -- 부드러운 카드 모서리
- **컬러 카테고리** -- 종목별 원형 뱃지로 시각적 구분
- **ListRow 패턴** -- 좌: 아이콘+이름, 우: 금액+chevron
- **BottomCTA** -- 모달 하단 고정 버튼 (주요 버튼 2배 넓게)
- **드래그 핸들** -- 모달 상단 회색 바

**핵심 설계 원칙:**
- 데스크톱 UI는 변경 없음 (`md:` 브레이크포인트로 분리)
- 기존 3개 테마(Claude/Dark/Classic) 유지 + Toss 추가
- 비즈니스 로직(lib/) 변경 없음
- 테스트 전체 통과

---

## What Didn't Work

- `npx create-next-app@latest` -> 기존 파일 충돌, 직접 파일 생성으로 대체
- npm cache EPERM 오류 -> `--cache /tmp/claude/npm-cache` 로 해결
- `vite-tsconfig-paths` 패키지 -> ESM only로 vitest.config.ts에서 CJS require 불가, 직접 alias 설정으로 대체
- **Playwright 스크린샷** -> Chrome이 이미 실행 중이면 `browserType.launchPersistentContext` 실패. 기존 Chrome 세션과 충돌
- **Puppeteer 스크린샷** -> `deviceScaleFactor: 2`에서 `Page.captureScreenshot timed out`. DPR 1로 낮춰도 protocolTimeout 필요
- **PortfolioTable 버튼 텍스트 변경** -> 모바일용 짧은 텍스트("갱신")와 데스크톱 텍스트("전체 시세 갱신")를 `hidden md:inline` / `md:hidden`으로 분리했으나, JSDOM 테스트에서 media query 미적용으로 두 텍스트 모두 렌더링됨 -> `aria-label`로 해결
- **MapIterator spread** -> `new Set([...targetMap.keys()])` 패턴이 TypeScript `downlevelIteration` 없으면 컴파일 에러 -> `Array.from(map.keys())` 로 해결

---

## 테마 시스템 (4개)

| 테마명 | 설명 | 배경 | 주요색 |
|--------|------|------|--------|
| `claude` | 기본 테마 (앰버/오렌지) | #FFFBF5 | #C77A2A |
| `dark` | 다크 모드 | #0F0F0F | #F5A623 |
| `classic` | 클래식 네이비 | #F5F7FA | #2C3E6B |
| `toss` | 토스 블루 | #F4F4F4 | #3182F6 |

테마 전환: `SettingsBar` (우측 상단 고정) -> `ThemeProvider` -> `<html data-theme="xxx">` -> CSS 변수 적용

---

## File Structure

```
portfolio-manager/
├── app/
│   ├── api/stock/
│   │   ├── search/route.ts              # 네이버 AC API 프록시
│   │   └── price/[code]/route.ts        # 네이버 basic API 프록시
│   ├── components/
│   │   ├── StockSearch.tsx              # 종목 검색 + 자동완성
│   │   ├── AddStockModal.tsx            # 종목 추가/수정 모달
│   │   ├── AddHoldingModal.tsx          # 보유 내역 추가/수정 모달
│   │   ├── PortfolioTable.tsx           # 포트폴리오 테이블
│   │   ├── HoldingsTable.tsx            # 보유 내역 그리드 (소계행 + CSV 버튼)
│   │   ├── HoldingsSummary.tsx          # 보유현황 요약 (카테고리 원형차트)
│   │   ├── AllocationTable.tsx          # 투자금액별 계산표
│   │   ├── PortfolioSummary.tsx         # 포트폴리오 요약 통계
│   │   ├── GrowthReport.tsx             # 자산성장 전망 리포트
│   │   ├── PieChart.tsx                 # SVG 도넛 차트
│   │   ├── BarChart.tsx                 # SVG 수평 바차트 (목표/실제 비중)
│   │   ├── WeightComparisonChart.tsx    # 비중 비교 래퍼 (카테고리/종목 토글)
│   │   ├── CsvImportModal.tsx           # CSV 가져오기 모달 (드래그앤드롭)
│   │   ├── IntroPage.tsx                # 인트로 페이지
│   │   ├── SettingsBar.tsx              # 테마/도움말 토글
│   │   ├── ThemeProvider.tsx            # 테마 컨텍스트
│   │   ├── HelpProvider.tsx             # 도움말 컨텍스트
│   │   ├── ClientProviders.tsx          # 프로바이더 래퍼
│   │   └── BalloonTooltip.tsx           # 도움말 풍선
│   ├── lib/
│   │   ├── types.ts                     # PortfolioStock, Portfolio, HoldingItem, PortfolioHoldings 등
│   │   ├── constants.ts                 # CATEGORY_OPTIONS, CATEGORY_COLORS, CATEGORY_BG_COLORS
│   │   ├── naverFinance.ts              # 네이버 API 클라이언트
│   │   ├── portfolioCalc.ts             # 매수수량/배당 계산, formatNumber/Percent
│   │   ├── holdingsCalc.ts              # 평가액/손익/수익률/카테고리집계/비중비교
│   │   ├── portfolioStorage.ts          # 포트폴리오 localStorage CRUD
│   │   ├── holdingsStorage.ts           # 보유내역 localStorage CRUD
│   │   ├── csvUtils.ts                  # CSV 파싱/내보내기 (BOM, RFC 4180)
│   │   ├── settingsStorage.ts           # 테마/도움말 설정 저장
│   │   ├── growthCalc.ts                # 자산성장 복리 계산
│   │   └── exportExcel.ts              # ExcelJS Excel 내보내기 (6시트)
│   ├── globals.css                      # 4개 테마 CSS 변수
│   ├── layout.tsx
│   └── page.tsx                         # 메인 페이지 (5탭 모바일 내비)
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── server.ts
│   │   ├── handlers.ts
│   │   └── localStorage.ts
│   ├── unit/        (portfolioCalc 17t + portfolioStorage 13t + holdingsStorage 8t + holdingsCalc 13t + csvUtils 13t + settingsStorage 7t)
│   ├── api/         (stockSearch 7t + stockPrice 7t)
│   └── components/  (StockSearch 12t + AddStockModal 15t + PortfolioTable 11t + growthCalc 15t + BalloonTooltip 3t + IntroPage 5t)
├── vitest.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

---

## localStorage 키

| 키 | 타입 | 용도 |
|----|------|------|
| `etf_portfolios` | `Portfolio[]` | 포트폴리오 목록 |
| `etf_holdings` | `PortfolioHoldings[]` | 보유 내역 (portfolioId로 매칭) |
| `etf_theme` | `ThemeName` | 현재 테마 |
| `etf_help_enabled` | `boolean` | 도움말 표시 여부 |

---

## Excel 시트 구조 (현재 6시트)

| 순서 | 시트명 | 내용 |
|------|--------|------|
| 1 | 포트폴리오 요약 | 기본 정보 + 핵심 지표 + 종목별 요약 테이블 |
| 2 | 포트폴리오 구성 | 투자 원칙 + 자산배분 전략 + 투자금액별 구성표 (수식+result) |
| 3 | 자산성장 전망 | 파라미터 + 1~10년 자산/배당 성장 전망 테이블 |
| 4 | 종목 분석 | 종목명, 핵심역할, 선정근거 |
| 5 | 자산관리자 의견 | 빈 템플릿 (시장전망, 전략의견, 리스크, 권고사항) |
| 6 | 보유 내역 | 구분/종목/코드/수량/평단가/현재가/평가액(수식) + 구분별 소계 + 합계 |

**수식 셀 주의**: 모든 `{ formula }` 에 반드시 `result` 값 포함 (미포함 시 Excel/Numbers에서 빈 셀).

---

## 자산성장 계산 공식

```
매년:
  asset[n]      = asset[n-1] * (1 + assetGrowthRate) + annualAddition
  dividendRate[n] = initialDividendRate * (1 + dividendGrowthRate)^n
  annualDiv[n]  = asset[n] * dividendRate[n]
  monthlyDiv[n] = annualDiv[n] / 12

기본값: 배당성장율 4%, 연추가투자 1,200만원, 자산상승율 7%
```

---

## 테스트 명령

```bash
npm run test           # 전체 실행 (136 tests)
npm run test:watch     # 변경 감지 모드
npm run test:coverage  # 커버리지 리포트
npx tsc --noEmit       # TypeScript 타입 체크
npm run build          # 프로덕션 빌드
```

---

## How to Run

```bash
cd /Users/whoana/DEV/workspaces/claude-code/portfolio-manager
npm run dev    # 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드
```

---

## Environment

- macOS Darwin 25.3.0 (Apple Silicon)
- Node.js v24.3.0, npm 11.4.2
- Next.js 14.2.30, Vitest 2.1.9
- 프로젝트 경로: `/Users/whoana/DEV/workspaces/claude-code/portfolio-manager/`

---

## Next Steps (잠재적 개선 사항)

- [ ] 자산성장 전망 차트 시각화 (Chart.js 또는 Recharts)
- [ ] GrowthReport 파라미터도 Excel 시트에서 편집 가능하도록 (Excel 수식 연동)
- [ ] 포트폴리오 내보내기/가져오기 (JSON)
- [ ] 포트폴리오 간 비교 기능
- [ ] 토스 테마에서 한국식 상승/하락색 (빨강=상승, 파랑=하락) 옵션
- [ ] PWA 지원 (오프라인 접근, 홈화면 추가)
- [ ] 보유 내역의 배당금 추적 (배당률 연동)
- [ ] 리밸런싱 가이드 (목표비중 vs 실제비중 차이 기반 매수/매도 추천)
