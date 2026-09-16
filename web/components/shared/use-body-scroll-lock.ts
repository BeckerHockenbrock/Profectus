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
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyWidth: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.width = "100%";

    return () => {
      html.style.overflow = originalStyles.htmlOverflow;
      body.style.overflow = originalStyles.bodyOverflow;
      body.style.position = originalStyles.bodyPosition;
      body.style.top = originalStyles.bodyTop;
      body.style.left = originalStyles.bodyLeft;
      body.style.width = originalStyles.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
