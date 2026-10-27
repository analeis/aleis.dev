/**
 * Mode Switcher - handles switching between Meadow and Dacian modes
 * Persists choice in localStorage and URL (?mode=meadow|dacian)
 */
(function () {
  "use strict";

  type Mode = "meadow" | "dacian";

  const MODE_KEY = "site-mode";
  const URL_PARAM = "mode";

  function getSystemMode(): Mode {
    // Meadow is dark, Dacian is light - respect system preference as fallback
    const prefersDark =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    return prefersDark ? "meadow" : "dacian";
  }

  function getInitialMode(): Mode {
    // 1. Check URL param
    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get(URL_PARAM);
    if (urlMode === "meadow" || urlMode === "dacian") return urlMode;

    // 2. Check localStorage
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === "meadow" || stored === "dacian") return stored;
    } catch {}

    // 3. Keep the mode selected by the inline bootstrap script/page.
    const bootMode = document.documentElement.getAttribute("data-mode");
    if (bootMode === "meadow" || bootMode === "dacian") return bootMode;

    // 4. Fall back to system preference only if no mode was available.
    return getSystemMode();
  }

  function setMode(mode: Mode, { updateURL = true } = {}) {
    const root = document.documentElement;
    root.setAttribute("data-mode", mode);
    root.style.colorScheme = mode === "dacian" ? "light" : "dark";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mode === "dacian" ? "#104088" : "#c1b0e7");

    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {}

    if (updateURL) {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, mode);
      window.history.replaceState({}, "", url);
    }

    // Update all toggle buttons
    updateToggleButtons(mode);

    // Notify other scripts
    try {
      window.dispatchEvent(new CustomEvent("modechange", { detail: { mode } }));
    } catch {}
  }

  function updateToggleButtons(currentMode: Mode) {
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      "button[data-mode-toggle], button.theme",
    );
    const nextMode: Mode = currentMode === "meadow" ? "dacian" : "meadow";

    buttons.forEach((btn) => {
      const label = btn.getAttribute(`data-${nextMode}`) || `${nextMode} mode`;
      btn.textContent = label;
      btn.hidden = false;
      btn.setAttribute("aria-pressed", String(currentMode === nextMode));
    });
  }

  function init() {
    const mode = getInitialMode();
    setMode(mode, { updateURL: false }); // Don't push to history on initial load

    // Toggle button clicks
    document.addEventListener("click", (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.(
        "button[data-mode-toggle], button.theme",
      ) as HTMLButtonElement | null;
      if (!btn) return;

      const currentMode = document.documentElement.getAttribute(
        "data-mode",
      ) as Mode;
      const nextMode: Mode = currentMode === "meadow" ? "dacian" : "meadow";
      setMode(nextMode);
    });

    // System preference change
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      // Only auto-switch if user hasn't explicitly chosen
      let hasExplicitChoice = false;
      try {
        hasExplicitChoice = localStorage.getItem(MODE_KEY) !== null;
      } catch {}
      if (!hasExplicitChoice) {
        setMode(getSystemMode());
      }
    };
    mediaQuery.addEventListener?.("change", handleSystemChange);

    // Restore on back/forward navigation
    window.addEventListener("pageshow", (e: PageTransitionEvent) => {
      if (e.persisted) {
        const mode = getInitialMode();
        setMode(mode, { updateURL: false });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
