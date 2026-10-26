/**
 * Dacian Mode Interactions - card hover effects, grid behaviors
 * Only runs when data-mode="dacian"
 */
(function () {
  "use strict";

  function isDacianMode(): boolean {
    return document.documentElement.getAttribute("data-mode") === "dacian";
  }

  function initCardEffects(): void {
    const cards = document.querySelectorAll<HTMLElement>(
      ".grid-item, .subsection-grid-item, .card",
    );
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * 3;
        const rotateY = (x / rect.width) * -3;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.transition = "transform 150ms ease-out";
      });

      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform 100ms ease-out";
      });
    });
  }

  function initGridStagger(): void {
    const grids = document.querySelectorAll(".grid, .subsection-grid");
    grids.forEach((grid) => {
      const items = grid.querySelectorAll<HTMLElement>(
        ".grid-item, .subsection-grid-item",
      );
      items.forEach((item, index) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        item.style.transition =
          "opacity 300ms ease-out, transform 300ms ease-out";
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, 50 * index);
      });
    });
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

  function initCardKeyboardNav(): void {
    const cards = document.querySelectorAll<HTMLElement>(
      ".grid-item a, .subsection-grid-item a, .card a",
    );
    cards.forEach((card) => {
      card.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  function init(): void {
    initCardEffects();
    initGridStagger();
    initSmoothScroll();
    initCardKeyboardNav();
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
