import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntroPage from "@/app/components/IntroPage";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { HelpProvider } from "@/app/components/HelpProvider";

// Mock localStorage
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HelpProvider>{children}</HelpProvider>
    </ThemeProvider>
  );
}

function renderIntro(onNext = vi.fn()) {
  return render(
    <Wrapper>
      <IntroPage onNext={onNext} />
    </Wrapper>
  );
}

describe("IntroPage", () => {
  beforeEach(() => {
    store.clear();
    store.set("etf_help_enabled", "false");
  });

  it("투자 카드 첫 번째 카드가 렌더링된다", () => {
    renderIntro();
    expect(
      screen.getByText("그래, 그럼 잘 찾아왔어.")
    ).toBeInTheDocument();
  });

  it("복리 시뮬레이션 섹션이 렌더링된다", () => {
    renderIntro();
    expect(screen.getByText("복리 시뮬레이션")).toBeInTheDocument();
    expect(screen.getByText("10년 후")).toBeInTheDocument();
    expect(screen.getByText("20년 후")).toBeInTheDocument();
    expect(screen.getByText("30년 후")).toBeInTheDocument();
  });

  it("CTA 버튼이 렌더링된다", () => {
    renderIntro();
    expect(
      screen.getByRole("button", { name: /포트폴리오 시작하기/ })
    ).toBeInTheDocument();
  });

  it("CTA 버튼 클릭 시 onNext가 호출된다", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();
    renderIntro(onNext);

    await user.click(
      screen.getByRole("button", { name: /포트폴리오 시작하기/ })
    );

    expect(onNext).toHaveBeenCalledOnce();
  });
});
