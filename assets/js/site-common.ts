/**
 * Shared Site Utilities - used by both Meadow and Dacian modes
 * - Page transitions (fade in/out)
 * - Badge copy (88x31)
 * - Hex color copy
 * - Tag filter for writing list
 */
(function () {
  "use strict";

  function snippet(ext: string): string {
    const origin = location.origin;
    return (
      '<a href="' +
      origin +
      '"><img src="' +
      origin +
      "/88x31." +
      ext +
      '" width="88" height="31" alt="' +
      location.host +
      '"></a>'
    );
  }

  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {}

  let leaving = false;

  function layers(): HTMLElement[] {
    return Array.prototype.slice.call(
      document.querySelectorAll(".fade, .meadow, .fall"),
    );
  }

  function show(animate: boolean) {
    layers().forEach((e: HTMLElement) => {
      e.style.transition = animate ? "opacity 280ms ease-out" : "none";
      e.style.opacity = "1";
    });
  }

  function navigate(url: string) {
    if (leaving) return;
    if (reduced) {
      location.href = url;
      return;
    }
    leaving = true;
    layers().forEach((e: HTMLElement) => {
      e.style.transition = "opacity 200ms ease-in";
      e.style.opacity = "0";
    });
    let went = false;
    const go = () => {
      if (!went) {
        went = true;
        location.href = url;
      }
    };
    setTimeout(go, 210);
  }

  function initTransitions() {
    document.addEventListener("click", (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const target = e.target as Element | null;
      const a =
        target && target.closest
          ? (target.closest("a[href]") as HTMLAnchorElement | null)
          : null;
      if (
        !a ||
        (a.target && a.target !== "_self") ||
        a.hasAttribute("download")
      )
        return;
      const href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname))
        return;
      e.preventDefault();
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      navigate(url.href);
    });

    window.addEventListener("pageshow", (e: PageTransitionEvent) => {
      if (e.persisted) {
        leaving = false;
        show(false);
      }
    });

    if (reduced) {
      show(false);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => show(true)));
  }

  function initBadgeCopy() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-copy]"),
      (btn: HTMLElement) => {
        const ext = btn.getAttribute("data-copy") ?? "";
        const label = btn.textContent ?? "";
        let timer: ReturnType<typeof setTimeout> | undefined;
        btn.addEventListener("click", () => {
          try {
            navigator.clipboard.writeText(snippet(ext));
          } catch {}
          btn.textContent = "copied";
          if (timer !== undefined) clearTimeout(timer);
          timer = setTimeout(() => {
            btn.textContent = label;
          }, 1600);
        });
      },
    );
  }

  function initHexCopy() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-hex]"),
      (btn: HTMLElement) => {
        const hex = btn.getAttribute("data-hex") ?? "";
        const label = btn.querySelector(".hex");
        let timer: ReturnType<typeof setTimeout> | undefined;
        btn.addEventListener("click", () => {
          try {
            navigator.clipboard.writeText(hex);
          } catch {}
          if (!label) return;
          label.textContent = "copied";
          if (timer !== undefined) clearTimeout(timer);
          timer = setTimeout(() => {
            label.textContent = hex;
          }, 1600);
        });
      },
    );
  }

  function initTagFilter() {
    const bar = document.querySelector(".filter");
    if (!bar) return;
    const rows = Array.prototype.slice.call(
      document.querySelectorAll(".post-row"),
    ) as HTMLElement[];
    const btns = Array.prototype.slice.call(
      bar.querySelectorAll("button"),
    ) as HTMLButtonElement[];
    const count = bar.querySelector(".count");
    const empty = document.querySelector(".empty");

    function apply(tag: string) {
      let shown = 0;
      rows.forEach((r) => {
        const tags = (r.getAttribute("data-tags") || "").split(/\s+/);
        const hit = !tag || tags.indexOf(tag) >= 0;
        r.hidden = !hit;
        if (hit) shown++;
      });
      btns.forEach((b) => {
        b.classList.toggle(
          "active",
          (b.getAttribute("data-tag") || "") === tag,
        );
      });
      if (count) count.textContent = shown === 1 ? "1 post" : shown + " posts";
      if (empty) (empty as HTMLElement).hidden = shown !== 0;
      try {
        history.replaceState(
          null,
          "",
          tag ? "?tag=" + encodeURIComponent(tag) : location.pathname,
        );
      } catch {}
    }

    btns.forEach((b) => {
      b.addEventListener("click", () => {
        apply(b.getAttribute("data-tag") || "");
      });
    });
    apply(new URLSearchParams(location.search).get("tag") || "");
  }

  function boot() {
    initTransitions();
    initBadgeCopy();
    initHexCopy();
    initTagFilter();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
