# 데이터 내보내기/들여오기 설계서

## 1. 개요

localStorage에 저장된 모든 포트폴리오 데이터를 JSON 파일로 내보내고, 다른 브라우저 환경에서 들여올 수 있는 기능.

### 사용 시나리오
- PC 브라우저 → 모바일 브라우저 이동
- Chrome → Safari 이동
- 데이터 백업/복원
- 다른 사람에게 포트폴리오 공유

---

## 2. 내보내기 파일 형식

### JSON 구조

```json
{
  "appName": "etf-portfolio-manager",
  "version": 1,
  "exportedAt": "2026-02-26T12:00:00.000Z",
  "data": {
    "portfolios": [...],      // etf_portfolios (Portfolio[])
    "holdings": [...],        // etf_holdings (PortfolioHoldings[])
    "settings": {
      "theme": "toss",        // etf_theme
      "helpEnabled": true     // etf_help_enabled
    }
  }
}
```

### 파일명 규칙
`portfolio-backup-2026-02-26.json`

---

## 3. localStorage 키 매핑

| localStorage 키 | JSON 경로 | 타입 | 필수 |
|---|---|---|---|
| `etf_portfolios` | `data.portfolios` | `Portfolio[]` | O |
| `etf_holdings` | `data.holdings` | `PortfolioHoldings[]` | O |
| `etf_theme` | `data.settings.theme` | `ThemeName` | X |
| `etf_help_enabled` | `data.settings.helpEnabled` | `boolean` | X |

---

## 4. 들여오기 전략

### 4-1. 충돌 처리

들여오기 시 기존 데이터가 있으면 사용자에게 선택지 제공:

| 옵션 | 동작 | 설명 |
|---|---|---|
| **덮어쓰기** | 기존 데이터 전체 삭제 후 교체 | 새 환경으로 완전 이동할 때 |
| **병합** | 동일 ID는 스킵, 새 항목만 추가 | 기존 데이터 유지하면서 추가할 때 |
| **취소** | 아무것도 하지 않음 | - |

### 4-2. 검증 규칙

파일 읽기 후 아래 항목 검증:

1. `appName === "etf-portfolio-manager"` 확인
2. `version` 필드 존재 (향후 마이그레이션 대비)
3. `data.portfolios`가 배열인지 확인
4. `data.holdings`가 배열인지 확인
5. 각 Portfolio의 필수 필드 존재 여부 (`id`, `name`, `stocks`)
6. 각 HoldingItem의 필수 필드 존재 여부 (`id`, `code`, `quantity`, `avgPrice`)

검증 실패 시 상세 에러 메시지 표시.

---

## 5. 파일 변경 계획

### 5-1. 신규 파일

| 파일 | 역할 |
|---|---|
| `app/lib/dataExportImport.ts` | 내보내기/들여오기 비즈니스 로직 |

**함수 목록:**

```typescript
// 내보내기: localStorage → JSON blob 다운로드
exportAllData(): void

// 들여오기: File → 검증 → 파싱 결과 반환
parseImportFile(file: File): Promise<ImportParseResult>

// 적용: 파싱된 데이터를 localStorage에 저장
applyImportData(data: ExportData, mode: "replace" | "merge"): ImportApplyResult
```

**타입 정의:**

```typescript
interface ExportFileFormat {
  appName: "etf-portfolio-manager";
  version: number;
  exportedAt: string;
  data: ExportData;
}

interface ExportData {
  portfolios: Portfolio[];
  holdings: PortfolioHoldings[];
  settings: {
    theme: ThemeName;
    helpEnabled: boolean;
  };
}

interface ImportParseResult {
  success: boolean;
  data?: ExportData;
  error?: string;
  stats?: {
    portfolioCount: number;
    holdingCount: number;
    totalStockCount: number;
  };
}

interface ImportApplyResult {
  portfoliosAdded: number;
  holdingsAdded: number;
  skipped: number;  // 병합 모드에서 중복 스킵된 수
}
```

### 5-2. 신규 컴포넌트

| 파일 | 역할 |
|---|---|
| `app/components/DataTransferModal.tsx` | 내보내기/들여오기 UI 모달 |

**UI 구성:**

```
┌─────────────────────────────┐
│  데이터 관리            ✕   │
│─────────────────────────────│
│                             │
│  [내보내기]                 │
│  포트폴리오, 보유 내역,     │
│  설정을 JSON 파일로 저장    │
│                             │
│  ─────── 구분선 ────────    │
│                             │
│  [파일 선택] 또는 드래그    │
│                             │
│  (파일 선택 후)             │
│  ┌───────────────────────┐  │
│  │ 포트폴리오 3개         │  │
│  │ 보유 종목 12개         │  │
│  │ 테마: Toss            │  │
│  └───────────────────────┘  │
│                             │
│  ○ 덮어쓰기 ○ 병합         │
│                             │
│  [들여오기]                 │
│                             │
└─────────────────────────────┘
```

### 5-3. 기존 파일 수정

| 파일 | 변경 |
|---|---|
| `app/components/SettingsBar.tsx` | 데이터 관리 버튼 추가 |
| `app/page.tsx` | DataTransferModal import 및 상태 관리 |

---

## 6. UX 흐름

### 6-1. 내보내기

```
설정 패널 → "데이터 관리" 클릭
  → 모달 열림
  → "내보내기" 클릭
  → JSON 파일 다운로드 (portfolio-backup-YYYY-MM-DD.json)
  → 완료 토스트 메시지
```

### 6-2. 들여오기

```
설정 패널 → "데이터 관리" 클릭
  → 모달 열림
  → 파일 선택 (또는 드래그앤드롭)
  → 파일 검증
    → 실패: 에러 메시지 표시
    → 성공: 미리보기 표시 (포트폴리오 N개, 종목 N개)
  → 모드 선택 (덮어쓰기/병합)
  → "들여오기" 클릭
  → 확인 다이얼로그 (덮어쓰기 시 "기존 데이터가 삭제됩니다")
  → localStorage 저장
  → 페이지 새로고침 (상태 동기화)
```

---

## 7. 작업량 추정

| 항목 | 난이도 | 비고 |
|---|---|---|
| `dataExportImport.ts` | 중 | 검증 로직이 핵심 |
| `DataTransferModal.tsx` | 중 | 파일 드래그앤드롭 + 미리보기 |
| SettingsBar 수정 | 소 | 버튼 1개 추가 |
| page.tsx 수정 | 소 | 모달 상태 추가 |
| 테스트 | 중 | 내보내기/들여오기/검증 단위 테스트 |

**총 변경 파일: 4개** (신규 2 + 수정 2)
**예상 테스트 케이스: 10~15개**

---

## 8. 보안 고려사항

- 내보내기 파일에 민감 정보 없음 (종목코드, 수량, 가격만 포함)
- 들여오기 시 JSON.parse 전 파일 크기 제한 (5MB)
- XSS 방지: 파일 내용을 DOM에 직접 삽입하지 않음
- 검증 실패 시 localStorage 변경 없음 (원자적 적용)

---

## 9. 향후 확장

- **v2**: QR 코드로 모바일 직접 전송
- **v2**: 클라우드 동기화 (Google Drive, Dropbox)
- **v2**: 자동 백업 (주기적 내보내기)
- 파일 형식 버전 마이그레이션 (`version` 필드 활용)
