import assert from "node:assert/strict";
import { test } from "node:test";
import { getDragScrollSurface } from "./drag-scroll.ts";

test("desktop drag scrolls within the frame and includes accumulated scroll distance", () => {
  const content = {
    scrollTop: 120,
    getBoundingClientRect: () => ({ top: 16, bottom: 704 }),
    scrollBy({ top }) { this.scrollTop += top; },
  };
  globalThis.getComputedStyle = () => ({ overflowY: "auto" });
  globalThis.window = { scrollBy() { assert.fail("The document must stay still"); } };
  const drag = getDragScrollSurface({ closest: () => content });
  assert.equal(drag.scrollAtEdge(600), 8);
  assert.equal(drag.scrollAtEdge(600), 16);
  assert.equal(drag.scrollAtEdge(360), 16);
  assert.equal(drag.scrollAtEdge(120), 8);
});

test("mobile drag keeps document scrolling when content has no scroll viewport", () => {
  globalThis.getComputedStyle = () => ({ overflowY: "visible" });
  globalThis.window = {
    scrollY: 200, innerHeight: 844,
    scrollBy({ top }) { this.scrollY += top; },
  };
  const drag = getDragScrollSurface({ closest: () => ({}) });
  assert.equal(drag.scrollAtEdge(800), 8);
  assert.equal(drag.scrollAtEdge(400), 8);
  assert.equal(drag.scrollAtEdge(40), 0);
});
