"use strict";

// The content and navigation remain usable when this script is unavailable.
(() => {
  const menu = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  const isMobile = window.matchMedia("(max-width: 799px)");

  if (menu && nav) {
    const setMenu = (open, focusButton = false) => {
      menu.setAttribute("aria-expanded", String(open));
      menu.querySelector("span").textContent = open ? "−" : "+";
      nav.hidden = isMobile.matches && !open;
      if (focusButton) menu.focus();
    };
    const syncMenu = () => {
      const activeInMenu = nav.contains(document.activeElement);
      menu.hidden = !isMobile.matches;
      nav.toggleAttribute("data-collapsible", isMobile.matches);
      setMenu(false, isMobile.matches && activeInMenu);
    };
    menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (!link || !isMobile.matches) return;
      setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMobile.matches && menu.getAttribute("aria-expanded") === "true") setMenu(false, true);
    });
    document.addEventListener("click", (event) => {
      if (isMobile.matches && !nav.hidden && !nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    isMobile.addEventListener("change", syncMenu);
    syncMenu();
  }

  const openCaseFromHash = () => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  document.querySelectorAll("[data-open-case]").forEach((link) => {
    link.addEventListener("click", () => {
      const study = document.getElementById(link.dataset.openCase);
      if (study instanceof HTMLDetailsElement) study.open = true;
    });
  });
  window.addEventListener("hashchange", openCaseFromHash);
  openCaseFromHash();

  if ("IntersectionObserver" in window && nav) {
    const links = [...nav.querySelectorAll("a[href^='#']")];
    const observer = new IntersectionObserver((entries) => {
      const shown = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!shown) return;
      links.forEach((link) => {
        if (link.hash === `#${shown.target.id}`) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    links.forEach((link) => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) observer.observe(section);
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
