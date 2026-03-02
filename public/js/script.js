const ambientAudio = document.querySelector("#ambient-audio");
const selectAudio = document.querySelector("#select-audio");
const soundFab = document.querySelector(".sound-fab");
const soundFabIcon = soundFab?.querySelector("i");
const tickItems = Array.from(document.querySelectorAll(".tick-nav__item"));
const scenes = Array.from(document.querySelectorAll(".scene"));
const experienceRoot = document.querySelector("#experience");
const loaderState = document.querySelector("[data-loader-state]");
const loaderBar = document.querySelector("[data-loader-bar]");

const fallbackLayers = {
  back: document.querySelector(".fallback-bg--back"),
  mid: document.querySelector(".fallback-bg--mid"),
  front: document.querySelector(".fallback-bg--front"),
  mist: document.querySelector(".fallback-bg--mist"),
  glow: document.querySelector(".fallback-bg--glow"),
  shadow: document.querySelector(".fallback-bg--shadow"),
};

let hasUnlockedAudio = false;
let lastSelectSoundAt = 0;
let bootFinished = false;

function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setBootProgress(percent, text) {
  if (loaderBar) {
    loaderBar.style.width = `${clampValue(percent, 0, 100)}%`;
  }
  if (loaderState && text) {
    loaderState.textContent = text;
  }
}

async function waitFrames(frameCount = 1) {
  for (let i = 0; i < frameCount; i += 1) {
    // Let the browser paint between heavy initialization stages.
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

function completeBoot(text = "Rainforest loaded.") {
  if (bootFinished) {
    return;
  }

  bootFinished = true;
  setBootProgress(100, text);
  document.body.classList.remove("booting");
  document.body.classList.add("boot-complete");
}

function setActiveTick(id) {
  tickItems.forEach((item) => {
    const href = item.getAttribute("href") || "";
    item.classList.toggle("is-active", href === `#${id}`);
  });
}

function updateSoundUI({ playing, blocked = false }) {
  if (!soundFab || !soundFabIcon) {
    return;
  }

  soundFab.setAttribute("aria-pressed", String(playing));
  soundFabIcon.classList.remove(
    "fa-volume-high",
    "fa-volume-xmark",
    "fa-hand-pointer",
  );

  if (blocked) {
    soundFabIcon.classList.add("fa-hand-pointer");
    return;
  }

  soundFabIcon.classList.add(playing ? "fa-volume-high" : "fa-volume-xmark");
}

async function attemptAmbientPlayback() {
  if (!ambientAudio) {
    return false;
  }

  try {
    await ambientAudio.play();
    hasUnlockedAudio = true;
    document.body.classList.add("audio-ready");
    document.body.classList.remove("audio-locked");
    updateSoundUI({ playing: true });
    return true;
  } catch {
    if (!hasUnlockedAudio) {
      document.body.classList.add("audio-locked");
      updateSoundUI({ playing: false, blocked: true });
    }

    return false;
  }
}

function playSelectSound() {
  if (
    !hasUnlockedAudio ||
    !selectAudio ||
    !ambientAudio ||
    ambientAudio.paused
  ) {
    return;
  }

  const now = performance.now();
  if (now - lastSelectSoundAt < 210) {
    return;
  }

  lastSelectSoundAt = now;

  const click = selectAudio.cloneNode(true);
  click.volume = 0.045;
  click.playbackRate = 0.98 + Math.random() * 0.05;
  click.play().catch(() => {
    /* Ignore browser autoplay blocks for SFX clones. */
  });
}

function initAudio() {
  if (!ambientAudio) {
    return;
  }

  ambientAudio.loop = true;
  ambientAudio.volume = 0.09;

  attemptAmbientPlayback();

  const unlockOnGesture = async () => {
    const started = await attemptAmbientPlayback();

    if (started) {
      window.removeEventListener("pointerdown", unlockOnGesture);
      window.removeEventListener("keydown", unlockOnGesture);
    }
  };

  window.addEventListener("pointerdown", unlockOnGesture, { passive: true });
  window.addEventListener("keydown", unlockOnGesture);

  ambientAudio.addEventListener("play", () => {
    updateSoundUI({ playing: true });
  });

  ambientAudio.addEventListener("pause", () => {
    updateSoundUI({ playing: false });
  });

  soundFab?.addEventListener("click", async () => {
    if (ambientAudio.paused) {
      await attemptAmbientPlayback();
    } else {
      ambientAudio.pause();
      updateSoundUI({ playing: false });
    }
  });
}

function initTickNav() {
  tickItems.forEach((item) => {
    item.addEventListener("pointerenter", playSelectSound);
    item.addEventListener("focus", playSelectSound);

    item.addEventListener("click", () => {
      const target = (item.getAttribute("href") || "").replace("#", "");

      if (target) {
        setActiveTick(target);
      }
    });
  });

  if (scenes[0]?.id) {
    setActiveTick(scenes[0].id);
  }
}

function initMotion() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const { gsap, ScrollTrigger, Lenis } = window;

  if (!gsap || !ScrollTrigger || reduceMotion) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (Lenis) {
    const lenis = new Lenis({
      duration: 1,
      smoothWheel: true,
      wheelMultiplier: 0.82,
      touchMultiplier: 0.88,
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  scenes.forEach((scene) => {
    const copy = scene.querySelector(".scene__copy");

    if (copy) {
      gsap.from(copy, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: scene,
          start: "top 72%",
          once: true,
        },
      });
    }

    ScrollTrigger.create({
      trigger: scene,
      start: "top center",
      end: "bottom center",
      onEnter: () => setActiveTick(scene.id),
      onEnterBack: () => setActiveTick(scene.id),
    });
  });

  const parallaxConfig = [
    [fallbackLayers.back, -4, 0.62],
    [fallbackLayers.mid, -8, 0.7],
    [fallbackLayers.front, -12, 0.82],
    [fallbackLayers.mist, -7, 0.72],
    [fallbackLayers.glow, -3, 0.6],
    [fallbackLayers.shadow, -2, 0.58],
  ];

  parallaxConfig.forEach(([node, yPercent, scrub]) => {
    if (!node) {
      return;
    }

    gsap.to(node, {
      yPercent,
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub,
      },
    });
  });
}

async function loadThreeLibrary() {
  if (window.THREE) {
    return window.THREE;
  }

  try {
    const mod = await import("/vendor/three/build/three.module.min.js");
    window.THREE = mod;
    return mod;
  } catch {
    return null;
  }
}

function getQualityProfile() {
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const low = reduceMotion || coarsePointer || cores <= 4 || memory <= 4;
  const medium = !low && (cores <= 8 || memory <= 8);

  if (low) {
    return {
      label: "low",
      antialias: false,
      dprCap: 1,
      frameRate: 38,
      segmentCount: 14,
      terrainWidthSegments: 72,
      terrainDepthSegments: 180,
      forestWidth: 170,
      treeCount: 330,
      palmCount: 90,
      fernCount: 180,
      broadleafCount: 110,
      rockCount: 80,
      logCount: 36,
      vineCount: 60,
      puddleCount: 22,
      particleCount: 150,
      mistCount: 14,
      fogDensity: 0.0056,
      cameraCurve: 5.2,
    };
  }

  if (medium) {
    return {
      label: "medium",
      antialias: true,
      dprCap: 1.2,
      frameRate: 48,
      segmentCount: 18,
      terrainWidthSegments: 100,
      terrainDepthSegments: 260,
      forestWidth: 190,
      treeCount: 560,
      palmCount: 160,
      fernCount: 300,
      broadleafCount: 210,
      rockCount: 130,
      logCount: 64,
      vineCount: 96,
      puddleCount: 34,
      particleCount: 240,
      mistCount: 24,
      fogDensity: 0.0048,
      cameraCurve: 6.8,
    };
  }

  return {
    label: "high",
    antialias: true,
    dprCap: 1.35,
    frameRate: 56,
    segmentCount: 22,
    terrainWidthSegments: 136,
    terrainDepthSegments: 340,
    forestWidth: 208,
    treeCount: 780,
    palmCount: 230,
    fernCount: 430,
    broadleafCount: 320,
    rockCount: 180,
    logCount: 96,
    vineCount: 132,
    puddleCount: 46,
    particleCount: 340,
    mistCount: 34,
    fogDensity: 0.0042,
    cameraCurve: 8.2,
  };
}

async function initWebGL() {
  setBootProgress(5, "Loading 3D engine...");
  await waitFrames();

  if (!experienceRoot) {
    completeBoot("Environment ready.");
    return;
  }

  const THREE = await loadThreeLibrary();
  if (!THREE) {
    completeBoot("WebGL unavailable. Showing fallback.");
    return;
  }

  setBootProgress(14, "Selecting quality profile...");
  await waitFrames();

  const quality = getQualityProfile();
  document.body.dataset.quality = quality.label;

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: quality.antialias,
      alpha: true,
      powerPreference:
        quality.label === "low" ? "low-power" : "high-performance",
    });
  } catch {
    completeBoot("Unable to start 3D renderer. Showing fallback.");
    return;
  }

  setBootProgress(24, "Starting renderer...");
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = quality.label === "high" ? 1.31 : 1.24;
  experienceRoot.appendChild(renderer.domElement);
  document.body.classList.add("webgl-live");
  await waitFrames();

  setBootProgress(34, "Building lighting and atmosphere...");
  const scene3d = new THREE.Scene();
  scene3d.fog = new THREE.FogExp2(0xb3c7d3, quality.fogDensity);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.1,
    2800,
  );
  camera.position.set(0, 2, 8);

  const hemiLight = new THREE.HemisphereLight(0xebf4ff, 0x7a6b58, 1.36);
  scene3d.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffefc3, 1.62);
  sunLight.position.set(38, 72, 14);
  scene3d.add(sunLight);

  const canopyFill = new THREE.DirectionalLight(0xc8d9ed, 0.52);
  canopyFill.position.set(-28, 22, -30);
  scene3d.add(canopyFill);

  const skyBounce = new THREE.PointLight(0xffe0a8, 0.62, 620, 2);
  skyBounce.position.set(0, 18, -160);
  scene3d.add(skyBounce);

  const skyGeo = new THREE.SphereGeometry(850, 24, 14);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0xa7cdef) },
      midColor: { value: new THREE.Color(0xc9ddd1) },
      bottomColor: { value: new THREE.Color(0x7c8168) },
      glowColor: { value: new THREE.Color(0xffe9b7) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform vec3 glowColor;
      void main() {
        float h = clamp(normalize(vWorldPos).y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.45, h));
        col = mix(col, topColor, smoothstep(0.42, 1.0, h));
        float lightGlow = smoothstep(0.72, 0.97, h) * 0.3;
        col += glowColor * lightGlow;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene3d.add(new THREE.Mesh(skyGeo, skyMat));
  await waitFrames();

  setBootProgress(46, "Generating rainforest terrain...");
  const segmentCount = quality.segmentCount;
  const segmentLength = 92;
  const travelDepth = segmentCount * segmentLength;
  const rainforestDepth = travelDepth + 340;
  const groundOffsetZ = -rainforestDepth * 0.5;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getTerrainHeight(x, zWorld) {
    const ridge = Math.sin(x * 0.07 + zWorld * 0.015) * 1.4;
    const valley = Math.cos(zWorld * 0.02) * 1.05;
    const knolls = Math.sin((x - zWorld) * 0.032) * 0.82;
    const micro = Math.sin(x * 0.25 + zWorld * 0.17) * 0.17;
    return -3.05 + ridge + valley + knolls + micro;
  }

  const routePoints = [];
  for (let i = 0; i <= segmentCount; i += 1) {
    const z = -i * segmentLength;
    const x =
      Math.sin(i * 0.6) * quality.cameraCurve +
      Math.sin(i * 0.19) * 2.2 +
      (Math.random() - 0.5) * 1.8;
    const y = getTerrainHeight(x, z) + 2.45 + Math.sin(i * 0.44) * 0.4;
    routePoints.push(new THREE.Vector3(x, y, z));
  }

  const routeCurve = new THREE.CatmullRomCurve3(
    routePoints,
    false,
    "catmullrom",
    0.34,
  );

  function centerXAtZ(z) {
    const t = clamp((-z + 24) / travelDepth, 0.001, 0.999);
    return routeCurve.getPointAt(t).x;
  }

  function sampleForestSpot(clearance = 4.5) {
    for (let tries = 0; tries < 8; tries += 1) {
      const z = -(Math.random() * (travelDepth + 120));
      const x = (Math.random() - 0.5) * quality.forestWidth;
      const centerX = centerXAtZ(z);
      if (Math.abs(x - centerX) > clearance + Math.random() * 1.5) {
        return { x, z, y: getTerrainHeight(x, z) };
      }
    }

    const z = -(Math.random() * (travelDepth + 120));
    const centerX = centerXAtZ(z);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const x = centerX + direction * (clearance + 2 + Math.random() * 3);
    return { x, z, y: getTerrainHeight(x, z) };
  }

  const groundGeo = new THREE.PlaneGeometry(
    quality.forestWidth + 64,
    rainforestDepth,
    quality.terrainWidthSegments,
    quality.terrainDepthSegments,
  );
  const groundPos = groundGeo.attributes.position;
  for (let i = 0; i < groundPos.count; i += 1) {
    const x = groundPos.getX(i);
    const zWorld = groundPos.getY(i) + groundOffsetZ;
    groundPos.setZ(i, getTerrainHeight(x, zWorld));
  }
  groundGeo.computeVertexNormals();
  const groundColors = new Float32Array(groundPos.count * 3);
  const groundColor = new THREE.Color();
  const mossColor = new THREE.Color();
  for (let i = 0; i < groundPos.count; i += 1) {
    const x = groundPos.getX(i);
    const zWorld = groundPos.getY(i) + groundOffsetZ;
    const y = groundPos.getZ(i);
    const damp = Math.sin(x * 0.043 + zWorld * 0.027) * 0.5 + 0.5;
    const ridge = clamp((y + 3.5) / 4.9, 0, 1);
    groundColor.setHSL(
      0.065 + damp * 0.038 - ridge * 0.012,
      0.3 + damp * 0.12 - ridge * 0.08,
      0.11 + damp * 0.09 + ridge * 0.05,
    );
    mossColor.setHSL(
      0.28 - ridge * 0.04,
      0.25 + damp * 0.08,
      0.12 + damp * 0.05,
    );
    const mossMix = clamp((damp - 0.56) * 1.8, 0, 0.46);
    groundColor.lerp(mossColor, mossMix);
    const idx = i * 3;
    groundColors[idx] = groundColor.r;
    groundColors[idx + 1] = groundColor.g;
    groundColors[idx + 2] = groundColor.b;
  }
  groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));

  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.01,
      vertexColors: true,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, groundOffsetZ);
  scene3d.add(ground);

  const understoryTint = new THREE.Mesh(
    new THREE.PlaneGeometry(quality.forestWidth + 44, rainforestDepth),
    new THREE.MeshStandardMaterial({
      color: 0x4d5a40,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );
  understoryTint.rotation.x = -Math.PI / 2;
  understoryTint.position.set(0, -2.48, groundOffsetZ);
  scene3d.add(understoryTint);
  await waitFrames();

  setBootProgress(62, "Planting canopy and palms...");
  const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.42, 8.4, 7);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b3f2d,
    roughness: 0.98,
    metalness: 0.01,
    flatShading: true,
    vertexColors: true,
  });

  const canopyGeometryA = new THREE.IcosahedronGeometry(2.45, 0);
  const canopyGeometryB = new THREE.IcosahedronGeometry(1.7, 0);
  const canopyMaterialA = new THREE.MeshStandardMaterial({
    color: 0x5f8651,
    roughness: 0.84,
    metalness: 0.02,
    flatShading: true,
    vertexColors: true,
  });
  const canopyMaterialB = new THREE.MeshStandardMaterial({
    color: 0x7b9d65,
    roughness: 0.82,
    metalness: 0.01,
    flatShading: true,
    vertexColors: true,
  });

  const trunks = new THREE.InstancedMesh(
    trunkGeometry,
    trunkMaterial,
    quality.treeCount,
  );
  const canopyA = new THREE.InstancedMesh(
    canopyGeometryA,
    canopyMaterialA,
    quality.treeCount,
  );
  const canopyB = new THREE.InstancedMesh(
    canopyGeometryB,
    canopyMaterialB,
    quality.treeCount,
  );
  trunks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  canopyA.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  canopyB.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const trunkColor = new THREE.Color();
  const leafColorA = new THREE.Color();
  const leafColorB = new THREE.Color();
  const dummy = new THREE.Object3D();

  for (let i = 0; i < quality.treeCount; i += 1) {
    const spot = sampleForestSpot(4.3);
    const scale = 0.82 + Math.random() * 1.95;
    const yaw = Math.random() * Math.PI;
    const hueShift = (Math.random() - 0.5) * 0.12;

    dummy.position.set(spot.x, spot.y + scale * 2.45, spot.z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(0.48 * scale, 1.55 * scale, 0.48 * scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    trunkColor.setHSL(0.08 + hueShift * 0.22, 0.33, 0.16 + Math.random() * 0.1);
    trunks.setColorAt(i, trunkColor);

    dummy.position.set(spot.x, spot.y + scale * 7.6, spot.z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(scale, scale * 0.9, scale);
    dummy.updateMatrix();
    canopyA.setMatrixAt(i, dummy.matrix);
    leafColorA.setHSL(
      0.26 + hueShift * 0.8,
      0.28 + Math.random() * 0.16,
      0.29 + Math.random() * 0.15,
    );
    canopyA.setColorAt(i, leafColorA);

    dummy.position.set(spot.x, spot.y + scale * 9.8, spot.z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(scale * 0.85, scale * 0.72, scale * 0.85);
    dummy.updateMatrix();
    canopyB.setMatrixAt(i, dummy.matrix);
    leafColorB.setHSL(
      0.21 + hueShift * 0.7,
      0.24 + Math.random() * 0.18,
      0.34 + Math.random() * 0.15,
    );
    canopyB.setColorAt(i, leafColorB);
  }

  trunks.instanceMatrix.needsUpdate = true;
  canopyA.instanceMatrix.needsUpdate = true;
  canopyB.instanceMatrix.needsUpdate = true;
  if (trunks.instanceColor) {
    trunks.instanceColor.needsUpdate = true;
  }
  if (canopyA.instanceColor) {
    canopyA.instanceColor.needsUpdate = true;
  }
  if (canopyB.instanceColor) {
    canopyB.instanceColor.needsUpdate = true;
  }
  scene3d.add(trunks);
  scene3d.add(canopyA);
  scene3d.add(canopyB);

  const palmTrunkGeo = new THREE.CylinderGeometry(0.12, 0.24, 7.2, 6);
  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x694b37,
    roughness: 0.94,
    metalness: 0.01,
    flatShading: true,
  });
  const palmCrownGeo = new THREE.ConeGeometry(2.8, 4.8, 6, 1);
  const palmCrownMat = new THREE.MeshStandardMaterial({
    color: 0x7ca16a,
    roughness: 0.78,
    metalness: 0.01,
    flatShading: true,
    vertexColors: true,
  });
  const palmTrunks = new THREE.InstancedMesh(
    palmTrunkGeo,
    palmTrunkMat,
    quality.palmCount,
  );
  const palmCrowns = new THREE.InstancedMesh(
    palmCrownGeo,
    palmCrownMat,
    quality.palmCount,
  );
  palmTrunks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  palmCrowns.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const palmLeafColor = new THREE.Color();
  for (let i = 0; i < quality.palmCount; i += 1) {
    const spot = sampleForestSpot(3.2);
    const scale = 0.7 + Math.random() * 1.2;
    const yaw = Math.random() * Math.PI;
    dummy.position.set(spot.x, spot.y + scale * 2.1, spot.z);
    dummy.rotation.set(
      0.08 + Math.random() * 0.1,
      yaw,
      0.08 + Math.random() * 0.1,
    );
    dummy.scale.set(scale * 0.6, scale * 1.35, scale * 0.6);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(spot.x, spot.y + scale * 6.5, spot.z);
    dummy.rotation.set(Math.PI, yaw, 0);
    dummy.scale.set(scale, scale * 0.58, scale);
    dummy.updateMatrix();
    palmCrowns.setMatrixAt(i, dummy.matrix);
    palmLeafColor.setHSL(
      0.22 + Math.random() * 0.12,
      0.3 + Math.random() * 0.2,
      0.34 + Math.random() * 0.14,
    );
    palmCrowns.setColorAt(i, palmLeafColor);
  }
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  if (palmCrowns.instanceColor) {
    palmCrowns.instanceColor.needsUpdate = true;
  }
  scene3d.add(palmTrunks);
  scene3d.add(palmCrowns);
  await waitFrames();

  setBootProgress(78, "Growing understory...");
  const fernGeo = new THREE.DodecahedronGeometry(1, 0);
  const fernMat = new THREE.MeshStandardMaterial({
    color: 0x779868,
    roughness: 0.86,
    metalness: 0.03,
    flatShading: true,
    vertexColors: true,
  });
  const ferns = new THREE.InstancedMesh(fernGeo, fernMat, quality.fernCount);
  ferns.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const fernColor = new THREE.Color();
  for (let i = 0; i < quality.fernCount; i += 1) {
    const spot = sampleForestSpot(2.2);
    const scale = 0.34 + Math.random() * 1.2;
    dummy.position.set(spot.x, spot.y + 0.34, spot.z);
    dummy.rotation.set(
      Math.random() * 0.24,
      Math.random() * Math.PI,
      Math.random() * 0.24,
    );
    dummy.scale.set(scale, scale * 0.56, scale);
    dummy.updateMatrix();
    ferns.setMatrixAt(i, dummy.matrix);
    fernColor.setHSL(
      0.2 + Math.random() * 0.14,
      0.26 + Math.random() * 0.22,
      0.32 + Math.random() * 0.16,
    );
    ferns.setColorAt(i, fernColor);
  }
  ferns.instanceMatrix.needsUpdate = true;
  if (ferns.instanceColor) {
    ferns.instanceColor.needsUpdate = true;
  }
  scene3d.add(ferns);

  const broadleafGeo = new THREE.ConeGeometry(0.48, 1.8, 5, 1);
  const broadleafMat = new THREE.MeshStandardMaterial({
    color: 0x8da466,
    roughness: 0.79,
    metalness: 0.01,
    flatShading: true,
    vertexColors: true,
  });
  const broadleaf = new THREE.InstancedMesh(
    broadleafGeo,
    broadleafMat,
    quality.broadleafCount,
  );
  broadleaf.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const broadleafColor = new THREE.Color();
  for (let i = 0; i < quality.broadleafCount; i += 1) {
    const spot = sampleForestSpot(1.9);
    const scale = 0.6 + Math.random() * 1.7;
    dummy.position.set(spot.x, spot.y + 0.28 + Math.random() * 0.22, spot.z);
    dummy.rotation.set(
      -Math.PI * 0.5 + (Math.random() - 0.5) * 0.35,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.35,
    );
    dummy.scale.set(scale * 0.65, scale, scale * 0.52);
    dummy.updateMatrix();
    broadleaf.setMatrixAt(i, dummy.matrix);
    broadleafColor.setHSL(
      0.17 + Math.random() * 0.18,
      0.26 + Math.random() * 0.24,
      0.35 + Math.random() * 0.18,
    );
    broadleaf.setColorAt(i, broadleafColor);
  }
  broadleaf.instanceMatrix.needsUpdate = true;
  if (broadleaf.instanceColor) {
    broadleaf.instanceColor.needsUpdate = true;
  }
  scene3d.add(broadleaf);

  const bloomCount = Math.max(22, Math.floor(quality.broadleafCount * 0.22));
  const bloomGeo = new THREE.TetrahedronGeometry(0.15, 0);
  const bloomMat = new THREE.MeshStandardMaterial({
    color: 0xff8467,
    roughness: 0.68,
    metalness: 0.01,
    flatShading: true,
    emissive: 0x2f1209,
    emissiveIntensity: 0.12,
    vertexColors: true,
  });
  const blooms = new THREE.InstancedMesh(bloomGeo, bloomMat, bloomCount);
  blooms.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const bloomColor = new THREE.Color();
  for (let i = 0; i < bloomCount; i += 1) {
    const spot = sampleForestSpot(1.2);
    const s = 0.42 + Math.random() * 0.95;
    dummy.position.set(spot.x, spot.y + 0.24 + Math.random() * 0.82, spot.z);
    dummy.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    );
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.4), s);
    dummy.updateMatrix();
    blooms.setMatrixAt(i, dummy.matrix);
    bloomColor.setHSL(
      0.01 + Math.random() * 0.14,
      0.62 + Math.random() * 0.22,
      0.5 + Math.random() * 0.12,
    );
    blooms.setColorAt(i, bloomColor);
  }
  blooms.instanceMatrix.needsUpdate = true;
  if (blooms.instanceColor) {
    blooms.instanceColor.needsUpdate = true;
  }
  scene3d.add(blooms);

  const rockGeo = new THREE.IcosahedronGeometry(0.72, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x5e6458,
    roughness: 0.98,
    metalness: 0.01,
    flatShading: true,
  });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, quality.rockCount);
  rocks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  for (let i = 0; i < quality.rockCount; i += 1) {
    const spot = sampleForestSpot(1.4);
    const s = 0.36 + Math.random() * 1.55;
    dummy.position.set(spot.x, spot.y + 0.16, spot.z);
    dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    dummy.scale.set(s, s * (0.6 + Math.random() * 0.34), s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  scene3d.add(rocks);

  const logGeo = new THREE.CylinderGeometry(0.14, 0.24, 5.6, 6);
  const logMat = new THREE.MeshStandardMaterial({
    color: 0x6a4a35,
    roughness: 0.96,
    metalness: 0.01,
    flatShading: true,
  });
  const logs = new THREE.InstancedMesh(logGeo, logMat, quality.logCount);
  logs.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  for (let i = 0; i < quality.logCount; i += 1) {
    const spot = sampleForestSpot(1.8);
    const s = 0.66 + Math.random() * 1.25;
    dummy.position.set(spot.x, spot.y + 0.3, spot.z);
    dummy.rotation.set(
      (Math.random() - 0.5) * 0.2,
      Math.random() * Math.PI,
      Math.PI * 0.5 + (Math.random() - 0.5) * 0.18,
    );
    dummy.scale.set(s, s * 0.9, s);
    dummy.updateMatrix();
    logs.setMatrixAt(i, dummy.matrix);
  }
  logs.instanceMatrix.needsUpdate = true;
  scene3d.add(logs);
  await waitFrames();

  setBootProgress(90, "Adding water, vines, and atmosphere...");
  const puddleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x86acb8,
    roughness: 0.15,
    metalness: 0.15,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.5,
  });
  const puddleGeometry = new THREE.CircleGeometry(1, 14);
  const puddleGroup = new THREE.Group();
  for (let i = 0; i < quality.puddleCount; i += 1) {
    const spot = sampleForestSpot(0.8);
    const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
    const sx = 0.7 + Math.random() * 2.4;
    const sy = 0.45 + Math.random() * 1.2;
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = Math.random() * Math.PI;
    puddle.scale.set(sx, sy, 1);
    puddle.position.set(spot.x, spot.y + 0.02, spot.z);
    puddleGroup.add(puddle);
  }
  scene3d.add(puddleGroup);

  const vineVertices = [];
  const vineColors = [];
  const vineColorTop = new THREE.Color(0x808f62);
  const vineColorBottom = new THREE.Color(0x5f6a4c);
  for (let i = 0; i < quality.vineCount; i += 1) {
    const z = -(Math.random() * (travelDepth + 110));
    const x = (Math.random() - 0.5) * (quality.forestWidth - 18);
    const topY = getTerrainHeight(x, z) + 11 + Math.random() * 10;
    const bottomY = getTerrainHeight(x + (Math.random() - 0.5) * 1.5, z) + 1.2;
    const midX = x + (Math.random() - 0.5) * 1.9;
    const midZ = z + (Math.random() - 0.5) * 1.2;
    const midY = (topY + bottomY) * 0.5 - 1.2 - Math.random() * 1.5;
    vineVertices.push(
      x,
      topY,
      z,
      midX,
      midY,
      midZ,
      midX,
      midY,
      midZ,
      x,
      bottomY,
      z,
    );
    vineColors.push(
      vineColorTop.r,
      vineColorTop.g,
      vineColorTop.b,
      vineColorBottom.r,
      vineColorBottom.g,
      vineColorBottom.b,
      vineColorBottom.r,
      vineColorBottom.g,
      vineColorBottom.b,
      vineColorTop.r,
      vineColorTop.g,
      vineColorTop.b,
    );
  }
  const vineGeometry = new THREE.BufferGeometry();
  vineGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vineVertices, 3),
  );
  vineGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(vineColors, 3),
  );
  const vineLines = new THREE.LineSegments(
    vineGeometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
    }),
  );
  scene3d.add(vineLines);

  const particleCount = quality.particleCount;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const idx = i * 3;
    particlePositions[idx] = (Math.random() - 0.5) * (quality.forestWidth - 20);
    particlePositions[idx + 1] = 1 + Math.random() * 15;
    particlePositions[idx + 2] = -(Math.random() * (travelDepth + 160));
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0xffe1a8,
      size: quality.label === "high" ? 0.16 : 0.14,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const fireflyGroup = new THREE.Group();
  fireflyGroup.add(particles);
  scene3d.add(fireflyGroup);

  const mistGroup = new THREE.Group();
  const mistSprites = [];
  const mistMaterial = new THREE.SpriteMaterial({
    color: 0xf2f6f8,
    transparent: true,
    opacity: quality.label === "high" ? 0.08 : 0.06,
    depthWrite: false,
  });
  for (let i = 0; i < quality.mistCount; i += 1) {
    const sprite = new THREE.Sprite(mistMaterial);
    const baseX = (Math.random() - 0.5) * (quality.forestWidth - 18);
    const baseZ = -(Math.random() * (travelDepth + 120));
    const baseY = getTerrainHeight(baseX, baseZ) + 3.2 + Math.random() * 8;
    const s = 20 + Math.random() * 28;
    sprite.position.set(baseX, baseY, baseZ);
    sprite.scale.set(s, s * 0.46, 1);
    sprite.userData.baseX = baseX;
    sprite.userData.baseY = baseY;
    sprite.userData.phase = Math.random() * Math.PI * 2;
    sprite.userData.speed = 0.22 + Math.random() * 0.35;
    mistGroup.add(sprite);
    mistSprites.push(sprite);
  }
  scene3d.add(mistGroup);
  await waitFrames();

  const state = {
    progress: 0,
    pointerX: 0,
    pointerY: 0,
    smoothedX: 0,
    smoothedY: 0,
  };

  if (window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: "max",
      scrub: true,
      onUpdate: (self) => {
        state.progress = self.progress;
      },
    });
  } else {
    const updateProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      state.progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
  }

  const pointerLateral = new THREE.Vector3();
  const desiredCamPos = new THREE.Vector3();
  const desiredLookPos = new THREE.Vector3();
  const globalUp = new THREE.Vector3(0, 1, 0);
  let frameIndex = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      state.pointerX = event.clientX / window.innerWidth - 0.5;
      state.pointerY = event.clientY / window.innerHeight - 0.5;
    },
    { passive: true },
  );

  let lastFrame = 0;
  let rafId = 0;

  const renderFrame = (time) => {
    if (document.hidden) {
      rafId = requestAnimationFrame(renderFrame);
      return;
    }

    if (time - lastFrame < 1000 / quality.frameRate) {
      rafId = requestAnimationFrame(renderFrame);
      return;
    }

    lastFrame = time;
    const seconds = time * 0.001;

    state.smoothedX += (state.pointerX - state.smoothedX) * 0.04;
    state.smoothedY += (state.pointerY - state.smoothedY) * 0.04;

    const t = clamp(state.progress, 0.001, 0.996);
    const pathPoint = routeCurve.getPointAt(t);
    const pathAhead = routeCurve.getPointAt(Math.min(0.999, t + 0.012));
    const pathTangent = routeCurve.getTangentAt(t).normalize();
    pointerLateral.crossVectors(globalUp, pathTangent).normalize();
    const bob = Math.sin(seconds * 1.65 + t * 14) * 0.1;

    desiredCamPos.copy(pathPoint);
    desiredCamPos.addScaledVector(pathTangent, -4.5);
    desiredCamPos.addScaledVector(pointerLateral, state.smoothedX * 2.2);
    desiredCamPos.y += 1.7 + bob + state.smoothedY * 0.72;

    desiredLookPos.copy(pathAhead);
    desiredLookPos.addScaledVector(pointerLateral, state.smoothedX * 0.9);
    desiredLookPos.y += 0.62 + state.smoothedY * 0.26;

    camera.position.lerp(desiredCamPos, 0.08);
    camera.lookAt(desiredLookPos);

    fireflyGroup.rotation.y = Math.sin(seconds * 0.12) * 0.06;
    fireflyGroup.position.y = Math.sin(seconds * 0.42) * 0.18;
    particles.material.opacity = 0.54 + Math.sin(seconds * 2.1) * 0.1;

    mistGroup.rotation.y = Math.sin(seconds * 0.05) * 0.08;
    if (frameIndex % 2 === 0) {
      mistSprites.forEach((sprite, i) => {
        sprite.position.x =
          sprite.userData.baseX +
          Math.sin(seconds * sprite.userData.speed + sprite.userData.phase) *
            (0.5 + (i % 3) * 0.2);
        sprite.position.y =
          sprite.userData.baseY +
          Math.cos(
            seconds * (sprite.userData.speed + 0.18) + sprite.userData.phase,
          ) *
            0.32;
      });
    }
    frameIndex += 1;

    skyBounce.position.copy(pathPoint);
    skyBounce.position.y += 10 + Math.sin(seconds * 0.4) * 0.45;

    renderer.render(scene3d, camera);
    rafId = requestAnimationFrame(renderFrame);
  };

  rafId = requestAnimationFrame(renderFrame);
  await waitFrames(2);
  completeBoot("Rainforest loaded.");

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dprCap));
  });

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
  });
}

initAudio();
initTickNav();
initMotion();
initWebGL().catch(() => {
  completeBoot("Unable to finish scene. Showing fallback.");
});
