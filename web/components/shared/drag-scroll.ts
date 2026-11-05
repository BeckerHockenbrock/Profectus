/** Resolve the scroll surface at drag start; mobile continues to scroll the page. */
export function getDragScrollSurface(element: HTMLElement | null) {
  const content = element?.closest<HTMLElement>(".content");
  const isScrollable = content && /auto|scroll/.test(getComputedStyle(content).overflowY);
  const surface = isScrollable ? content : null;
  const initialScrollTop = surface ? surface.scrollTop : window.scrollY;

  return {
    scrollAtEdge(clientY: number) {
      const bounds = surface?.getBoundingClientRect();
      const top = bounds?.top ?? 0;
      const bottom = bounds?.bottom ?? window.innerHeight;
      const delta = clientY < top + 110 ? -8 : clientY > bottom - 110 ? 8 : 0;
      if (delta) (surface ?? window).scrollBy({ top: delta, behavior: "instant" });
      return (surface ? surface.scrollTop : window.scrollY) - initialScrollTop;
    },
  };
}
