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

  // A dependency-free 3D scene keeps the visual lightweight and degrades to
  // a static composition for touch devices and reduced-motion preferences.
  const scene = document.getElementById("hero-scene");
  const canvas = document.getElementById("scene-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (scene) {
    const tiltPanel = scene.querySelector("[data-tilt]");
    const resetTilt = () => {
      tiltPanel?.style.setProperty("--tilt-x", "0");
      tiltPanel?.style.setProperty("--tilt-y", "0");
    };
    scene.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || reduceMotion.matches || !tiltPanel) return;
      const bounds = scene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      tiltPanel.style.setProperty("--tilt-x", String(y * -8));
      tiltPanel.style.setProperty("--tilt-y", String(x * 10));
    });
    scene.addEventListener("pointerleave", resetTilt);
    reduceMotion.addEventListener("change", resetTilt);
  }

  if (scene && canvas instanceof HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (context) {
      const pointCount = 30;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const points = Array.from({ length: pointCount }, (_, index) => {
        const y = 1 - (index / (pointCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const angle = goldenAngle * index;
        return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
      });
      const edges = [];
      for (let a = 0; a < points.length; a += 1) {
        for (let b = a + 1; b < points.length; b += 1) {
          const dx = points[a].x - points[b].x;
          const dy = points[a].y - points[b].y;
          const dz = points[a].z - points[b].z;
          if (Math.hypot(dx, dy, dz) < 0.72) edges.push([a, b]);
        }
      }

      let width = 0;
      let height = 0;
      let angle = 0;
      let visible = true;
      let frame = 0;
      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        const scale = Math.min(window.devicePixelRatio || 1, 1.5);
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        context.setTransform(scale, 0, 0, scale, 0, 0);
      };
      const rotate = (point, rotationX, rotationY) => {
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const x = point.x * cosY - point.z * sinY;
        const zY = point.x * sinY + point.z * cosY;
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        return { x, y: point.y * cosX - zY * sinX, z: point.y * sinX + zY * cosX };
      };
      const draw = () => {
        context.clearRect(0, 0, width, height);
        const radius = Math.min(width, height) * 0.36;
        const projected = points.map((point) => {
          const rotated = rotate(point, -0.3 + Math.sin(angle * 0.7) * 0.08, angle);
          const depth = 3.2 + rotated.z;
          const perspective = 2.2 / depth;
          return { x: width / 2 + rotated.x * radius * perspective, y: height / 2 + rotated.y * radius * perspective, z: rotated.z };
        });
        context.lineWidth = 1;
        edges.forEach(([a, b]) => {
          const alpha = 0.08 + ((projected[a].z + projected[b].z + 2) / 4) * 0.28;
          context.strokeStyle = `rgba(130,230,177,${alpha})`;
          context.beginPath();
          context.moveTo(projected[a].x, projected[a].y);
          context.lineTo(projected[b].x, projected[b].y);
          context.stroke();
        });
        projected.forEach((point) => {
          const size = 1.2 + (point.z + 1) * 1.15;
          context.fillStyle = point.z > 0.35 ? "#82e6b1" : "rgba(147,197,253,.62)";
          context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
        });
      };
      const animate = () => {
        if (!visible || document.hidden) { frame = 0; return; }
        if (!reduceMotion.matches) angle += 0.003;
        draw();
        if (!reduceMotion.matches) frame = requestAnimationFrame(animate);
      };
      const restart = () => {
        cancelAnimationFrame(frame);
        resize();
        animate();
      };
      new ResizeObserver(restart).observe(canvas);
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) restart();
        else cancelAnimationFrame(frame);
      }, { rootMargin: "120px" }).observe(scene);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) restart(); });
      reduceMotion.addEventListener("change", restart);
      restart();
    }
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
