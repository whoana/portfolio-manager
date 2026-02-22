import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockSearch from "@/app/components/StockSearch";
import type { StockSearchResult } from "@/app/lib/types";

vi.mock("@/app/lib/naverFinance", () => ({
  searchStocks: vi.fn(),
  getStockPrice: vi.fn(),
}));

import { searchStocks } from "@/app/lib/naverFinance";
const mockSearchStocks = vi.mocked(searchStocks);

const MOCK_RESULTS: StockSearchResult[] = [
  { name: "TIGER 미국S&P500", code: "360750" },
  { name: "TIGER 미국배당다우존스", code: "458730" },
  { name: "TIGER 나스닥100", code: "133690" },
];

describe("StockSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 렌더: 입력창이 보이고 드롭다운은 닫힘", () => {
    render(<StockSearch onSelect={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByText("TIGER 미국S&P500")).toBeNull();
  });

  it("300ms 디바운스: 입력 직후 검색 미호출, 이후 호출", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null }); // 타이핑 딜레이 없음
    render(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "TIGER");

    // 타이핑 직후 (debounce 300ms 미경과)
    expect(mockSearchStocks).not.toHaveBeenCalled();

    // 300ms 실제 대기
    await waitFor(
      () => {
        expect(mockSearchStocks).toHaveBeenCalledWith("TIGER");
      },
      { timeout: 600 }
    );
  });

  it("검색 결과가 드롭다운으로 표시", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");

    await waitFor(
      () => {
        expect(screen.getByText("TIGER 미국S&P500")).toBeInTheDocument();
        expect(screen.getByText("360750")).toBeInTheDocument();
      },
      { timeout: 600 }
    );
  });

  it("ArrowDown으로 다음 항목 하이라이트", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    await user.keyboard("{ArrowDown}");

    const firstItem = screen.getByText("TIGER 미국S&P500").closest("button");
    expect(firstItem).toHaveClass("bg-table-hover");
  });

  it("ArrowDown 마지막 항목에서 첫 항목으로 순환", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    // 마지막 항목(3번째)으로 이동
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    // 순환하여 첫 항목으로
    await user.keyboard("{ArrowDown}");

    const firstItem = screen.getByText("TIGER 미국S&P500").closest("button");
    expect(firstItem).toHaveClass("bg-table-hover");
  });

  it("ArrowUp 첫 항목에서 마지막 항목으로 순환", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    // 첫 항목으로 이동 후 ArrowUp → 마지막으로 순환
    await user.keyboard("{ArrowDown}{ArrowUp}");

    const lastItem = screen.getByText("TIGER 나스닥100").closest("button");
    expect(lastItem).toHaveClass("bg-table-hover");
  });

  it("Enter 키로 하이라이트된 항목 선택", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const onSelect = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={onSelect} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith(MOCK_RESULTS[0]);
  });

  it("Escape 키로 드롭다운 닫힘", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    await user.keyboard("{Escape}");

    expect(screen.queryByText("TIGER 미국S&P500")).toBeNull();
  });

  it("종목 클릭 시 onSelect 호출 및 드롭다운 닫힘", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const onSelect = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={onSelect} />);

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    await user.click(screen.getByText("TIGER 미국S&P500"));

    expect(onSelect).toHaveBeenCalledWith(MOCK_RESULTS[0]);
    expect(screen.queryByText("TIGER 미국S&P500")).toBeNull();
  });

  it("외부 클릭 시 드롭다운 닫힘", async () => {
    mockSearchStocks.mockResolvedValue(MOCK_RESULTS);
    const user = userEvent.setup({ delay: null });
    render(
      <div>
        <StockSearch onSelect={vi.fn()} />
        <button>외부 버튼</button>
      </div>
    );

    await user.type(screen.getByRole("textbox"), "TIGER");
    await waitFor(() => screen.getByText("TIGER 미국S&P500"), { timeout: 600 });

    await user.click(screen.getByText("외부 버튼"));

    expect(screen.queryByText("TIGER 미국S&P500")).toBeNull();
  });

  it("검색 오류 → 에러 메시지 표시", async () => {
    mockSearchStocks.mockRejectedValue(new Error("검색 실패"));
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "TIGER");

    await waitFor(
      () => {
        expect(
          screen.getByText("검색 중 오류가 발생했습니다.")
        ).toBeInTheDocument();
      },
      { timeout: 600 }
    );
  });

  it("검색 결과 없음 → '검색 결과가 없습니다' 표시", async () => {
    mockSearchStocks.mockResolvedValue([]);
    const user = userEvent.setup({ delay: null });
    render(<StockSearch onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "없는종목");

    await waitFor(
      () => {
        expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
      },
      { timeout: 600 }
    );
  });
});
