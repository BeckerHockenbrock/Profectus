"use client";

import { useEffect } from "react";

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const originalStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = originalStyles.htmlOverflow;
      body.style.overflow = originalStyles.bodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
