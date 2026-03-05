(function () {
  "use strict";

  const mapElement = document.querySelector("#range-map");
  const LEAFLET_STYLE_SOURCES = [
    {
      href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    },
    {
      href: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
      integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    },
  ];
  const LEAFLET_SCRIPT_SOURCES = [
    {
      src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
      integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=",
    },
  ];

  let leafletStylePromise;
  let leafletLoadPromise;
  let rangeMapInstance;

  function initRangeMap() {
    if (
      !mapElement ||
      !window.L ||
      mapElement.dataset.mapInitialized === "true"
    ) {
      return;
    }

    const rangeMap = L.map(mapElement, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    rangeMapInstance = rangeMap;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      },
    ).addTo(rangeMap);

    const rangeBoundary = [
      [28.4, 88.1],
      [27.5, 94.6],
      [26.8, 97.6],
      [24.5, 102.4],
      [23.8, 104.2],
      [21.0, 106.0],
      [17.8, 105.3],
      [14.0, 103.2],
      [11.8, 99.5],
      [7.2, 98.8],
      [8.0, 95.8],
      [11.5, 92.8],
      [18.2, 90.1],
      [23.3, 88.0],
    ];

    rangeMap.fitBounds(rangeBoundary, { padding: [24, 24] });

    mapElement.dataset.mapInitialized = "true";

    L.polygon(rangeBoundary, {
      color: "#d6b25f",
      weight: 2,
      opacity: 0.85,
      fillColor: "#4f7f63",
      fillOpacity: 0.26,
      dashArray: "6 4",
    })
      .addTo(rangeMap)
      .bindTooltip("Approximate clouded leopard range", {
        className: "range-label",
        sticky: true,
      });

    const rangePoints = [
      { name: "Nepal", coords: [27.7, 85.3] },
      { name: "Bhutan", coords: [27.5, 90.4] },
      { name: "Northeast India", coords: [26.0, 92.9] },
      { name: "Bangladesh", coords: [24.1, 90.4] },
      { name: "Myanmar", coords: [20.8, 96.0] },
      { name: "Thailand", coords: [16.2, 100.7] },
      { name: "Laos", coords: [18.2, 103.8] },
      { name: "Vietnam", coords: [16.4, 107.6] },
      { name: "Cambodia", coords: [12.8, 104.9] },
      { name: "Malaysia", coords: [4.3, 102.2] },
      { name: "Southern China", coords: [24.6, 102.2] },
    ];

    rangePoints.forEach((point) => {
      L.circleMarker(point.coords, {
        radius: 5,
        color: "#f5d78d",
        weight: 1.2,
        fillColor: "#d19a43",
        fillOpacity: 0.9,
      })
        .addTo(rangeMap)
        .bindTooltip(point.name, {
          className: "range-label",
          direction: "top",
          offset: [0, -4],
        });
    });

    requestAnimationFrame(() => rangeMap.invalidateSize());
    setTimeout(() => rangeMap.invalidateSize(), 250);
    window.addEventListener("resize", () => rangeMap.invalidateSize());

    if ("IntersectionObserver" in window) {
      const mapVisibilityObserver = new IntersectionObserver(
        (entries, observer) => {
          const isVisible = entries.some((entry) => entry.isIntersecting);
          if (!isVisible) {
            return;
          }
          rangeMap.invalidateSize();
          observer.disconnect();
        },
        { threshold: 0.2 },
      );
      mapVisibilityObserver.observe(mapElement);
    }
  }

  function loadLeafletFromSource(source) {
    return new Promise((resolve, reject) => {
      const leafletScript = document.createElement("script");
      leafletScript.src = source.src;
      leafletScript.crossOrigin = "";
      leafletScript.integrity = source.integrity;
      leafletScript.addEventListener(
        "load",
        () => {
          if (window.L) {
            resolve();
            return;
          }
          reject(
            new Error(`Leaflet loaded from ${source.src} without window.L`),
          );
        },
        { once: true },
      );
      leafletScript.addEventListener(
        "error",
        () => {
          leafletScript.remove();
          reject(new Error(`Failed to load Leaflet from ${source.src}`));
        },
        { once: true },
      );
      document.head.appendChild(leafletScript);
    });
  }

  function loadLeafletStyleFromSource(source) {
    return new Promise((resolve, reject) => {
      const leafletStyle = document.createElement("link");
      leafletStyle.rel = "stylesheet";
      leafletStyle.href = source.href;
      leafletStyle.crossOrigin = "";
      leafletStyle.integrity = source.integrity;
      leafletStyle.addEventListener("load", () => resolve(), { once: true });
      leafletStyle.addEventListener(
        "error",
        () => {
          leafletStyle.remove();
          reject(
            new Error(`Failed to load Leaflet styles from ${source.href}`),
          );
        },
        { once: true },
      );
      document.head.appendChild(leafletStyle);
    });
  }

  async function ensureLeafletStylesLoaded() {
    if (document.querySelector('link[href*="leaflet.css"]')) {
      return;
    }

    if (!leafletStylePromise) {
      leafletStylePromise = (async () => {
        let lastError;

        for (const source of LEAFLET_STYLE_SOURCES) {
          try {
            await loadLeafletStyleFromSource(source);
            return;
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error("Failed to load Leaflet styles.");
      })();
    }

    try {
      await leafletStylePromise;
    } finally {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        leafletStylePromise = undefined;
      }
    }
  }

  async function ensureLeafletLoaded() {
    await ensureLeafletStylesLoaded();

    if (window.L) {
      return;
    }

    if (!leafletLoadPromise) {
      leafletLoadPromise = (async () => {
        let lastError;

        for (const source of LEAFLET_SCRIPT_SOURCES) {
          try {
            await loadLeafletFromSource(source);
            return;
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error("Failed to load Leaflet.");
      })();
    }

    try {
      await leafletLoadPromise;
    } finally {
      if (!window.L) {
        leafletLoadPromise = undefined;
      }
    }
  }

  function renderMapError() {
    if (!mapElement || mapElement.dataset.mapInitialized === "true") {
      return;
    }

    mapElement.classList.add("range-map--error");
    mapElement.innerHTML =
      '<p class="range-map__error">Interactive map unavailable right now.</p>';
  }

  async function ensureLeafletAndInit() {
    if (!mapElement) {
      return;
    }

    try {
      await ensureLeafletLoaded();
      initRangeMap();
    } catch (error) {
      console.error(error);
      renderMapError();
    }
  }

  function bootstrapRangeMapWhenVisible() {
    if (!mapElement || mapElement.dataset.mapBootstrapRequested === "true") {
      return;
    }

    const startBootstrap = () => {
      if (mapElement.dataset.mapBootstrapRequested === "true") {
        return;
      }
      mapElement.dataset.mapBootstrapRequested = "true";
      void ensureLeafletAndInit();
    };

    if (!("IntersectionObserver" in window)) {
      startBootstrap();
      return;
    }

    const bootstrapObserver = new IntersectionObserver(
      (entries, observer) => {
        const isNearViewport = entries.some((entry) => entry.isIntersecting);
        if (!isNearViewport) {
          return;
        }
        observer.disconnect();
        startBootstrap();
      },
      {
        rootMargin: "350px 0px",
        threshold: 0.01,
      },
    );

    bootstrapObserver.observe(mapElement);
  }

  bootstrapRangeMapWhenVisible();

  if (
    typeof window.gsap === "undefined" ||
    typeof window.ScrollTrigger === "undefined" ||
    typeof window.Lenis === "undefined"
  ) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const hero = document.querySelector(".hero");
  if (hero) {
    gsap.to(".hero__content", {
      y: 80,
      opacity: 0.3,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  gsap.utils.toArray(".section__header").forEach((header) => {
    gsap.from(header, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: header,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".content-block").forEach((block, i) => {
    gsap.from(block, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      delay: i % 2 === 0 ? 0 : 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: block,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });

  const speciesImg = document.querySelector(".species-intro__image");
  const speciesText = document.querySelector(".species-intro__text");

  if (speciesImg) {
    gsap.from(speciesImg, {
      x: -40,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: speciesImg,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }

  if (speciesText) {
    gsap.from(speciesText, {
      x: 40,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: speciesText,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }

  gsap.utils.toArray(".stat-card").forEach((card, i) => {
    gsap.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: i * 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".stat-card__number").forEach((el) => {
    const raw = el.textContent.trim();
    const prefix = raw.match(/^[^0-9]*/)?.[0] || "";
    const suffix = raw.match(/[^0-9]*$/)?.[0] || "";
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);

    if (isNaN(num)) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: num,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix;
      },
    });
  });

  gsap.utils.toArray(".threat-card").forEach((card, i) => {
    gsap.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: i * 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".goal-card").forEach((card, i) => {
    gsap.from(card, {
      y: 25,
      opacity: 0,
      duration: 0.55,
      delay: i * 0.07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".timeline-phase").forEach((phase, i) => {
    gsap.from(phase, {
      x: -30,
      opacity: 0,
      duration: 0.7,
      delay: i * 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: phase,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".funding-table tbody tr").forEach((row, i) => {
    gsap.from(row, {
      y: 15,
      opacity: 0,
      duration: 0.4,
      delay: i * 0.05,
      ease: "power2.out",
      scrollTrigger: {
        trigger: row,
        start: "top 92%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".success-card").forEach((card, i) => {
    gsap.from(card, {
      y: 25,
      opacity: 0,
      duration: 0.55,
      delay: i * 0.07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  const mapImg = document.querySelector(".range-map");
  if (mapImg) {
    gsap.from(mapImg, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      onComplete: () => rangeMapInstance?.invalidateSize(),
      scrollTrigger: {
        trigger: mapImg,
        start: "top 85%",
        toggleActions: "play none none none",
        onEnter: () => rangeMapInstance?.invalidateSize(),
        onRefresh: () => rangeMapInstance?.invalidateSize(),
      },
    });
  }

  gsap.utils.toArray(".range-tag").forEach((tag, i) => {
    gsap.from(tag, {
      y: 10,
      opacity: 0,
      duration: 0.35,
      delay: i * 0.04,
      ease: "power2.out",
      scrollTrigger: {
        trigger: tag,
        start: "top 92%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".sources-list li").forEach((li, i) => {
    gsap.from(li, {
      y: 12,
      opacity: 0,
      duration: 0.4,
      delay: i * 0.05,
      ease: "power2.out",
      scrollTrigger: {
        trigger: li,
        start: "top 92%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".chart-container").forEach((chart) => {
    gsap.from(chart, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: chart,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.utils.toArray(".chart-row").forEach((row) => {
    gsap.from(row, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: row,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -56 });
      }
    });
  });
})();
