# iOS 버전 개발을 위한 고려사항 정리

## Context

현재 ETF 포트폴리오 매니저는 Next.js 14 웹앱으로 운영 중이며, 최근 Toss 스타일 모바일 UI 리디자인까지 완료된 상태. `feature/for-ios` 브랜치에서 작업 중이나 아직 실제 iOS 관련 코드는 없음. 이 문서는 iOS 네이티브 앱 전환 시 고려해야 할 핵심 사항을 정리한다.

---

## 1. 접근 방식 비교

| 접근법 | 코드 재사용 | 네이티브 경험 | 개발 기간 | App Store 승인 | 추천도 |
|--------|-----------|-------------|----------|--------------|-------|
| **Expo (React Native)** | ~40% (TS 로직 전부) | 중상 | 4-5주 | 양호 | **추천** |
| **SwiftUI 네이티브** | 0% (알고리즘만 개념적) | 최상 | 6-8주 | 최상 | 차선 |
| **Capacitor (웹 래퍼)** | ~95% | 하 | 1주 | 리스크 | 비추천 |
| **PWA** | ~99% | 하 | 2-3일 | 불필요 | 비추천 |
| **React Native (bare)** | ~40% | 중상 | 5-6주 | 양호 | 보통 |

### 추천: Expo (Managed React Native)

**이유:**
1. `app/lib/` 13개 파일의 TypeScript 비즈니스 로직을 **그대로 복사** 가능
2. OTA 업데이트로 네이버 API 변경 시 **App Store 심사 없이 즉시 수정** 가능
3. React 패러다임 유지로 학습 곡선 최소화
4. `expo-sqlite`, `expo-secure-store`, `expo-sharing` 등 풍부한 네이티브 모듈

### 차선: SwiftUI 네이티브

**언제 선택하나:**
- 최상의 iOS 경험이 필수적인 경우
- Swift 개발 역량이 충분한 경우
- iOS 전용 기능(위젯, Dynamic Island 등) 적극 활용 시

---

## 2. 코드 재사용성 분석

### 100% 재사용 가능 (복사만 하면 됨)

| 파일 | 내용 | 비고 |
|------|------|------|
| `app/lib/types.ts` (54줄) | 핵심 인터페이스 정의 | Swift: `Codable` struct로 변환 |
| `app/lib/portfolioCalc.ts` (93줄) | 투자 배분 계산 | 순수 함수, 의존성 없음 |
| `app/lib/growthCalc.ts` (55줄) | 10년 성장 시뮬레이션 | 순수 함수, 의존성 없음 |
| `app/lib/holdingsCalc.ts` (123줄) | 보유 종목 평가/손익 | 순수 함수, 의존성 없음 |
| `app/lib/constants.ts` (16줄) | 카테고리 정의, 색상 | 그대로 사용 |

### 부분 재사용 가능 (내부 구현만 교체)

| 파일 | 재사용률 | 변경 내용 |
|------|---------|----------|
| `app/lib/portfolioStorage.ts` | 30% | localStorage → SQLite (함수 시그니처 유지) |
| `app/lib/holdingsStorage.ts` | 30% | 동일 |
| `app/lib/settingsStorage.ts` | 30% | localStorage → SecureStore |
| `app/lib/csvUtils.ts` | 95% | `downloadCsv()` → expo-sharing |
| `app/lib/dataExportImport.ts` | 70% | 파싱/검증 로직 재사용, 저장 부분 교체 |

### 재작성 필요

| 파일 | 이유 |
|------|------|
| `app/lib/exportExcel.ts` (833줄) | ExcelJS → xlsx(SheetJS) + expo-file-system |
| `app/lib/naverFinance.ts` | fetch → 직접 네이버 API 호출 (CORS 불필요) |
| UI 컴포넌트 21개 (~4,000줄) | Tailwind CSS → React Native StyleSheet |
| API routes 2개 | 프록시 불필요 → 앱 내 직접 호출 |

---

## 3. 핵심 아키텍처 결정 사항

### 3.1 데이터 저장소

| 현재 (Web) | iOS 전환 | 이유 |
|-----------|---------|------|
| localStorage (4개 키) | **expo-sqlite** | 용량 제한 없음, iOS가 삭제하지 않음 |
| JSON 직렬화 | **SQLite 테이블** | 쿼리/정렬/필터 가능 |
| 테마 설정 (문자열) | **expo-secure-store** | 안전한 설정 저장 |

현재 스토리지 함수 시그니처(`getPortfolios()`, `savePortfolio()` 등)를 유지하면서 내부만 교체하는 어댑터 패턴 적용.

### 3.2 네이버 API 통신

**현재:** 브라우저 → Next.js API Route (프록시) → 네이버
**iOS:** 앱 → 네이버 직접 호출 (CORS 제약 없음)

- `app/api/stock/price/[code]/route.ts`에 있는 URL 패턴, 해외주식 감지 로직, 환율 변환 로직을 `naverApi.ts` 서비스로 통합
- **폴백 전략:** 네이버가 모바일 User-Agent 차단 시 기존 Next.js 프록시 서버를 폴백으로 사용
- 마지막 조회 시세를 SQLite에 캐싱하여 오프라인 시 표시

### 3.3 내비게이션

현재 5탭 하단 내비(`MOBILE_TABS`: 종목/배분/요약/성장/보유)를 그대로 `@react-navigation/bottom-tabs`로 구현. 각 탭은 스택 네비게이터로 모달/상세를 관리.

### 3.4 테마

CSS 변수 시스템 대신 React Context + `useColorScheme()` 기반:
- Light 모드 (Toss 테마 색상 기반)
- Dark 모드 (현재 Dark 테마 색상 기반)
- 시스템 설정 따르기

`globals.css`의 색상 토큰을 TypeScript 테마 객체로 변환.

### 3.5 차트

현재 커스텀 SVG 컴포넌트(PieChart, BarChart) → `victory-native` 또는 `react-native-svg` 기반으로 재구현.

### 3.6 Excel 내보내기

ExcelJS → `xlsx`(SheetJS) 라이브러리 + `expo-file-system`으로 파일 생성 + `expo-sharing`으로 공유 시트.
CSV 내보내기도 동일하게 파일 시스템 + 공유 시트 패턴.

---

## 4. 핵심 리스크 및 대응

### HIGH: 네이버 API 차단/변경
- 비공식 API라 예고 없이 변경 가능
- **대응:** Expo OTA 업데이트로 심사 없이 즉시 수정 / 프록시 서버 폴백 / 원격 설정으로 URL 교체 가능

### HIGH: App Store 심사 거절
- "금융 조언"으로 분류될 리스크, 비공식 API 사용 관련
- **대응:** 면책 조항 화면 추가 / "시세 표시용"으로 명시 / 개인정보 처리방침 필수

### MEDIUM: 웹 → iOS 데이터 이전
- 기존 웹 사용자의 localStorage 데이터를 iOS로 옮겨야 함
- **대응:** `dataExportImport.ts`의 JSON 백업/복원 기능 활용 (이미 구현됨). 웹에서 JSON 내보내기 → iOS에서 가져오기

### MEDIUM: 한국 숫자 포맷 호환성
- `toLocaleString("ko-KR")` — Hermes 엔진에서 동일 동작 확인 필요
- **대응:** 동작 확인 후 필요 시 직접 포맷터 구현

### LOW: 오프라인 사용
- 네이버 API 없이는 시세 갱신 불가
- **대응:** 마지막 조회 시세 캐싱, 오프라인 안내 배너 표시

---

## 5. 단계별 구현 계획

```
Phase 0: 프로젝트 셋업 (1-2일)
├── Expo TypeScript 프로젝트 초기화
├── 경로 별칭(@/*) 설정
├── app/lib/*.ts 13개 파일 복사
└── 순수 함수 테스트 포팅 (Vitest → Jest)

Phase 1: 데이터 레이어 (2-3일)
├── SQLite 스키마 설계 (portfolios, holdings, settings)
├── 스토리지 함수 재구현 (같은 시그니처)
└── JSON 가져오기/내보내기 구현

Phase 2: API 레이어 (2-3일)
├── naverApi.ts (검색 + 시세 + 환율 통합)
├── 응답 캐싱 (SQLite)
└── 프록시 폴백 로직

Phase 3: 네비게이션 + 테마 (2-3일)
├── 5탭 하단 내비게이션
├── 라이트/다크/시스템 테마
└── 공통 컴포넌트 (Card, ListRow, Button)

Phase 4: 종목 탭 (3-4일)
├── 포트폴리오 리스트 + CRUD
├── 종목 검색 자동완성
└── 시세 갱신

Phase 5: 배분 + 요약 탭 (2-3일)
├── 투자 배분 계산 화면
├── 요약 대시보드 + 파이차트
└── 히어로 자산 카드

Phase 6: 성장 + 보유 탭 (3-4일)
├── 10년 성장 전망
├── 보유 종목 관리 + 손익
└── CSV 가져오기

Phase 7: 내보내기 + 마무리 (2-3일)
├── Excel/CSV 내보내기 (공유 시트)
├── 데이터 백업/복원
└── 웹 데이터 이전 지원

Phase 8: 출시 준비 (3-5일)
├── 앱 아이콘, 스플래시 스크린
├── 개인정보 처리방침
├── TestFlight 배포
└── App Store 심사 대응
```

**총 예상 기간: 4-5주** (1인 개발 기준)

---

## 6. iOS 전용으로 추가 고려할 기능

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| **Face ID/Touch ID** | 앱 잠금 (금융 데이터 보호) | 높음 |
| **위젯** | 홈 화면 자산 요약 위젯 | 중간 |
| **푸시 알림** | 시세 급변동 알림 (향후) | 낮음 |
| **iCloud 동기화** | 기기간 데이터 동기화 | 중간 |
| **다크모드 자동** | iOS 시스템 설정 연동 | 높음 |
| **햅틱 피드백** | 탭, 새로고침 등 촉각 반응 | 중간 |
| **Pull-to-Refresh** | 시세 새로고침 | 높음 |
| **공유 시트** | 포트폴리오를 다른 앱으로 공유 | 중간 |

---

## 7. 결론: 핵심 의사결정 포인트

1. **프레임워크 선택:** Expo(추천) vs SwiftUI(차선) — 팀 역량과 목표에 따라 결정
2. **API 전략:** 직접 호출 + 프록시 폴백 조합
3. **데이터 이전:** 기존 웹 JSON 내보내기/가져오기 활용
4. **UI 전략:** Toss 스타일 모바일 디자인 설계서(`docs/mobile-toss-redesign.md`) 참고하여 네이티브 구현
5. **출시 전략:** TestFlight 베타 → App Store 정식 출시
