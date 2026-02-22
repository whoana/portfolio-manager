import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BalloonTooltip from "@/app/components/BalloonTooltip";
import { HelpProvider } from "@/app/components/HelpProvider";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import type { HelpStep } from "@/app/lib/helpSteps";

const MOCK_STEPS: HelpStep[] = [
  {
    id: "test-1",
    targetAttr: "test-target-1",
    title: "첫 번째 스텝",
    description: "첫 번째 설명입니다.",
    position: "bottom",
  },
  {
    id: "test-2",
    targetAttr: "test-target-2",
    title: "두 번째 스텝",
    description: "두 번째 설명입니다.",
    position: "top",
    showFinger: true,
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HelpProvider>{children}</HelpProvider>
    </ThemeProvider>
  );
}

// Mock localStorage
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
});

// Mock getBoundingClientRect
const mockRect = {
  top: 100,
  left: 100,
  width: 200,
  height: 50,
  right: 300,
  bottom: 150,
  x: 100,
  y: 100,
  toJSON: () => {},
};

describe("BalloonTooltip", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it("helpEnabled가 false이면 렌더링하지 않는다", () => {
    store.set("etf_help_enabled", "false");

    const { container } = render(
      <Wrapper>
        <div data-help-step="test-target-1">대상</div>
        <BalloonTooltip steps={MOCK_STEPS} />
      </Wrapper>
    );

    expect(screen.queryByText("첫 번째 스텝")).not.toBeInTheDocument();
    expect(container.querySelector(".help-spotlight")).not.toBeInTheDocument();
  });

  it("대상 요소가 있으면 풍선을 표시한다", () => {
    store.set("etf_help_enabled", "true");

    // Mock querySelector to return an element with getBoundingClientRect
    const origQuerySelector = document.querySelector.bind(document);
    vi.spyOn(document, "querySelector").mockImplementation((selector: string) => {
      if (selector === '[data-help-step="test-target-1"]') {
        const el = document.createElement("div");
        el.getBoundingClientRect = () => mockRect as DOMRect;
        el.scrollIntoView = vi.fn();
        return el;
      }
      return origQuerySelector(selector);
    });

    render(
      <Wrapper>
        <div data-help-step="test-target-1">대상</div>
        <BalloonTooltip steps={MOCK_STEPS} />
      </Wrapper>
    );

    expect(screen.getByText("첫 번째 스텝")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("다음")).toBeInTheDocument();
    expect(screen.getByText("건너뛰기")).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("다음 버튼을 클릭하면 스텝이 진행된다", async () => {
    store.set("etf_help_enabled", "true");
    const user = userEvent.setup();

    const origQuerySelector = document.querySelector.bind(document);
    vi.spyOn(document, "querySelector").mockImplementation((selector: string) => {
      if (typeof selector === "string" && selector.includes("data-help-step")) {
        const el = document.createElement("div");
        el.getBoundingClientRect = () => mockRect as DOMRect;
        el.scrollIntoView = vi.fn();
        return el;
      }
      return origQuerySelector(selector);
    });

    render(
      <Wrapper>
        <div data-help-step="test-target-1">대상1</div>
        <div data-help-step="test-target-2">대상2</div>
        <BalloonTooltip steps={MOCK_STEPS} />
      </Wrapper>
    );

    expect(screen.getByText("첫 번째 스텝")).toBeInTheDocument();

    await user.click(screen.getByText("다음"));

    expect(screen.getByText("두 번째 스텝")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
