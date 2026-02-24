import { describe, it, expect, beforeEach, vi } from "vitest";
import { createLocalStorageMock } from "../mocks/localStorage";

const lsMock = createLocalStorageMock();

vi.stubGlobal("localStorage", lsMock);

// Must import after stubbing
import {
  getSavedTheme,
  saveTheme,
  getHelpEnabled,
  saveHelpEnabled,
} from "@/app/lib/settingsStorage";

describe("settingsStorage", () => {
  beforeEach(() => {
    lsMock.clear();
    vi.clearAllMocks();
  });

  describe("theme", () => {
    it("기본값은 toss이다", () => {
      expect(getSavedTheme()).toBe("toss");
    });

    it("저장한 테마를 읽는다", () => {
      saveTheme("dark");
      expect(getSavedTheme()).toBe("dark");
    });

    it("유효하지 않은 값이면 toss를 반환한다", () => {
      lsMock.setItem("etf_theme", "invalid");
      expect(getSavedTheme()).toBe("toss");
    });

    it("classic 테마를 저장하고 읽는다", () => {
      saveTheme("classic");
      expect(getSavedTheme()).toBe("classic");
    });
  });

  describe("helpEnabled", () => {
    it("기본값은 true이다", () => {
      expect(getHelpEnabled()).toBe(true);
    });

    it("false를 저장하고 읽는다", () => {
      saveHelpEnabled(false);
      expect(getHelpEnabled()).toBe(false);
    });

    it("true를 저장하고 읽는다", () => {
      saveHelpEnabled(true);
      expect(getHelpEnabled()).toBe(true);
    });
  });
});
