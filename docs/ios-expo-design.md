# ETF 포트폴리오 매니저 — Expo (React Native) 설계서

> 작성일: 2026-03-14
> 상태: 초안
> 기반 문서: `docs/ios-considerations.md`, `docs/mobile-toss-redesign.md`

---

## 1. 개요

기존 Next.js 14 웹앱의 TypeScript 비즈니스 로직을 최대한 재사용하여 Expo (Managed React Native)로 iOS 앱을 구축한다. `app/lib/` 13개 파일 중 5개는 100% 복사, 3개는 어댑터 교체, 나머지는 재작성한다. OTA 업데이트로 네이버 API 변경 시 App Store 심사 없이 즉시 대응할 수 있다.

---

## 2. 코드 재사용 전략

### 2.1 파일별 재사용 분류

#### 100% 복사 (수정 불필요)

| 파일 | 줄 수 | 내용 |
|------|------|------|
| `app/lib/types.ts` | 54 | 핵심 인터페이스 6개 |
| `app/lib/portfolioCalc.ts` | 93 | 투자 배분 계산 (순수 함수) |
| `app/lib/growthCalc.ts` | 55 | 10년 성장 시뮬레이션 (순수 함수) |
| `app/lib/holdingsCalc.ts` | 123 | 보유 종목 평가/손익 (순수 함수) |
| `app/lib/constants.ts` | 16 | 카테고리 옵션, 색상 상수 |

이 파일들은 브라우저/Node.js API에 대한 의존성이 전혀 없는 순수 함수이므로 그대로 복사한다.

#### 어댑터 교체 (함수 시그니처 유지, 내부 구현만 변경)

| 파일 | 줄 수 | 변경 내용 |
|------|------|----------|
| `app/lib/portfolioStorage.ts` | 72 | `localStorage` → `expo-sqlite` |
| `app/lib/holdingsStorage.ts` | 70 | `localStorage` → `expo-sqlite` |
| `app/lib/settingsStorage.ts` | 34 | `localStorage` → `expo-secure-store` |

#### 재작성 필요

| 파일 | 줄 수 | 이유 | 대체 |
|------|------|------|------|
| `app/lib/naverFinance.ts` | 31 | 프록시 경유 → 직접 호출 | `naverApi.ts` |
| `app/lib/exportExcel.ts` | 833 | ExcelJS → SheetJS | `exportExcel.native.ts` |
| `app/api/stock/price/[code]/route.ts` | 183 | API Route 불필요 | `naverApi.ts`에 통합 |
| `app/api/stock/search/route.ts` | 69 | 동일 | `naverApi.ts`에 통합 |
| UI 컴포넌트 21개 | ~4,000 | Tailwind → StyleSheet | React Native 컴포넌트 |

### 2.2 복사 대상 파일 (그대로 사용)

```
src/lib/
├── types.ts              ← app/lib/types.ts (54줄, 복사)
├── portfolioCalc.ts      ← app/lib/portfolioCalc.ts (93줄, 복사)
├── growthCalc.ts         ← app/lib/growthCalc.ts (55줄, 복사)
├── holdingsCalc.ts       ← app/lib/holdingsCalc.ts (123줄, 복사)
└── constants.ts          ← app/lib/constants.ts (16줄, 복사)
```

> `toLocaleString("ko-KR")`이 Hermes 엔진에서 동일하게 동작하는지 확인 필요. 문제 시 직접 포맷터 구현.

---

## 3. 데이터 모델

`types.ts`를 그대로 사용한다. 추가 타입만 정의:

```typescript
// src/lib/types.ts — 기존 그대로 복사
// 아래는 추가 타입 (src/lib/types.native.ts)

export interface CachedPrice {
  code: string;
  name: string;
  price: number;
  fetchedAt: string;       // ISO date
}

export interface AppSettings {
  theme: "toss" | "dark";
  followSystem: boolean;
  biometricEnabled: boolean;
  proxyFallbackEnabled: boolean;
}
```

---

## 4. 저장소 레이어

### 4.1 SQLite (expo-sqlite)

기존 `portfolioStorage.ts`와 `holdingsStorage.ts`의 함수 시그니처를 유지하면서 내부만 교체:

```typescript
// src/lib/portfolioStorage.ts (어댑터 교체)
import * as SQLite from "expo-sqlite";
import { Portfolio } from "./types";

const db = SQLite.openDatabaseSync("portfolio.db");

// 앱 초기화 시 테이블 생성
export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stocks TEXT NOT NULL,           -- JSON 직렬화
      investmentAmount INTEGER NOT NULL DEFAULT 100000000,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS holdings (
      portfolioId TEXT PRIMARY KEY,
      items TEXT NOT NULL,             -- JSON 직렬화
      updatedAt TEXT NOT NULL
    )
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cached_prices (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      fetchedAt TEXT NOT NULL
    )
  `);
}

// 기존과 동일한 함수 시그니처 유지
export function getPortfolios(): Portfolio[] {
  const rows = db.getAllSync<{
    id: string; name: string; stocks: string;
    investmentAmount: number; createdAt: string; updatedAt: string;
  }>("SELECT * FROM portfolios ORDER BY updatedAt DESC");

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    stocks: JSON.parse(row.stocks),
    investmentAmount: row.investmentAmount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function getPortfolio(id: string): Portfolio | null {
  const row = db.getFirstSync<{
    id: string; name: string; stocks: string;
    investmentAmount: number; createdAt: string; updatedAt: string;
  }>("SELECT * FROM portfolios WHERE id = ?", [id]);

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    stocks: JSON.parse(row.stocks),
    investmentAmount: row.investmentAmount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function savePortfolio(portfolio: Portfolio): void {
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO portfolios (id, name, stocks, investmentAmount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [portfolio.id, portfolio.name, JSON.stringify(portfolio.stocks),
     portfolio.investmentAmount, portfolio.createdAt, now]
  );
}

export function deletePortfolio(id: string): void {
  db.runSync("DELETE FROM portfolios WHERE id = ?", [id]);
}

export function createPortfolio(name: string): Portfolio {
  const now = new Date().toISOString();
  return {
    id: `portfolio_${Date.now()}`,
    name,
    stocks: [],
    investmentAmount: 100_000_000,
    createdAt: now,
    updatedAt: now,
  };
}
```

### 4.2 SecureStore (expo-secure-store)

```typescript
// src/lib/settingsStorage.ts (어댑터 교체)
import * as SecureStore from "expo-secure-store";

export type ThemeName = "toss" | "dark";

const THEME_KEY = "etf_theme";
const HELP_KEY = "etf_help_enabled";
const BIOMETRIC_KEY = "etf_biometric";

export function getSavedTheme(): ThemeName {
  const v = SecureStore.getItem(THEME_KEY);
  if (v === "toss" || v === "dark") return v;
  return "toss";
}

export function saveTheme(theme: ThemeName): void {
  SecureStore.setItem(THEME_KEY, theme);
}

export function getHelpEnabled(): boolean {
  const v = SecureStore.getItem(HELP_KEY);
  return v !== "false";
}

export function saveHelpEnabled(enabled: boolean): void {
  SecureStore.setItem(HELP_KEY, String(enabled));
}

export function getBiometricEnabled(): boolean {
  return SecureStore.getItem(BIOMETRIC_KEY) === "true";
}

export function saveBiometricEnabled(enabled: boolean): void {
  SecureStore.setItem(BIOMETRIC_KEY, String(enabled));
}
```

### 4.3 웹 데이터 이전

기존 `dataExportImport.ts`의 JSON 형식과 호환. 웹에서 JSON 내보내기 → iOS에서 가져오기:

```typescript
// src/lib/dataImport.ts
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { savePortfolio } from "./portfolioStorage";
import { Portfolio } from "./types";

export async function importFromJSON(): Promise<number> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return 0;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const data = JSON.parse(content) as {
    portfolios: Portfolio[];
    holdings?: unknown[];
  };

  for (const p of data.portfolios) {
    savePortfolio(p);
  }
  return data.portfolios.length;
}
```

---

## 5. 네이버 API 서비스

앱에서 직접 호출한다 (CORS 제약 없음). `app/api/stock/price/[code]/route.ts`와 `search/route.ts`의 로직을 `naverApi.ts`로 통합한다.

### 5.1 naverApi.ts

```typescript
// src/services/naverApi.ts
import { StockSearchResult } from "../lib/types";

const NAVER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  Referer: "https://m.stock.naver.com",
};

// 프록시 폴백 URL (기존 Next.js 앱)
const PROXY_BASE_URL = "https://your-nextjs-app.vercel.app";

// ── 해외 주식 감지 (route.ts:29-33) ──

export function isOverseasCode(code: string): boolean {
  if (code.includes(".")) return true;
  if (/^[A-Za-z]+$/.test(code)) return true;
  return false;
}

// ── 국가별 환율/통화 매핑 (route.ts:37-48) ──

const NATION_TO_FX: Record<string, string> = {
  USA: "FX_USDKRW", JPN: "FX_JPYKRW", HKG: "FX_HKDKRW",
  GBR: "FX_GBPKRW", CHN: "FX_CNYKRW", EUR: "FX_EURKRW",
};

const NATION_TO_CURRENCY: Record<string, string> = {
  USA: "USD", JPN: "JPY", HKG: "HKD", GBR: "GBP", CHN: "CNY", EUR: "EUR",
};

// ── 거래소 접미사 (route.ts:66) ──

const EXCHANGE_SUFFIXES = [".O", ".N", ".A", ".K"];

// ── 종목 검색 (search/route.ts 로직 이식) ──

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) return [];

  const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock&st=111`;

  try {
    const response = await fetch(url, { headers: NAVER_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as {
      items?: Array<{ name?: string; code?: string; reutersCode?: string }>;
    };

    return (data.items ?? [])
      .filter((item) => item.code && item.name)
      .map((item) => {
        const rc = item.reutersCode && item.reutersCode !== item.code
          ? item.reutersCode : undefined;
        return { name: item.name!, code: item.code!, ...(rc && { reutersCode: rc }) };
      });
  } catch {
    // 폴백: 프록시 경유
    return searchStocksViaProxy(query);
  }
}

async function searchStocksViaProxy(query: string): Promise<StockSearchResult[]> {
  const response = await fetch(
    `${PROXY_BASE_URL}/api/stock/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("검색 실패");
  const data = await response.json() as { items: StockSearchResult[] };
  return data.items;
}

// ── 시세 조회 (price/[code]/route.ts 로직 이식) ──

export interface StockPriceResult {
  code: string;
  name: string;
  price: number;
  dividendYield?: number;
  priceOriginal?: number;
  currency?: string;
  exchangeRate?: number;
}

export async function getStockPrice(code: string): Promise<StockPriceResult> {
  try {
    if (isOverseasCode(code)) {
      return await fetchOverseasPrice(code);
    } else {
      return await fetchDomesticPrice(code);
    }
  } catch {
    // 폴백: 프록시 경유
    return getStockPriceViaProxy(code);
  }
}

// ── 국내 시세 (route.ts:139-174) ──

async function fetchDomesticPrice(code: string): Promise<StockPriceResult> {
  const [basicRes, integrationRes] = await Promise.all([
    fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
      headers: NAVER_HEADERS,
    }),
    fetch(`https://m.stock.naver.com/api/stock/${code}/integration`, {
      headers: NAVER_HEADERS,
    }),
  ]);

  if (!basicRes.ok) throw new Error(`HTTP ${basicRes.status}`);

  const basicData = await basicRes.json() as {
    stockName?: string;
    closePrice?: string;
  };
  const price = parseInt(basicData.closePrice?.replace(/,/g, "") || "0", 10);

  let dividendYield: number | undefined;
  if (integrationRes.ok) {
    const intData = await integrationRes.json() as {
      etfKeyIndicator?: { dividendYieldTtm?: number };
    };
    if (intData.etfKeyIndicator?.dividendYieldTtm != null) {
      dividendYield = intData.etfKeyIndicator.dividendYieldTtm;
    }
  }

  return {
    code,
    name: basicData.stockName || code,
    price,
    ...(dividendYield != null && { dividendYield }),
  };
}

// ── 해외 시세 (route.ts:68-136) ──

async function fetchOverseasPrice(code: string): Promise<StockPriceResult> {
  const basicData = await fetchOverseasBasic(code);

  const priceOriginal = parseFloat(
    basicData.closePrice?.replace(/,/g, "") || "0"
  );
  const nationCode = basicData.stockExchangeType?.nationCode || "USA";
  const exchangeRate = await fetchExchangeRate(nationCode);
  const price = Math.round(priceOriginal * exchangeRate);
  const currency = NATION_TO_CURRENCY[nationCode] || "USD";

  return {
    code,
    name: basicData.stockName || code,
    price,
    priceOriginal,
    currency,
    exchangeRate,
  };
}

interface NaverStockBasic {
  stockName?: string;
  closePrice?: string;
  stockExchangeType?: { nationCode?: string };
}

// 접미사 순차 시도 (route.ts:68-93)
async function fetchOverseasBasic(code: string): Promise<NaverStockBasic> {
  const baseUrl = "https://api.stock.naver.com/stock";

  if (code.includes(".")) {
    const res = await fetch(`${baseUrl}/${code}/basic`, { headers: NAVER_HEADERS });
    if (res.ok) return res.json() as Promise<NaverStockBasic>;
    throw new Error(`HTTP ${res.status}`);
  }

  // 원본 코드 먼저 시도
  const directRes = await fetch(`${baseUrl}/${code}/basic`, { headers: NAVER_HEADERS });
  if (directRes.ok) return directRes.json() as Promise<NaverStockBasic>;

  // 접미사 순차 시도
  for (const suffix of EXCHANGE_SUFFIXES) {
    const res = await fetch(`${baseUrl}/${code}${suffix}/basic`, {
      headers: NAVER_HEADERS,
    });
    if (res.ok) return res.json() as Promise<NaverStockBasic>;
  }

  throw new Error(`종목을 찾을 수 없습니다: ${code}`);
}

// ── 환율 조회 (route.ts:51-63) ──

async function fetchExchangeRate(nationCode: string): Promise<number> {
  const fxCode = NATION_TO_FX[nationCode];
  if (!fxCode) return 1;
  try {
    const res = await fetch(
      `https://api.stock.naver.com/marketindex/exchange/${fxCode}`,
      { headers: NAVER_HEADERS }
    );
    if (!res.ok) return 1;
    const data = await res.json() as {
      exchangeInfo?: { calcPrice?: string };
    };
    return parseFloat(data.exchangeInfo?.calcPrice || "1");
  } catch {
    return 1;
  }
}

// ── 프록시 폴백 ──

async function getStockPriceViaProxy(code: string): Promise<StockPriceResult> {
  const response = await fetch(`${PROXY_BASE_URL}/api/stock/price/${code}`);
  if (!response.ok) throw new Error("시세 조회 실패");
  return response.json() as Promise<StockPriceResult>;
}
```

### 5.2 시세 캐싱

```typescript
// src/services/priceCache.ts
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("portfolio.db");

export function cachePrice(code: string, name: string, price: number): void {
  db.runSync(
    `INSERT OR REPLACE INTO cached_prices (code, name, price, fetchedAt)
     VALUES (?, ?, ?, ?)`,
    [code, name, price, new Date().toISOString()]
  );
}

export function getCachedPrice(code: string): { price: number; name: string } | null {
  const row = db.getFirstSync<{ price: number; name: string }>(
    "SELECT price, name FROM cached_prices WHERE code = ?",
    [code]
  );
  return row ?? null;
}
```

---

## 6. UI 아키텍처

### 6.1 토스 스타일 테마 객체

`globals.css` 색상 토큰을 TypeScript 테마 객체로 변환:

```typescript
// src/theme/colors.ts
export const TossColors = {
  blue: "#3182F6",           // 주요 액센트
  red: "#F04452",            // 상승 (한국식)
  green: "#00C853",

  textPrimary: "#191F28",
  textSecondary: "#8B95A1",
  textTertiary: "#B0B8C1",

  bgPrimary: "#F4F4F4",
  bgCard: "#FFFFFF",
  border: "#EDEFF1",

  // 카테고리 (constants.ts 기반)
  category: {
    "배당성장": "#3B82F6",
    "고배당": "#8B5CF6",
    "성장동력": "#10B981",
    "안전판": "#94A3B8",
    "채권": "#F59E0B",
    "원자재": "#F97316",
    "기타": "#06B6D4",
  } as Record<string, string>,
} as const;

export const DarkColors = {
  blue: "#5B9CF6",
  red: "#FF6B6B",
  green: "#4ADE80",

  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",

  bgPrimary: "#111827",
  bgCard: "#1F2937",
  border: "#374151",

  category: TossColors.category,
} as const;

// src/theme/typography.ts
import { StyleSheet } from "react-native";

export const Typography = StyleSheet.create({
  heroAmount: { fontSize: 32, fontWeight: "700", letterSpacing: -0.5 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  bodyLarge: { fontSize: 16, fontWeight: "500" },
  body: { fontSize: 14, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "400" },
  tabLabel: { fontSize: 11, fontWeight: "500" },
});
```

### 6.2 테마 Context

```typescript
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { TossColors, DarkColors } from "./colors";
import { getSavedTheme, ThemeName } from "../lib/settingsStorage";

type ThemeColors = typeof TossColors;

const ThemeContext = createContext<{
  colors: ThemeColors;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}>({
  colors: TossColors,
  theme: "toss",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = React.useState<ThemeName>(getSavedTheme());

  const colors = useMemo(() => {
    if (theme === "dark") return DarkColors;
    return TossColors;
  }, [theme, systemScheme]);

  return (
    <ThemeContext.Provider value={{ colors, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### 6.3 네비게이션 (Expo Router)

Expo Router의 파일 기반 라우팅으로 5탭 하단 내비게이션:

```
app/
├── _layout.tsx            // ThemeProvider + 초기화
├── (tabs)/
│   ├── _layout.tsx        // 5탭 Bottom Tabs
│   ├── index.tsx          // 종목 탭
│   ├── allocation.tsx     // 배분 탭
│   ├── summary.tsx        // 요약 탭
│   ├── growth.tsx         // 성장 탭
│   └── holdings.tsx       // 보유 탭
├── stock/
│   ├── [id].tsx           // 종목 상세
│   └── add.tsx            // 종목 추가 (모달)
└── settings.tsx           // 설정
```

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeContext";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "종목",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="allocation"
        options={{
          title: "배분",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "요약",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: "성장",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: "보유",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 6.4 주요 컴포넌트

#### 히어로 자산 카드

```typescript
// src/components/AssetHeroCard.tsx
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Typography } from "../theme/typography";
import { formatNumber, formatPercent } from "../lib/portfolioCalc";

interface Props {
  totalAsset: number;
  profitLoss: number;
  returnRate: number;
  monthlyDividend: number;
  annualDividend: number;
}

export function AssetHeroCard({ totalAsset, profitLoss, returnRate, monthlyDividend, annualDividend }: Props) {
  const { colors } = useTheme();
  const isPositive = profitLoss >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>내 투자</Text>
      <Text style={[Typography.heroAmount, { color: colors.textPrimary }]}>
        {formatNumber(totalAsset)}원
      </Text>
      <Text style={[styles.plText, { color: isPositive ? colors.red : colors.blue }]}>
        {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
        {formatNumber(profitLoss)}원 ({formatPercent(returnRate)})
      </Text>
      <View style={styles.dividendRow}>
        <DividendMiniCard title="월배당" amount={monthlyDividend} />
        <DividendMiniCard title="연배당" amount={annualDividend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 12, marginBottom: 4 },
  plText: { fontSize: 14, marginTop: 4 },
  dividendRow: { flexDirection: "row", gap: 12, marginTop: 16 },
});
```

#### ListRow 패턴 (종목 리스트)

```typescript
// src/components/StockListRow.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { PortfolioStock } from "../lib/types";
import { formatNumber, formatPercent } from "../lib/portfolioCalc";

interface Props {
  stock: PortfolioStock;
  onPress: () => void;
}

export function StockListRow({ stock, onPress }: Props) {
  const { colors } = useTheme();
  const categoryColor = colors.category[stock.category] || colors.blue;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* 카테고리 아이콘 */}
      <View style={[styles.badge, { backgroundColor: categoryColor }]}>
        <Text style={styles.badgeText}>{stock.category[0]}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {stock.name}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {stock.code} · {formatPercent(stock.targetWeight)}
        </Text>
      </View>

      {stock.currentPrice != null && (
        <Text style={[styles.price, { color: colors.textPrimary }]}>
          {formatNumber(stock.currentPrice)}원
        </Text>
      )}

      <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  badge: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
  },
  badgeText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "500" },
  sub: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "500" },
});
```

### 6.5 차트

기존 웹앱의 커스텀 SVG 패턴을 `react-native-svg`로 재구현:

```typescript
// src/components/PieChart.tsx
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { CategoryPosition } from "../lib/portfolioCalc";

interface Props {
  data: CategoryPosition[];
  size?: number;
}

export function PieChart({ data, size = 200 }: Props) {
  // 기존 PieChart.tsx SVG 로직과 동일한 아크 계산
  const total = data.reduce((sum, d) => sum + d.weight, 0);
  let startAngle = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const angle = (d.weight / total) * 360;
        const path = describeArc(size / 2, size / 2, size / 2 - 10, startAngle, startAngle + angle);
        startAngle += angle;
        return <Path key={i} d={path} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />;
      })}
    </Svg>
  );
}
```

---

## 7. 내보내기 (Excel/CSV)

### 7.1 Excel (SheetJS + expo-file-system + expo-sharing)

```typescript
// src/lib/exportExcel.native.ts
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Portfolio } from "./types";

export async function exportToExcel(portfolio: Portfolio, totalAmount: number): Promise<void> {
  const wb = XLSX.utils.book_new();

  // 시트 1: 종목 구성
  const stockData = portfolio.stocks.map((s) => ({
    "구분": s.category,
    "종목명": s.name,
    "종목코드": s.code,
    "목표비중": `${(s.targetWeight * 100).toFixed(1)}%`,
    "배당률": `${(s.dividendRate * 100).toFixed(1)}%`,
    "현재가": s.currentPrice || "",
    "전략특성": s.strategy,
  }));
  const ws1 = XLSX.utils.json_to_sheet(stockData);
  XLSX.utils.book_append_sheet(wb, ws1, "종목구성");

  // 시트 2: 투자 배분
  // (portfolioCalc 결과 기반 — 기존 exportExcel.ts와 동일한 구조)

  // 파일 생성 + 공유
  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const fileName = `${portfolio.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "포트폴리오 내보내기",
  });
}
```

### 7.2 CSV

```typescript
// src/lib/csvExport.native.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function exportCSV(filename: string, csvContent: string): Promise<void> {
  // BOM 추가 (한국어 Excel 호환)
  const bom = "\uFEFF";
  const filePath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, bom + csvContent);
  await Sharing.shareAsync(filePath, {
    mimeType: "text/csv",
    dialogTitle: "CSV 내보내기",
  });
}
```

---

## 8. 프로젝트 구조

Expo Router (파일 기반 라우팅):

```
etf-portfolio-expo/
├── app/                            # Expo Router 라우팅
│   ├── _layout.tsx                 # RootLayout (ThemeProvider, DB 초기화)
│   ├── (tabs)/
│   │   ├── _layout.tsx             # 5탭 Bottom Tabs
│   │   ├── index.tsx               # 종목 탭 (StocksTab)
│   │   ├── allocation.tsx          # 배분 탭
│   │   ├── summary.tsx             # 요약 탭
│   │   ├── growth.tsx              # 성장 탭
│   │   └── holdings.tsx            # 보유 탭
│   ├── stock/
│   │   ├── [id].tsx                # 종목 상세/수정
│   │   └── add.tsx                 # 종목 추가 (모달)
│   ├── settings.tsx                # 설정
│   └── intro.tsx                   # 온보딩 인트로
│
├── src/
│   ├── lib/                        # 비즈니스 로직 (웹에서 복사/교체)
│   │   ├── types.ts                # ← 복사
│   │   ├── portfolioCalc.ts        # ← 복사
│   │   ├── growthCalc.ts           # ← 복사
│   │   ├── holdingsCalc.ts         # ← 복사
│   │   ├── constants.ts            # ← 복사
│   │   ├── portfolioStorage.ts     # ← 어댑터 교체 (expo-sqlite)
│   │   ├── holdingsStorage.ts      # ← 어댑터 교체 (expo-sqlite)
│   │   ├── settingsStorage.ts      # ← 어댑터 교체 (expo-secure-store)
│   │   ├── exportExcel.native.ts   # ← 재작성 (SheetJS)
│   │   ├── csvExport.native.ts     # ← 재작성 (expo-sharing)
│   │   └── dataImport.ts           # JSON 가져오기
│   │
│   ├── services/                   # 외부 서비스
│   │   ├── naverApi.ts             # 네이버 API 통합 (직접 호출)
│   │   └── priceCache.ts           # 시세 캐싱
│   │
│   ├── hooks/                      # 커스텀 훅
│   │   ├── usePortfolio.ts         # 포트폴리오 CRUD + 상태
│   │   ├── useStockPrice.ts        # 시세 조회 + 캐싱
│   │   └── useGrowthReport.ts      # 성장 시뮬레이션
│   │
│   ├── components/                 # UI 컴포넌트
│   │   ├── AssetHeroCard.tsx       # 자산 히어로 카드
│   │   ├── StockListRow.tsx        # ListRow 패턴
│   │   ├── DividendMiniCard.tsx    # 배당 미니 카드
│   │   ├── CategoryBadge.tsx       # 카테고리 뱃지
│   │   ├── PieChart.tsx            # SVG 파이차트
│   │   ├── BarChart.tsx            # SVG 바차트
│   │   ├── StockSearch.tsx         # 자동완성 검색
│   │   ├── BottomSheet.tsx         # 하단 시트 모달
│   │   └── EmptyState.tsx          # 빈 상태 안내
│   │
│   └── theme/                      # 디자인 시스템
│       ├── colors.ts               # 토스/다크 컬러 토큰
│       ├── typography.ts           # 타이포그래피 StyleSheet
│       └── ThemeContext.tsx         # 테마 Context + Provider
│
├── assets/                         # 아이콘, 스플래시, 이미지
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
├── app.json                        # Expo 설정
├── eas.json                        # EAS Build 설정
├── tsconfig.json                   # TypeScript 설정 (paths: @/*)
├── package.json
└── babel.config.js
```

---

## 9. 의존성

### 9.1 Expo SDK 패키지

| 패키지 | 용도 |
|--------|------|
| `expo` ~52 | 코어 |
| `expo-router` ~4 | 파일 기반 라우팅 |
| `expo-sqlite` | SQLite 저장소 |
| `expo-secure-store` | 민감 데이터 저장 |
| `expo-file-system` | 파일 시스템 |
| `expo-sharing` | 공유 시트 |
| `expo-document-picker` | 파일 선택 (JSON 가져오기) |
| `expo-local-authentication` | Face ID / Touch ID |
| `expo-haptics` | 햅틱 피드백 |
| `expo-updates` | OTA 업데이트 |

### 9.2 커뮤니티 패키지

| 패키지 | 용도 |
|--------|------|
| `react-native-svg` | SVG 차트 |
| `@expo/vector-icons` | Ionicons 아이콘 |
| `xlsx` (SheetJS) | Excel 생성 |
| `@react-native-async-storage/async-storage` | 폴백 스토리지 (필요 시) |

### 9.3 개발 도구

| 패키지 | 용도 |
|--------|------|
| `typescript` | 타입 체크 |
| `jest` + `@testing-library/react-native` | 테스트 |
| `eas-cli` | 빌드/배포 |

---

## 10. 구현 계획

```
Phase 0: 프로젝트 셋업 (1-2일)
├── npx create-expo-app etf-portfolio-expo -t tabs
├── tsconfig.json paths 설정 (@/*)
├── app/lib/*.ts 5개 파일 복사 (types, portfolioCalc, growthCalc, holdingsCalc, constants)
├── toLocaleString("ko-KR") Hermes 동작 확인
└── 순수 함수 테스트 포팅 (Vitest → Jest)

Phase 1: 데이터 레이어 (2-3일)
├── expo-sqlite 설정 + initDB()
├── portfolioStorage.ts 어댑터 교체
├── holdingsStorage.ts 어댑터 교체
├── settingsStorage.ts → expo-secure-store
└── dataImport.ts (JSON 가져오기)

Phase 2: API 레이어 (2-3일)
├── naverApi.ts (검색 + 시세 + 환율 통합)
├── priceCache.ts (SQLite 캐싱)
├── 프록시 폴백 로직
└── useStockPrice 훅

Phase 3: 네비게이션 + 테마 (2-3일)
├── Expo Router 5탭 설정
├── ThemeContext (토스/다크/시스템)
├── colors.ts + typography.ts
└── 공통 컴포넌트 (StockListRow, CategoryBadge, BottomSheet)

Phase 4: 종목 + 배분 탭 (3-4일)
├── StocksTab (포트폴리오 리스트 + CRUD)
├── StockSearch (자동완성)
├── AddStock 모달
├── AllocationTab (투자 배분 계산)
└── Pull-to-Refresh 시세 갱신

Phase 5: 요약 + 성장 + 보유 탭 (3-4일)
├── SummaryTab (히어로 카드 + 파이차트)
├── GrowthTab (10년 시뮬레이션)
├── HoldingsTab (보유 현황 + 손익)
└── CSV 가져오기

Phase 6: 내보내기 + 마무리 (2-3일)
├── exportExcel.native.ts (SheetJS + 공유 시트)
├── csvExport.native.ts
├── Face ID / 햅틱 피드백
└── 온보딩 인트로

Phase 7: 출시 준비 (3-5일)
├── 앱 아이콘 + 스플래시 스크린
├── EAS Build 설정
├── 개인정보 처리방침
├── OTA 업데이트 설정 (expo-updates)
├── TestFlight 배포
└── App Store 심사

총 예상 기간: 4-5주 (1인 개발)
```

---

## 11. Expo vs 웹 주요 차이 대응표

| 웹 (Next.js) | Expo | 비고 |
|---------------|------|------|
| `localStorage` | `expo-sqlite` | 어댑터 패턴으로 시그니처 유지 |
| `fetch("/api/stock/...")` | `fetch("https://...")` 직접 | CORS 없음 |
| Tailwind CSS | `StyleSheet.create()` | 토스 테마 객체 사용 |
| `next/router` | `expo-router` | 둘 다 파일 기반 |
| CSS 변수 테마 | React Context 테마 | `useTheme()` 훅 |
| `ExcelJS` | `xlsx` (SheetJS) | API 유사 |
| `<a download>` | `expo-sharing` | 공유 시트 |
| `window.confirm()` | `Alert.alert()` | React Native API |
| `useEffect` + `window` | `useEffect` (동일) | SSR 분기 불필요 |
| `md:hidden` 반응형 | 모바일 전용 | 데스크톱 분기 불필요 |

---

## 12. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 네이버 API 모바일 차단 | HIGH | User-Agent 변경 + 프록시 폴백 + OTA 즉시 수정 |
| App Store 심사 거절 | HIGH | 면책 조항 + "시세 표시용" 명시 + 개인정보 처리방침 |
| Hermes `toLocaleString` 비호환 | MEDIUM | 앱 초기 확인, 필요 시 직접 포맷터 구현 |
| ExcelJS → SheetJS 기능 차이 | MEDIUM | 수식 셀 → 계산된 값만 포함. 5시트 구조 유지 |
| expo-sqlite 마이그레이션 | LOW | 버전 관리 + 마이그레이션 함수 |
| OTA 업데이트 크기 제한 | LOW | 코드 분할 + 에셋 최적화 |

---

## 13. OTA 업데이트 전략

Expo의 핵심 장점 — App Store 심사 없이 JavaScript 번들을 즉시 업데이트:

```json
// app.json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 5000
    }
  }
}
```

주요 활용 시나리오:
- 네이버 API URL/형식 변경 시 즉시 대응
- UI 버그 핫픽스
- 새 종목 카테고리 추가

> 네이티브 모듈 변경(expo-sqlite 버전 등)은 EAS Build + App Store 심사 필요.
