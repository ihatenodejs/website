"use client";

import { useEffect } from "react";

function scrollHashIntoAppContainer(behavior: ScrollBehavior) {
  const hash = window.location.hash;

  if (!hash) {
    return;
  }

  const targetId = decodeURIComponent(hash.slice(1));
  const targetElement = document.getElementById(targetId);
  const scrollContainer = document.querySelector<HTMLElement>(".app-scroll");

  if (!targetElement || !scrollContainer) {
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const top = targetRect.top - containerRect.top + scrollContainer.scrollTop;

  scrollContainer.scrollTo({
    top,
    behavior,
  });
}

export default function HashScrollHandler() {
  useEffect(() => {
    scrollHashIntoAppContainer("auto");

    const onHashChange = () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      scrollHashIntoAppContainer(prefersReducedMotion ? "auto" : "smooth");
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
