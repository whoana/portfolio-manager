export interface HelpStep {
  id: string;
  targetAttr: string;
  title: string;
  description: string;
  position: "top" | "bottom";
  showFinger?: boolean;
}

export const INTRO_STEPS: HelpStep[] = [
  {
    id: "intro-1",
    targetAttr: "intro-cards",
    title: "투자 핵심 개념",
    description: "복리, 시간, 포트폴리오 관리의 핵심 개념을 카드로 확인하세요.",
    position: "bottom",
  },
  {
    id: "intro-2",
    targetAttr: "intro-simulation",
    title: "복리 시뮬레이션",
    description: "1억원을 연 5% 복리로 투자했을 때 10~30년 후 자산 성장을 확인하세요.",
    position: "top",
  },
  {
    id: "intro-3",
    targetAttr: "intro-cta",
    title: "시작하기",
    description: "버튼을 눌러 나만의 ETF 포트폴리오를 구성해보세요!",
    position: "top",
    showFinger: true,
  },
];

export const MAIN_STEPS: HelpStep[] = [
  {
    id: "main-1",
    targetAttr: "main-tabs",
    title: "포트폴리오 탭",
    description: "여러 포트폴리오를 만들고 탭으로 전환할 수 있습니다. 더블클릭으로 이름을 변경하세요.",
    position: "bottom",
  },
  {
    id: "main-2",
    targetAttr: "main-table",
    title: "종목 테이블",
    description: "ETF 종목의 목표 비중, 배당률, 현재가를 관리합니다. 종목 추가 버튼으로 새 종목을 추가하세요.",
    position: "bottom",
  },
  {
    id: "main-3",
    targetAttr: "main-allocation",
    title: "투자금액 구성표",
    description: "투자금액을 입력하면 종목별 매수수량과 배당금이 자동 계산됩니다.",
    position: "top",
  },
  {
    id: "main-4",
    targetAttr: "main-summary",
    title: "포트폴리오 요약",
    description: "전체 요약 통계와 Excel 내보내기 기능을 제공합니다.",
    position: "top",
  },
  {
    id: "main-5",
    targetAttr: "main-growth",
    title: "자산성장 전망",
    description: "배당 재투자와 자산 상승을 반영한 10년 성장 시뮬레이션입니다.",
    position: "top",
  },
];
