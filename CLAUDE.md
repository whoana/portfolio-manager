# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ETF 포트폴리오 관리 웹앱. 종목 검색, 포트폴리오 구성, 배당/수익률 자동 계산, Excel 내보내기, 자산성장 전망 기능을 제공한다. 데이터는 localStorage에 저장하며, 주가 정보는 네이버 금융 비공식 API를 서버 사이드 프록시로 가져온다.

## Commands

```bash
npm run dev             # 개발 서버 (http://localhost:3000)
npm run build           # 프로덕션 빌드
npm run test            # 전체 테스트 실행 (vitest run)
npm run test:watch      # 워치 모드
npm run test:coverage   # 커버리지 리포트
npx vitest run tests/unit/portfolioCalc.test.ts   # 단일 테스트 파일 실행
npx tsc --noEmit        # 타입 체크
```

## Architecture

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + ExcelJS

### 핵심 계층

- **`app/page.tsx`** — 메인 페이지. 포트폴리오 상태 관리의 중심. 모든 주요 컴포넌트를 조합하고 포트폴리오 CRUD, 탭 전환, 기본 데모 데이터(DEFAULT_STOCKS)를 관리한다.
- **`app/lib/`** — 비즈니스 로직 계층. UI와 완전히 분리되어 있어 단위 테스트가 용이하다.
  - `portfolioCalc.ts` — 투자 배분 계산 (목표 비중 × 총액 → 주수, 배당금)
  - `growthCalc.ts` — 자산성장 전망 (연간 자산증가율, 배당성장률, 추가납입 반영한 10년 시뮬레이션)
  - `portfolioStorage.ts` / `settingsStorage.ts` — localStorage 기반 영속화 (`etf_portfolios`, `etf_theme`, `etf_help_enabled` 키 사용)
  - `types.ts` — `Portfolio`, `PortfolioStock` 등 핵심 인터페이스 정의
  - `exportExcel.ts` — ExcelJS로 5개 시트 워크북 생성 (수식 셀에 반드시 `result` 값 포함 — Numbers/Excel 호환 이슈)
- **`app/api/stock/`** — 네이버 금융 API 프록시 (CORS 우회)
  - `search/route.ts` — `GET /api/stock/search?q={query}` → 네이버 자동완성 API
  - `price/[code]/route.ts` — `GET /api/stock/price/{code}` → 네이버 시세 API

### 컴포넌트 구성

`page.tsx` → `PortfolioTable` (종목 구성) + `AllocationTable` (투자 배분) + `PortfolioSummary` (요약 + Excel 내보내기) + `GrowthReport` (자산성장 전망)

종목 추가/수정은 `AddStockModal` → `StockSearch` (자동완성) 조합으로 처리한다.

`ClientProviders`가 `ThemeProvider` + `HelpProvider` 컨텍스트를 감싼다.

### 테마 시스템

Tailwind CSS 커스텀 컬러가 CSS 변수(`--color-primary` 등)를 참조한다. `globals.css`에 claude/dark/classic 3개 테마 변수셋이 정의되어 있으며, `ThemeProvider`가 `<html>` 클래스를 전환한다.

## Testing

Vitest + React Testing Library + MSW 구성. `tests/setup.ts`에서 MSW 서버를 초기화하고 `tests/mocks/handlers.ts`에 네이버 API 목 핸들러가 정의되어 있다. 테스트는 `tests/unit/`, `tests/api/`, `tests/components/` 디렉토리로 구분된다.

커버리지 대상: `app/lib/**`, `app/api/**`, `app/components/**` (exportExcel.ts 제외)

## Path Alias

`@/*`는 프로젝트 루트를 가리킨다. `tsconfig.json`과 `vitest.config.ts` 양쪽에 설정되어 있다.

## Key Conventions

- 한국어 UI. 컴포넌트 내 텍스트, 주석, Excel 시트명 모두 한국어.
- 금액 단위는 KRW(원). `toLocaleString()`으로 천 단위 구분.
- 비중(targetWeight)과 배당률(dividendRate)은 0~1 소수로 저장, UI에서 %로 표시.
- ExcelJS 수식 셀에는 반드시 `result` 속성을 함께 넣어야 한다 (Excel/Numbers 빈 셀 버그 방지).
