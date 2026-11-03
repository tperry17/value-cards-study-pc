import { describe, it, expect } from "vitest";
import { conditionFromUrl } from "../hooks/useGameState";

describe("conditionFromUrl", () => {
  it("reads each valid condition", () => {
    expect(conditionFromUrl("?condition=values")).toBe("values");
    expect(conditionFromUrl("?condition=issues")).toBe("issues");
  });

  it("ignores case, whitespace, and other parameters", () => {
    expect(conditionFromUrl("?pid=123&condition=ISSUES")).toBe("issues");
    expect(conditionFromUrl("?condition=%20Values%20")).toBe("values");
  });

  it("returns null when missing or invalid", () => {
    expect(conditionFromUrl("")).toBeNull();
    expect(conditionFromUrl("?condition=")).toBeNull();
    expect(conditionFromUrl("?condition=both")).toBeNull();
  });
});
