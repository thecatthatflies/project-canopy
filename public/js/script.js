(function () {
  "use strict";

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const nav = document.querySelector(".nav");

  ScrollTrigger.create({
    start: "top -80",
    onUpdate: (self) => {
      nav.classList.toggle("scrolled", self.progress > 0);
    },
  });

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
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: mapImg,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }

  const mapElement = document.querySelector("#range-map");
  if (mapElement && window.L) {
    const rangeMap = L.map(mapElement, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([19.5, 98], 4);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(rangeMap);

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
