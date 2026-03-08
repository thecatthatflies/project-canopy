(function () {
  "use strict";

  function waitForChartJs(callback) {
    if (typeof Chart !== "undefined") {
      callback();
      return;
    }
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      if (typeof Chart !== "undefined") {
        clearInterval(interval);
        callback();
      } else if (attempts > 50) {
        clearInterval(interval);
      }
    }, 100);
  }

  var green = {
    dark: "#2d6a4f",
    mid: "#52b788",
    light: "#74c69d",
    pale: "#95d5b2",
    faint: "#d8f3dc",
    gold: "#40916c",
    goldLight: "#52b788",
    warm: "#b7e4c7",
    bg: "#f8f5ef",
    text: "#1a1a18",
    textSoft: "#3f433d",
    textMuted: "#62685e",
    cardBg: "rgba(255,255,255,0.06)",
    gridDark: "rgba(255,255,255,0.08)",
    gridLight: "rgba(0,0,0,0.06)",
  };

  var tooltipStyle = {
    backgroundColor: "rgba(18, 23, 18, 0.92)",
    titleColor: "#f0f2ed",
    bodyColor: "#d9e0d7",
    borderColor: "rgba(77, 143, 102, 0.4)",
    borderWidth: 1,
    cornerRadius: 8,
    padding: 12,
    titleFont: { size: 13, weight: "600" },
    bodyFont: { size: 12 },
    displayColors: true,
    boxPadding: 4,
  };

  function observeAndInit(canvasId, initFn) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (!("IntersectionObserver" in window)) {
      initFn(canvas);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.disconnect();
            initFn(canvas);
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(canvas);
  }

  function initPopulationChart(canvas) {
    new Chart(canvas, {
      type: "line",
      data: {
        labels: ["2000", "2005", "2010", "2015", "2020", "2025 (est.)"],
        datasets: [
          {
            label: "Estimated Wild Population",
            data: [19500, 16800, 14200, 11500, 9800, 8400],
            borderColor: green.mid,
            backgroundColor: function (context) {
              var chart = context.chart;
              var ctx = chart.ctx;
              var area = chart.chartArea;
              if (!area) return green.faint;
              var gradient = ctx.createLinearGradient(
                0,
                area.top,
                0,
                area.bottom,
              );
              gradient.addColorStop(0, "rgba(77, 143, 102, 0.35)");
              gradient.addColorStop(1, "rgba(77, 143, 102, 0.02)");
              return gradient;
            },
            fill: true,
            tension: 0.35,
            pointBackgroundColor: green.mid,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: green.textSoft,
              font: { size: 12, weight: "500" },
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: tooltipStyle,
        },
        scales: {
          x: {
            grid: { color: green.gridLight, drawBorder: false },
            ticks: { color: green.textMuted, font: { size: 11 } },
          },
          y: {
            beginAtZero: false,
            min: 5000,
            max: 22000,
            grid: { color: green.gridLight, drawBorder: false },
            ticks: {
              color: green.textMuted,
              font: { size: 11 },
              callback: function (value) {
                return value.toLocaleString();
              },
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    });
  }

  function initDeforestationChart(canvas) {
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: [
          "2001\u20132005",
          "2006\u20132010",
          "2011\u20132015",
          "2016\u20132020",
          "2021\u20132025",
        ],
        datasets: [
          {
            label: "Tree Cover Loss (million hectares)",
            data: [9.8, 12.4, 15.1, 14.6, 12.2],
            backgroundColor: [
              green.pale,
              green.light,
              green.mid,
              green.dark,
              "rgba(50, 92, 68, 0.7)",
            ],
            borderColor: green.dark,
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: green.textSoft,
              font: { size: 12, weight: "500" },
              usePointStyle: true,
              pointStyle: "rect",
            },
          },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                return context.dataset.label + ": " + context.raw + "M ha";
              },
            },
          }),
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: green.textMuted, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            max: 18,
            grid: { color: green.gridLight, drawBorder: false },
            ticks: {
              color: green.textMuted,
              font: { size: 11 },
              callback: function (value) {
                return value + "M ha";
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
        },
      },
    });
  }

  function initFundingChart(canvas) {
    var labels = [
      "Protected Areas",
      "Ranger Programs",
      "Reforestation",
      "Captive Breeding",
      "Research",
      "Community Programs",
      "Policy & Enforcement",
    ];
    var data = [80, 55, 40, 30, 25, 20, 10];
    var colors = [
      green.dark,
      green.mid,
      green.light,
      green.pale,
      green.gold,
      green.goldLight,
      green.warm,
    ];

    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderColor: "rgba(18, 23, 18, 0.8)",
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#c0c8b8",
              font: { size: 11, weight: "500" },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 14,
            },
          },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                var total = context.dataset.data.reduce(function (a, b) {
                  return a + b;
                }, 0);
                var pct = ((context.raw / total) * 100).toFixed(1);
                return context.label + ": $" + context.raw + "M (" + pct + "%)";
              },
            },
          }),
        },
        animation: {
          animateRotate: true,
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    });
  }

  function initROIChart(canvas) {
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: ["25-Year Program Cost", "Annual Ecosystem Value Preserved"],
        datasets: [
          {
            label: "Value (USD)",
            data: [0.26, 7.5],
            backgroundColor: [green.gold, green.mid],
            borderColor: ["rgba(140,100,31,0.6)", "rgba(50,92,68,0.6)"],
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.55,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: Object.assign({}, tooltipStyle, {
            callbacks: {
              label: function (context) {
                return "$" + context.raw + " billion";
              },
            },
          }),
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 9,
            grid: { color: "rgba(255,255,255,0.06)", drawBorder: false },
            ticks: {
              color: "#8a9280",
              font: { size: 11 },
              callback: function (value) {
                return "$" + value + "B";
              },
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: "#c0c8b8",
              font: { size: 12, weight: "500" },
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    });
  }

  waitForChartJs(function () {
    Chart.defaults.font.family =
      "'Inter', system-ui, -apple-system, sans-serif";

    observeAndInit("populationChart", initPopulationChart);
    observeAndInit("deforestationChart", initDeforestationChart);
    observeAndInit("fundingChart", initFundingChart);
    observeAndInit("roiChart", initROIChart);
  });
})();
