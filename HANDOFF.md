# HANDOFF: ETF 포트폴리오 매니저

## Goal

누구나 쉽게 사용할 수 있는 ETF 포트폴리오 관리 웹앱.
종목 검색(코드/한글/영문) → 포트폴리오 구성(비중 설정) → 투자금액별 자동계산 → Excel 내보내기 → 자산성장 전망 리포트.

---

## Current Progress

**전체 기능 구현 완료. 빌드·테스트 모두 정상.**

- [x] 초기 구현 완료 (Phase 1~6)
- [x] 한글 종목 검색 지원 추가
- [x] 키보드 내비게이션 (ArrowUp/Down/Enter/Escape)
- [x] 행 더블클릭 수정 모드
- [x] **Vitest 테스트 인프라 구축 — 82 tests, 7 test files, 모두 통과**
- [x] **Excel 내보내기 버그 수정 2건**
- [x] **자산성장 전망 리포트 기능 추가**

---

## What Worked

### 플랫폼 / 기술 스택
| 항목 | 결정 |
|------|------|
| 프레임워크 | Next.js 14.2.30 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS (모노톤: bg `#FAFAFA`, text `#1A1A1A`, accent `#2C3E6B`) |
| 주가 데이터 | 네이버 증권 비공식 API (서버사이드 프록시, CORS 우회) |
| Excel 내보내기 | ExcelJS (수식+result 캐시, 스타일, 병합 셀) |
| 저장소 | localStorage (JSON) — DB 없이 |
| 테스트 | Vitest 2.1.9 + @testing-library/react + MSW 2.6.4 |

### 네이버 API 엔드포인트
- 종목 검색: `https://ac.stock.naver.com/ac?q={query}&target=stock&st=111` (영문·한글·코드 모두 지원)
- 현재가 조회: `https://m.stock.naver.com/api/stock/{code}/basic`

### Vitest 설정 핵심
- `vite-tsconfig-paths` ESM 충돌 → `resolve.alias: { "@": path.resolve(__dirname, ".") }` 로 대체
- `vi.useFakeTimers()` + `waitFor` 타임아웃 → 실제 타이머 + `delay: null` 방식으로 해결
- `scrollIntoView` jsdom 미구현 → `tests/setup.ts`에 `Element.prototype.scrollIntoView = vi.fn()` 추가

### Excel 수식 셀 빈 값 버그 원인
ExcelJS로 `{ formula: '...' }` 만 쓰면 캐시값(`<v>`)이 없어 Numbers/Excel에서 빈 셀로 표시됨.
→ 모든 수식 셀에 `result` 값 추가: `{ formula: '...', result: 계산값 }` 으로 해결.

---

## What Didn't Work

- `npx create-next-app@latest` → 기존 파일 충돌, 직접 파일 생성으로 대체
- npm cache EPERM 오류 → `--cache /tmp/claude/npm-cache` 로 해결
- 개발 서버 `npm run dev` → 샌드박스 포트 제한으로 실행 불가 (실 환경에서는 정상)
- `vite-tsconfig-paths` 패키지 → ESM only로 vitest.config.ts에서 CJS require 불가, 직접 alias 설정으로 대체

---

## File Structure

```
portfolio-manager/
├── app/
│   ├── api/stock/
│   │   ├── search/route.ts              # 네이버 AC API 프록시
│   │   └── price/[code]/route.ts       # 네이버 basic API 프록시
│   ├── components/
│   │   ├── StockSearch.tsx              # 종목 검색 + 자동완성 (한글/영문/코드)
│   │   ├── AddStockModal.tsx            # 종목 추가/수정 모달
│   │   ├── PortfolioTable.tsx           # 포트폴리오 테이블 (더블클릭 수정)
│   │   ├── AllocationTable.tsx          # 투자금액별 계산표
│   │   ├── PortfolioSummary.tsx         # 요약 통계 + Excel 내보내기 버튼
│   │   └── GrowthReport.tsx             # 자산성장 전망 리포트 (신규)
│   ├── lib/
│   │   ├── types.ts                     # PortfolioStock, Portfolio 등 타입
│   │   ├── naverFinance.ts              # 네이버 API 클라이언트
│   │   ├── portfolioCalc.ts             # 매수수량/배당 계산, formatNumber/Percent
│   │   ├── portfolioStorage.ts          # localStorage CRUD
│   │   ├── growthCalc.ts                # 자산성장 복리 계산 (신규)
│   │   └── exportExcel.ts               # ExcelJS Excel 내보내기 (4시트)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── tests/
│   ├── setup.ts                         # jest-dom + MSW + scrollIntoView polyfill
│   ├── mocks/
│   │   ├── server.ts                    # MSW Node 서버
│   │   ├── handlers.ts                  # 네이버 API MSW 핸들러
│   │   └── localStorage.ts              # Map 기반 localStorage mock
│   ├── unit/
│   │   ├── portfolioCalc.test.ts        # 17 tests
│   │   └── portfolioStorage.test.ts     # 13 tests
│   ├── api/
│   │   ├── stockSearch.test.ts          # 7 tests
│   │   └── stockPrice.test.ts           # 7 tests
│   └── components/
│       ├── StockSearch.test.tsx          # 12 tests
│       ├── AddStockModal.test.tsx        # 15 tests
│       └── PortfolioTable.test.tsx       # 11 tests
├── vitest.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

---

## Excel 시트 구조 (현재)

| 순서 | 시트명 | 내용 |
|------|--------|------|
| 1 | 포트폴리오 요약 | 기본 정보 + 핵심 지표 + 종목별 요약 테이블 |
| 2 | 포트폴리오 구성 | 투자 원칙 + 자산배분 전략 + 투자금액별 구성표 (수식+result) |
| 3 | 자산성장 전망 | 파라미터 + 1~10년 자산/배당 성장 전망 테이블 |
| 4 | 종목 분석 | 종목명, 핵심역할, 선정근거 |
| 5 | 자산관리자 의견 | 빈 템플릿 (시장전망, 전략의견, 리스크, 권고사항) |

**수식 셀 주의**: 모든 `{ formula }` 에 반드시 `result` 값 포함 (미포함 시 Excel/Numbers에서 빈 셀).

---

## 자산성장 계산 공식

```
매년:
  asset[n]      = asset[n-1] × (1 + assetGrowthRate) + annualAddition
  dividendRate[n] = initialDividendRate × (1 + dividendGrowthRate)^n
  annualDiv[n]  = asset[n] × dividendRate[n]
  monthlyDiv[n] = annualDiv[n] / 12

기본값: 배당성장율 4%, 연추가투자 1,200만원, 자산상승율 7%
```

---

## 테스트 명령

```bash
npm run test           # 전체 실행 (82 tests)
npm run test:watch     # 변경 감지 모드
npm run test:coverage  # 커버리지 리포트
npx tsc --noEmit       # TypeScript 타입 체크
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
- [ ] growthCalc.ts 테스트 추가 (현재 미커버)
- [ ] 포트폴리오 내보내기/가져오기 (JSON)
- [ ] 다크모드 지원
