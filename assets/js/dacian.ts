/**
 * Dacian Mode Interactions - card hover effects, grid behaviors
 * Only runs when data-mode="dacian"
 */
(function () {
  "use strict";

  function isDacianMode(): boolean {
    return document.documentElement.getAttribute("data-mode") === "dacian";
  }

  function initSmoothScroll(): void {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e: Event) => {
        const targetId = anchor.getAttribute("href")?.slice(1);
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  let initialized = false;

  function init(): void {
    if (initialized) return;
    initialized = true;
    initSmoothScroll();
  }

  if (!isDacianMode()) {
    window.addEventListener("modechange", (e: Event) => {
      const ce = e as CustomEvent<{ mode: "meadow" | "dacian" }>;
      if (ce.detail.mode === "dacian") {
        init();
      }
    });
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
