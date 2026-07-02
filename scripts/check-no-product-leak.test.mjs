import { describe, it, expect } from "vitest";
import { findLeaks } from "./check-no-product-leak.mjs";

describe("findLeaks", () => {
  it("flags product tokens in tracked files", () => {
    const files = [{ path: "convex/x.ts", content: "handle YapTask commands" }];
    const leaks = findLeaks({ files });
    expect(leaks).toHaveLength(1);
    expect(leaks[0]).toMatchObject({ path: "convex/x.ts", token: "YapTask" });
  });

  it("ignores reference checkout dirs", () => {
    const files = [{ path: "yaptask/convex/x.ts", content: "YapTask" }];
    expect(findLeaks({ files })).toHaveLength(0);
  });

  it("ignores the spec and this plan that name the source app", () => {
    const files = [
      {
        path: "docs/superpowers/specs/2026-07-02-template-backport-framework-design.md",
        content: "YapTask",
      },
      {
        path: "docs/plans/template-backport-framework-evals.md",
        content: "YapTask",
      },
    ];
    expect(findLeaks({ files })).toHaveLength(0);
  });

  it("flags Linear issue keys", () => {
    const files = [{ path: "docs/x.md", content: "see AMB-123" }];
    expect(findLeaks({ files })[0]).toMatchObject({ token: "AMB-123" });
  });

  it("passes clean files", () => {
    expect(
      findLeaks({ files: [{ path: "convex/x.ts", content: "generic voice agent" }] }),
    ).toHaveLength(0);
  });
});
