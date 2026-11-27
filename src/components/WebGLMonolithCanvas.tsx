import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ACCENT_SWATCHES,
  isEyeDropperSupported,
  pickColorWithEyeDropper,
} from '../engines/accentEngine';
import { ambientAudio } from '../engines/ambientAudio';
import { tactileAudio } from '../engines/tactileAudio';
import type { AtelierTheme } from '../engines/themeTransition';

interface WebGLMonolithCanvasProps {
  theme: AtelierTheme;
  accentHex: string;
  onAccentChange: (hex: string | null) => void;
  scrollProgressRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  onFpsSample?: (fps: number) => void;
}

const PRESETS = [
  { id: 0, label: 'Prism' },
  { id: 1, label: 'Orbital' },
  { id: 2, label: 'Lattice' },
] as const;

interface HubCoord {
  lat: number;
  lon: number;
}

const GLOBAL_HUBS: HubCoord[] = [
  { lat: 10.8, lon: 106.7 },   // HCMC
  { lat: 1.35, lon: 103.8 },   // Singapore
  { lat: 35.68, lon: 139.69 }, // Tokyo
  { lat: 51.5, lon: -0.12 },   // London
  { lat: 50.11, lon: 8.68 },   // Frankfurt
  { lat: 47.37, lon: 8.54 },   // Zurich
  { lat: 37.77, lon: -122.4 }, // San Francisco
  { lat: 38.9, lon: -77.03 },  // Virginia
  { lat: -33.86, lon: 151.2 }, // Sydney
  { lat: -23.55, lon: -46.6 }, // Sao Paulo
];

const HUB_LINKS: Array<[number, number]> = [
  [0, 2], // HCMC -> Tokyo
  [0, 1], // HCMC -> Singapore
  [1, 4], // Singapore -> Frankfurt
  [2, 6], // Tokyo -> San Francisco
  [3, 7], // London -> Virginia
  [4, 5], // Frankfurt -> Zurich
  [6, 7], // SF -> Virginia
  [0, 8], // HCMC -> Sydney
  [7, 9], // Virginia -> Sao Paulo
  [3, 9], // London -> Sao Paulo
];

const FRESNEL_RIM_VERT = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRESNEL_RIM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  void main() {
    float ndv = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);
    float rim = pow(1.0 - ndv, 3.2);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

function latLonToVec3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createCrispDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.36, 'rgba(255,255,255,0.96)');
    grad.addColorStop(0.64, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createFacetedPrismGeometry(): THREE.BufferGeometry {
  // Architectural emerald-cut diamond octahedron with sharp crisp facets
  const geo = new THREE.OctahedronGeometry(1.04, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const waist = 1.0 - 0.16 * Math.abs(y);
    pos.setXYZ(i, x * waist * 0.92, y * 1.36, z * waist * 0.92);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildLatLonWireframeGeometry(radius: number): THREE.BufferGeometry {
  const points: number[] = [];
  const latBands = [-60, -30, 0, 30, 60];
  const segs = 72;

  for (const lat of latBands) {
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * 360 - 180;
      const a1 = ((i + 1) / segs) * 360 - 180;
      const v0 = latLonToVec3(lat, a0, radius);
      const v1 = latLonToVec3(lat, a1, radius);
      points.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
    }
  }

  for (let lon = -180; lon < 180; lon += 30) {
    for (let i = 0; i < 48; i++) {
      const l0 = -84 + (i / 48) * 168;
      const l1 = -84 + ((i + 1) / 48) * 168;
      const v0 = latLonToVec3(l0, lon, radius);
      const v1 = latLonToVec3(l1, lon, radius);
      points.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

export function WebGLMonolithCanvas({
  theme,
  accentHex,
  onAccentChange,
  scrollProgressRef,
  scrollVelocityRef,
  onFpsSample,
}: WebGLMonolithCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<number>(0);
  const [tunerOpen, setTunerOpen] = useState<boolean>(false);
  const [iridescence, setIridescence] = useState<number>(1.0);
  const [ripple, setRipple] = useState<number>(1.0);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const targetPresetRef = useRef<number>(0);
  const themeRef = useRef<AtelierTheme>(theme);
  const accentHexRef = useRef<string>(accentHex);
  const iridescenceRef = useRef<number>(1.0);
  const rippleRef = useRef<number>(1.0);
  const orbitSpeedRef = useRef<number>(1.0);
  const onFpsSampleRef = useRef(onFpsSample);

  const eyeDropperAvailable = isEyeDropperSupported();

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    accentHexRef.current = accentHex;
  }, [accentHex]);

  useEffect(() => {
    iridescenceRef.current = iridescence;
  }, [iridescence]);

  useEffect(() => {
    rippleRef.current = ripple;
  }, [ripple]);

  useEffect(() => {
    orbitSpeedRef.current = orbitSpeed;
  }, [orbitSpeed]);

  useEffect(() => {
    onFpsSampleRef.current = onFpsSample;
  }, [onFpsSample]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let disposed = false;
    let rafId = 0;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = null;
    }

    // Crisp geometric Canvas2D fallback if WebGL is unavailable
    if (!renderer) {
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.replaceChildren();
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      let t = 0;

      const drawFallback = () => {
        if (disposed || !ctx) return;
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        t += 0.016 * orbitSpeedRef.current;
        const paper = themeRef.current === 'paper';
        ctx.clearRect(0, 0, w, h);

        const cx = w * 0.5;
        const cy = h * 0.5;
        const r = Math.min(w, h) * 0.26;

        ctx.strokeStyle = paper ? 'rgba(17,17,19,0.16)' : 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = accentHexRef.current;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const ang = t + (i / 6) * Math.PI * 2;
          const x = cx + Math.cos(ang) * r * 0.9;
          const y = cy + Math.sin(ang) * r * 1.15;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        rafId = requestAnimationFrame(drawFallback);
      };

      rafId = requestAnimationFrame(drawFallback);
      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
      };
    }

    // Studio Renderer Configuration
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.replaceChildren();
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0.18, 6.85);
    camera.lookAt(0, 0, 0);

    // Subtle Studio HDRI for sharp metallic & sapphire reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.045);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    // Precision 3-Point Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.24);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4.5, 6.4, 5.2);
    scene.add(keyLight);

    const coolRimLight = new THREE.DirectionalLight(0xb8dcff, 1.35);
    coolRimLight.position.set(-5.2, 3.6, 3.8);
    scene.add(coolRimLight);

    const accentRimLight = new THREE.PointLight(new THREE.Color(accentHexRef.current), 18, 16, 1.5);
    accentRimLight.position.set(-3.2, -2.1, -2.4);
    scene.add(accentRimLight);

    const topAccentLight = new THREE.PointLight(new THREE.Color(accentHexRef.current), 11, 14, 1.6);
    topAccentLight.position.set(2.8, 3.4, -2.0);
    scene.add(topAccentLight);

    const dotTexture = createCrispDotTexture();
    textures.push(dotTexture);

    const masterPivot = new THREE.Group();
    scene.add(masterPivot);

    // Shared CNC Titanium & Glowing Accent Jewel Materials
    const titaniumMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#b8c2d4'),
        metalness: 0.95,
        roughness: 0.14,
        envMapIntensity: 1.85,
      })
    );
    const accentMetalMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentHexRef.current),
        emissive: new THREE.Color(accentHexRef.current),
        emissiveIntensity: 0.85,
        metalness: 0.72,
        roughness: 0.16,
      })
    );

    // =========================================================================
    // PRESET 0 — PRISM: Smoked Obsidian-Sapphire Diamond + CNC Titanium Astrolabe
    // =========================================================================
    const prismGroup = new THREE.Group();
    masterPivot.add(prismGroup);

    const crystalGeo = trackGeo(createFacetedPrismGeometry());
    const crystalMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#131c2e'),
        attenuationColor: new THREE.Color(accentHexRef.current),
        attenuationDistance: 1.85,
        metalness: 0.24,
        roughness: 0.06,
        transmission: 0.56,
        ior: 1.86,
        thickness: 1.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        iridescence: 0.82,
        iridescenceIOR: 1.52,
        iridescenceThicknessRange: [160, 520],
        envMapIntensity: 1.75,
        flatShading: true,
        transparent: true,
        opacity: 0.92,
      })
    );
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    prismGroup.add(crystalMesh);

    // Razor-sharp crystalline bevel highlights
    const crystalEdgesGeo = trackGeo(new THREE.EdgesGeometry(crystalGeo, 1));
    const crystalEdgesMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#e2e8f0'),
        transparent: true,
        opacity: 0.52,
      })
    );
    crystalMesh.add(new THREE.LineSegments(crystalEdgesGeo, crystalEdgesMat));

    // Inner glowing faceted jewel core
    const innerCoreGeo = trackGeo(new THREE.OctahedronGeometry(0.42, 0));
    const innerCoreMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(accentHexRef.current),
        emissive: new THREE.Color(accentHexRef.current),
        emissiveIntensity: 1.25,
        metalness: 0.65,
        roughness: 0.12,
        clearcoat: 1.0,
        flatShading: true,
      })
    );
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCoreMesh.scale.set(0.92, 1.32, 0.92);
    prismGroup.add(innerCoreMesh);

    const innerCoreEdgesGeo = trackGeo(new THREE.EdgesGeometry(innerCoreGeo, 1));
    const innerCoreEdgesMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.82,
      })
    );
    innerCoreMesh.add(new THREE.LineSegments(innerCoreEdgesGeo, innerCoreEdgesMat));

    // CNC Titanium Ring A (Swiss Watch Degree Bezel)
    const ringGroupOuter = new THREE.Group();
    const outerRingGeo = trackGeo(new THREE.TorusGeometry(1.66, 0.013, 16, 128));
    ringGroupOuter.add(new THREE.Mesh(outerRingGeo, titaniumMat));

    const tickGeo = trackGeo(new THREE.BoxGeometry(0.01, 0.072, 0.01));
    const tickInstanced = new THREE.InstancedMesh(tickGeo, titaniumMat, 36);
    const tickDummy = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2;
      const major = i % 3 === 0;
      tickDummy.position.set(Math.cos(ang) * 1.66, Math.sin(ang) * 1.66, 0);
      tickDummy.rotation.set(0, 0, ang - Math.PI / 2);
      tickDummy.scale.set(major ? 1.45 : 0.85, major ? 1.5 : 0.8, major ? 1.45 : 0.85);
      tickDummy.updateMatrix();
      tickInstanced.setMatrixAt(i, tickDummy.matrix);
    }
    tickInstanced.instanceMatrix.needsUpdate = true;
    ringGroupOuter.add(tickInstanced);
    ringGroupOuter.rotation.set(Math.PI * 0.34, Math.PI * 0.12, 0);
    prismGroup.add(ringGroupOuter);

    // CNC Ring B (Inclined Gimbal + 4 Cardinal Sapphire Nodes)
    const ringGroupInner = new THREE.Group();
    const innerRingGeo = trackGeo(new THREE.TorusGeometry(1.38, 0.009, 16, 120));
    ringGroupInner.add(new THREE.Mesh(innerRingGeo, titaniumMat));

    const nodeDiamondGeo = trackGeo(new THREE.OctahedronGeometry(0.052, 0));
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const node = new THREE.Mesh(nodeDiamondGeo, accentMetalMat);
      node.position.set(Math.cos(ang) * 1.38, Math.sin(ang) * 1.38, 0);
      ringGroupInner.add(node);
    }
    ringGroupInner.rotation.set(-Math.PI * 0.28, Math.PI * 0.36, 0.2);
    prismGroup.add(ringGroupInner);

    // Hairline Equatorial Orbital Ring C
    const ringCGeo = trackGeo(new THREE.TorusGeometry(1.94, 0.004, 10, 144));
    const ringCMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHexRef.current),
        transparent: true,
        opacity: 0.42,
      })
    );
    const ringCMesh = new THREE.Mesh(ringCGeo, ringCMat);
    ringCMesh.rotation.set(Math.PI * 0.44, -Math.PI * 0.08, 0);
    prismGroup.add(ringCMesh);

    // Photonic Orbital Stardust Pinpricks
    const prismStarCount = 480;
    const prismStarPositions = new Float32Array(prismStarCount * 3);
    const prismStarBasePositions = new Float32Array(prismStarCount * 3);
    for (let i = 0; i < prismStarCount; i++) {
      const u = (i * 0.61803398875) % 1;
      const ang = i * 2.3999632;
      const rad = 1.5 + (u - 0.5) * 0.92;
      const elev = Math.sin(i * 1.73) * 0.2 * (1.0 - Math.abs(u - 0.5));
      const x = Math.cos(ang) * rad;
      const y = elev;
      const z = Math.sin(ang) * rad;
      prismStarPositions[i * 3] = x;
      prismStarPositions[i * 3 + 1] = y;
      prismStarPositions[i * 3 + 2] = z;
      prismStarBasePositions[i * 3] = x;
      prismStarBasePositions[i * 3 + 1] = y;
      prismStarBasePositions[i * 3 + 2] = z;
    }
    const prismStarGeo = trackGeo(new THREE.BufferGeometry());
    prismStarGeo.setAttribute('position', new THREE.BufferAttribute(prismStarPositions, 3));
    const prismStarMat = trackMat(
      new THREE.PointsMaterial({
        size: 0.038,
        map: dotTexture,
        color: new THREE.Color('#e2e8f0'),
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const prismStars = new THREE.Points(prismStarGeo, prismStarMat);
    prismStars.rotation.set(0.32, 0, -0.22);
    prismGroup.add(prismStars);

    // =========================================================================
    // PRESET 1 — ORBITAL: Stripe/Linear Matte Obsidian Globe + Fresnel Rim + Arcs
    // =========================================================================
    const orbitalGroup = new THREE.Group();
    orbitalGroup.visible = false;
    masterPivot.add(orbitalGroup);

    const globeRadius = 1.3;

    // Matte-satin obsidian core (envMapIntensity low so ZERO ugly white softbox squares!)
    const globeCoreGeo = trackGeo(new THREE.SphereGeometry(globeRadius * 0.968, 56, 56));
    const globeCoreMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#090d16'),
        metalness: 0.12,
        roughness: 0.82,
        envMapIntensity: 0.14,
      })
    );
    orbitalGroup.add(new THREE.Mesh(globeCoreGeo, globeCoreMat));

    // Crisp Fresnel Atmospheric Edge Glow (Accent Colored, Razor-Clean Horizon)
    const fresnelGeo = trackGeo(new THREE.SphereGeometry(globeRadius * 1.008, 56, 56));
    const fresnelMat = trackMat(
      new THREE.ShaderMaterial({
        vertexShader: FRESNEL_RIM_VERT,
        fragmentShader: FRESNEL_RIM_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(accentHexRef.current) },
          uIntensity: { value: 0.78 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    orbitalGroup.add(new THREE.Mesh(fresnelGeo, fresnelMat));

    // Crisp Lat/Lon Architectural Wireframe Grid
    const gridGeo = trackGeo(buildLatLonWireframeGeometry(globeRadius * 0.985));
    const gridMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#94a3b8'),
        transparent: true,
        opacity: 0.18,
      })
    );
    orbitalGroup.add(new THREE.LineSegments(gridGeo, gridMat));

    // 2,200 Golden-Angle Fibonacci Constellation Dots
    const fibCount = 2200;
    const fibPos = new Float32Array(fibCount * 3);
    const fibColors = new Float32Array(fibCount * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < fibCount; i++) {
      const y = 1 - (i / (fibCount - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const cluster =
        Math.sin(x * 3.4 + z * 2.1) * Math.cos(y * 3.8 - x * 1.9) +
        0.45 * Math.cos(z * 5.2 + y * 2.4);
      const isCluster = cluster > 0.04;
      const rPoint = globeRadius * (isCluster ? 1.014 : 1.0);

      fibPos[i * 3] = x * rPoint;
      fibPos[i * 3 + 1] = y * rPoint;
      fibPos[i * 3 + 2] = z * rPoint;

      const brightness = isCluster ? 1.0 : 0.28;
      fibColors[i * 3] = brightness;
      fibColors[i * 3 + 1] = brightness;
      fibColors[i * 3 + 2] = brightness;
    }
    const fibGeo = trackGeo(new THREE.BufferGeometry());
    fibGeo.setAttribute('position', new THREE.BufferAttribute(fibPos, 3));
    fibGeo.setAttribute('color', new THREE.BufferAttribute(fibColors, 3));
    const fibMat = trackMat(
      new THREE.PointsMaterial({
        size: 0.04,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    orbitalGroup.add(new THREE.Points(fibGeo, fibMat));

    // Precision Outer Equatorial Ring around Globe
    const globeHaloGeo = trackGeo(new THREE.TorusGeometry(globeRadius * 1.24, 0.0075, 12, 128));
    const globeHaloMesh = new THREE.Mesh(globeHaloGeo, titaniumMat);
    globeHaloMesh.rotation.set(Math.PI * 0.42, 0.14, 0);
    orbitalGroup.add(globeHaloMesh);

    // 10 Luminous Curved Great-Circle Data Arcs + Racing Photon Packets
    const arcTubeMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHexRef.current),
        transparent: true,
        opacity: 0.65,
      })
    );
    const packetMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
      })
    );
    const packetGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHexRef.current),
        transparent: true,
        opacity: 0.62,
      })
    );

    const arcPackets: Array<{
      curve: THREE.CubicBezierCurve3;
      mesh: THREE.Mesh;
      speed: number;
      phase: number;
    }> = [];

    const packetCoreGeo = trackGeo(new THREE.SphereGeometry(0.026, 10, 10));
    const packetAuraGeo = trackGeo(new THREE.SphereGeometry(0.058, 10, 10));

    for (let idx = 0; idx < HUB_LINKS.length; idx++) {
      const [fromIdx, toIdx] = HUB_LINKS[idx];
      const start = latLonToVec3(GLOBAL_HUBS[fromIdx].lat, GLOBAL_HUBS[fromIdx].lon, globeRadius * 1.015);
      const end = latLonToVec3(GLOBAL_HUBS[toIdx].lat, GLOBAL_HUBS[toIdx].lon, globeRadius * 1.015);
      const dist = start.distanceTo(end);
      const lift = globeRadius + Math.min(0.68, dist * 0.28 + 0.2);

      const ctrl1 = start.clone().lerp(end, 0.3).normalize().multiplyScalar(lift);
      const ctrl2 = start.clone().lerp(end, 0.7).normalize().multiplyScalar(lift);
      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);

      const arcGeo = trackGeo(new THREE.TubeGeometry(curve, 44, 0.007, 6, false));
      orbitalGroup.add(new THREE.Mesh(arcGeo, arcTubeMat));

      const packet = new THREE.Mesh(packetCoreGeo, packetMat);
      packet.add(new THREE.Mesh(packetAuraGeo, packetGlowMat));
      orbitalGroup.add(packet);

      arcPackets.push({
        curve,
        mesh: packet,
        speed: 0.24 + (idx % 4) * 0.065,
        phase: idx * 0.17,
      });
    }

    const hubPinGeo = trackGeo(new THREE.OctahedronGeometry(0.044, 0));
    const hubPins: THREE.Mesh[] = [];
    for (const hub of GLOBAL_HUBS) {
      const pin = new THREE.Mesh(hubPinGeo, accentMetalMat);
      pin.position.copy(latLonToVec3(hub.lat, hub.lon, globeRadius * 1.028));
      orbitalGroup.add(pin);
      hubPins.push(pin);
    }

    // =========================================================================
    // PRESET 2 — LATTICE: 64 Precision Anodized Titanium Micro-Cubes + CAD Cage
    // =========================================================================
    const latticeGroup = new THREE.Group();
    latticeGroup.visible = false;
    masterPivot.add(latticeGroup);

    const gridN = 4;
    const cubeCount = gridN * gridN * gridN;
    const microCubeGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.26, 0.26));
    const microCubeMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        metalness: 0.86,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        iridescence: 0.65,
        iridescenceIOR: 1.45,
        envMapIntensity: 1.9,
      })
    );
    const latticeInstanced = new THREE.InstancedMesh(microCubeGeo, microCubeMat, cubeCount);
    latticeGroup.add(latticeInstanced);

    const cubeCoords: Array<{ x: number; y: number; z: number; dist: number; isCore: boolean }> = [];
    const spacing = 0.43;
    const offset = ((gridN - 1) * spacing) / 2;
    for (let ix = 0; ix < gridN; ix++) {
      for (let iy = 0; iy < gridN; iy++) {
        for (let iz = 0; iz < gridN; iz++) {
          const x = ix * spacing - offset;
          const y = iy * spacing - offset;
          const z = iz * spacing - offset;
          const dist = Math.sqrt(x * x + y * y + z * z);
          const isCore = (ix === 1 || ix === 2) && (iy === 1 || iy === 2) && (iz === 1 || iz === 2);
          cubeCoords.push({ x, y, z, dist, isCore });
        }
      }
    }

    // Outer Architectural CAD Wireframe Hypercube Cage
    const cageGeo = trackGeo(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.08, 2.08, 2.08)));
    const cageMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#94a3b8'),
        transparent: true,
        opacity: 0.36,
      })
    );
    latticeGroup.add(new THREE.LineSegments(cageGeo, cageMat));

    // Inner Glowing Accent Sub-Cage
    const subCageGeo = trackGeo(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.12, 1.12, 1.12)));
    const subCageMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color(accentHexRef.current),
        transparent: true,
        opacity: 0.68,
      })
    );
    const subCageLines = new THREE.LineSegments(subCageGeo, subCageMat);
    latticeGroup.add(subCageLines);

    // 8 Precision Corner Registration Nodes on Outer Hypercube
    const cornerPinGeo = trackGeo(new THREE.OctahedronGeometry(0.056, 0));
    const halfCage = 1.04;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const pin = new THREE.Mesh(cornerPinGeo, accentMetalMat);
          pin.position.set(sx * halfCage, sy * halfCage, sz * halfCage);
          latticeGroup.add(pin);
        }
      }
    }

    // =========================================================================
    // POINTER DRAG-TO-ORBIT + HOVER PARALLAX + RESIZE HANDLING
    // =========================================================================
    let hoverX = 0;
    let hoverY = 0;
    let dragActive = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let targetDragYaw = 0;
    let targetDragPitch = 0;
    let currentDragYaw = 0;
    let currentDragPitch = 0;

    const onPointerDown = (ev: PointerEvent) => {
      dragActive = true;
      lastClientX = ev.clientX;
      lastClientY = ev.clientY;
      setIsDragging(true);
      try {
        container.setPointerCapture(ev.pointerId);
      } catch {
        // Ignore synthetic pointer capture failure
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        hoverX = ((ev.clientX - rect.left) / rect.width - 0.5) * 2;
        hoverY = ((ev.clientY - rect.top) / rect.height - 0.5) * 2;
      }

      if (dragActive) {
        const dx = ev.clientX - lastClientX;
        const dy = ev.clientY - lastClientY;
        lastClientX = ev.clientX;
        lastClientY = ev.clientY;
        targetDragYaw += dx * 0.0085;
        targetDragPitch = Math.max(-1.05, Math.min(1.05, targetDragPitch + dy * 0.0075));
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (!dragActive) return;
      dragActive = false;
      setIsDragging(false);
      try {
        container.releasePointerCapture(ev.pointerId);
      } catch {
        // Ignore
      }
    };

    const onPointerLeave = () => {
      if (!dragActive) {
        hoverX = 0;
        hoverY = 0;
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);

    const handleResize = () => {
      if (!renderer) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // =========================================================================
    // MAIN 60FPS ANIMATION LOOP (CRISP NON-OVERLAPPING PRESET SWITCHING)
    // =========================================================================
    const groups = [prismGroup, orbitalGroup, latticeGroup];
    const accentColor = new THREE.Color(accentHexRef.current);
    const darkTitaniumColor = new THREE.Color('#6c778c');
    const paperTitaniumColor = new THREE.Color('#3b4456');
    const tempColor = new THREE.Color();
    const latticeDummy = new THREE.Object3D();

    let simTime = 0;
    let lastFrameTime = performance.now();
    let fpsFrames = 0;
    let fpsClock = performance.now();
    let smoothAudio = 0;
    let appliedTheme: AtelierTheme | null = null;
    let displayedPreset = 0;
    let enterSpring = 1.0;

    const animate = (now: number) => {
      if (disposed || !renderer) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const speed = orbitSpeedRef.current;
      const pulse = rippleRef.current;
      const irid = iridescenceRef.current;
      const scrollVel = Math.min(3.5, Math.abs(scrollVelocityRef.current));
      simTime += dt * (speed + scrollVel * 0.14);

      const bass = ambientAudio.getBassEnergy();
      smoothAudio += (bass - smoothAudio) * 0.16;

      // Sync Active Accent Color Across All Materials & Rim Lights
      accentColor.set(accentHexRef.current);
      accentRimLight.color.copy(accentColor);
      topAccentLight.color.copy(accentColor);
      crystalMat.attenuationColor.copy(accentColor);
      innerCoreMat.color.copy(accentColor);
      innerCoreMat.emissive.copy(accentColor);
      accentMetalMat.color.copy(accentColor);
      accentMetalMat.emissive.copy(accentColor);
      ringCMat.color.copy(accentColor);
      arcTubeMat.color.copy(accentColor);
      packetGlowMat.color.copy(accentColor);
      subCageMat.color.copy(accentColor);
      (fresnelMat.uniforms.uColor.value as THREE.Color).copy(accentColor);

      // Sync Theme Palette (Obsidian Dark vs Editorial Paper Light)
      const currentTheme = themeRef.current;
      const isPaper = currentTheme === 'paper';
      if (appliedTheme !== currentTheme) {
        appliedTheme = currentTheme;
        if (isPaper) {
          renderer.toneMappingExposure = 1.04;
          crystalMat.color.set('#bccce2');
          crystalMat.transmission = 0.52;
          crystalMat.metalness = 0.24;
          crystalMat.opacity = 0.94;
          crystalEdgesMat.color.set('#0f172a');
          crystalEdgesMat.opacity = 0.44;
          innerCoreEdgesMat.color.set('#111318');
          titaniumMat.color.set('#475266');
          titaniumMat.roughness = 0.2;
          prismStarMat.color.set('#1e293b');
          prismStarMat.blending = THREE.NormalBlending;
          prismStarMat.opacity = 0.52;

          globeCoreMat.color.set('#e5eaf2');
          globeCoreMat.roughness = 0.85;
          fresnelMat.blending = THREE.NormalBlending;
          fresnelMat.uniforms.uIntensity.value = 0.55;
          gridMat.color.set('#475569');
          gridMat.opacity = 0.24;
          fibMat.blending = THREE.NormalBlending;
          fibMat.color.set('#0f172a');
          fibMat.opacity = 0.78;
          packetMat.color.set('#0f172a');

          cageMat.color.set('#334155');
          cageMat.opacity = 0.38;
        } else {
          renderer.toneMappingExposure = 1.16;
          crystalMat.color.set('#131c2e');
          crystalMat.transmission = 0.58;
          crystalMat.metalness = 0.24;
          crystalMat.opacity = 0.94;
          crystalEdgesMat.color.set('#e2e8f0');
          crystalEdgesMat.opacity = 0.52;
          innerCoreEdgesMat.color.set('#ffffff');
          titaniumMat.color.set('#b8c2d4');
          titaniumMat.roughness = 0.14;
          prismStarMat.color.set('#e2e8f0');
          prismStarMat.blending = THREE.AdditiveBlending;
          prismStarMat.opacity = 0.74;

          globeCoreMat.color.set('#090d16');
          globeCoreMat.roughness = 0.82;
          fresnelMat.blending = THREE.AdditiveBlending;
          fresnelMat.uniforms.uIntensity.value = 0.82;
          gridMat.color.set('#94a3b8');
          gridMat.opacity = 0.18;
          fibMat.blending = THREE.AdditiveBlending;
          fibMat.color.set('#ffffff');
          fibMat.opacity = 0.94;
          packetMat.color.set('#ffffff');

          cageMat.color.set('#94a3b8');
          cageMat.opacity = 0.34;
        }
        prismStarMat.needsUpdate = true;
        fibMat.needsUpdate = true;
        fresnelMat.needsUpdate = true;
      }

      // Live Iridescence Slider
      const iridNorm = Math.min(1.0, irid * 0.58);
      crystalMat.iridescence = iridNorm;
      crystalMat.envMapIntensity = 1.25 + irid * 0.62;
      crystalMat.iridescenceThicknessRange = [120 + irid * 45, 360 + irid * 180];
      microCubeMat.iridescence = iridNorm;
      microCubeMat.envMapIntensity = 1.35 + irid * 0.62;

      // Smooth Drag + Hover + Scroll Pivot Rotation
      const damp = 1 - Math.exp(-9 * dt);
      currentDragYaw += (targetDragYaw - currentDragYaw) * damp;
      currentDragPitch += (targetDragPitch - currentDragPitch) * damp;
      const scrollSpin = scrollProgressRef.current * 1.4;
      masterPivot.rotation.y = currentDragYaw + hoverX * 0.34 + scrollSpin;
      masterPivot.rotation.x = currentDragPitch - hoverY * 0.24;

      // Crisp Non-Overlapping Artifact Switch + Spring Pop-In (Zero Ghost Collision!)
      const activeIdx = targetPresetRef.current;
      if (displayedPreset !== activeIdx) {
        displayedPreset = activeIdx;
        enterSpring = 0.86;
      }
      enterSpring += (1.0 - enterSpring) * (1 - Math.exp(-14 * dt));

      for (let i = 0; i < groups.length; i++) {
        const isCurrent = i === displayedPreset;
        groups[i].visible = isCurrent;
        if (isCurrent) {
          groups[i].scale.setScalar(enterSpring * (1 + smoothAudio * 0.05));
        }
      }

      // ---- Animate Preset 0: PRISM ----
      if (prismGroup.visible) {
        crystalMesh.rotation.y = simTime * 0.34;
        crystalMesh.rotation.z = Math.sin(simTime * 0.45) * 0.07;
        crystalMesh.position.y = Math.sin(simTime * 1.1) * 0.055 * pulse;

        innerCoreMesh.rotation.y = -simTime * 0.68;
        innerCoreMesh.rotation.x = simTime * 0.32;
        innerCoreMesh.position.y = crystalMesh.position.y;
        innerCoreMat.emissiveIntensity =
          1.15 + 0.38 * Math.sin(simTime * 2.1) * Math.min(1.5, pulse) + smoothAudio * 0.9;

        ringGroupOuter.rotation.z = simTime * 0.24;
        ringGroupOuter.rotation.x =
          Math.PI * 0.34 + Math.sin(simTime * 0.4) * 0.08 * Math.min(1.5, pulse);

        ringGroupInner.rotation.z = -simTime * 0.42;
        ringGroupInner.rotation.y = Math.PI * 0.36 + Math.cos(simTime * 0.5) * 0.1;

        ringCMesh.rotation.z = simTime * 0.15;

        prismStars.rotation.y = simTime * 0.12;
        if (pulse > 0.01) {
          const starAttr = prismStarGeo.attributes.position as THREE.BufferAttribute;
          const arr = starAttr.array as Float32Array;
          const waveAmp = 0.068 * pulse + smoothAudio * 0.12;
          for (let i = 0; i < prismStarCount; i++) {
            const bx = prismStarBasePositions[i * 3];
            const by = prismStarBasePositions[i * 3 + 1];
            const bz = prismStarBasePositions[i * 3 + 2];
            arr[i * 3] = bx;
            arr[i * 3 + 1] = by + Math.sin(simTime * 1.6 + i * 0.21) * waveAmp;
            arr[i * 3 + 2] = bz;
          }
          starAttr.needsUpdate = true;
        }
      }

      // ---- Animate Preset 1: ORBITAL ----
      if (orbitalGroup.visible) {
        orbitalGroup.rotation.y = simTime * 0.22;
        orbitalGroup.rotation.z = Math.sin(simTime * 0.35) * 0.06;
        globeHaloMesh.rotation.z = -simTime * 0.34;

        for (let i = 0; i < arcPackets.length; i++) {
          const p = arcPackets[i];
          const u = (simTime * p.speed + p.phase) % 1;
          p.curve.getPointAt(u, p.mesh.position);
          const s = 0.85 + 0.35 * Math.sin(u * Math.PI) + smoothAudio * 0.4;
          p.mesh.scale.setScalar(s);
        }

        const pinPulse =
          1 + Math.sin(simTime * 3.0) * 0.18 * Math.min(1.5, pulse) + smoothAudio * 0.45;
        for (let i = 0; i < hubPins.length; i++) {
          hubPins[i].rotation.y = simTime * 1.4 + i;
          hubPins[i].scale.setScalar(pinPulse);
        }
      }

      // ---- Animate Preset 2: LATTICE ----
      if (latticeGroup.visible) {
        latticeGroup.rotation.y = simTime * 0.28 + 0.55;
        latticeGroup.rotation.x = 0.36 + Math.sin(simTime * 0.4) * 0.12;
        subCageLines.rotation.y = -simTime * 0.36;
        subCageLines.rotation.z = simTime * 0.22;

        const baseMetal = isPaper ? paperTitaniumColor : darkTitaniumColor;
        const waveStrength = 0.13 * pulse + smoothAudio * 0.14;

        for (let i = 0; i < cubeCount; i++) {
          const c = cubeCoords[i];
          const wave = Math.sin(simTime * 2.2 - c.dist * 2.5);
          const expand = 1 + wave * waveStrength;
          const cubeScale = 0.72 + (wave * 0.5 + 0.5) * 0.3 + (c.isCore ? 0.1 : 0);

          latticeDummy.position.set(c.x * expand, c.y * expand, c.z * expand);
          latticeDummy.rotation.set(
            c.isCore ? simTime * 0.65 : wave * 0.16 * Math.min(1.6, pulse),
            c.isCore ? -simTime * 0.55 : wave * 0.14 * Math.min(1.6, pulse),
            0
          );
          latticeDummy.scale.setScalar(cubeScale);
          latticeDummy.updateMatrix();
          latticeInstanced.setMatrixAt(i, latticeDummy.matrix);

          const accentMix = c.isCore
            ? 0.85 + 0.15 * (wave * 0.5 + 0.5)
            : Math.max(0, wave) * 0.55;
          tempColor.copy(baseMetal).lerp(accentColor, accentMix);
          latticeInstanced.setColorAt(i, tempColor);
        }
        latticeInstanced.instanceMatrix.needsUpdate = true;
        if (latticeInstanced.instanceColor) {
          latticeInstanced.instanceColor.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);

      fpsFrames += 1;
      if (now - fpsClock >= 650) {
        const measured = Math.min(
          144,
          Math.max(24, Math.round((fpsFrames * 1000) / (now - fpsClock)))
        );
        onFpsSampleRef.current?.(measured);
        fpsFrames = 0;
        fpsClock = now;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);

      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const tex of textures) tex.dispose();
      envTarget.dispose();
      pmrem.dispose();
      renderer?.dispose();
    };
  }, [scrollProgressRef, scrollVelocityRef]);

  const handleEyeDropper = async () => {
    tactileAudio.playLatch();
    const picked = await pickColorWithEyeDropper();
    if (picked) {
      onAccentChange(picked);
    }
  };

  const handleReset = () => {
    tactileAudio.playTick(1280);
    setIridescence(1.0);
    setRipple(1.0);
    setOrbitSpeed(1.0);
    onAccentChange(null);
  };

  return (
    <div
      className="relative w-full h-full min-h-[380px] lg:min-h-[500px] rounded-[24px] overflow-hidden border border-[var(--hairline)] bg-[var(--bg-elevated)] shadow-[var(--card-shadow)] select-none"
      style={{
        backgroundImage:
          theme === 'paper'
            ? `radial-gradient(circle at 50% 44%, color-mix(in srgb, ${accentHex} 10%, transparent) 0%, transparent 62%), radial-gradient(circle at 50% 50%, rgba(15,23,42,0.03) 0%, transparent 72%)`
            : `radial-gradient(circle at 50% 44%, color-mix(in srgb, ${accentHex} 16%, transparent) 0%, transparent 56%), radial-gradient(circle at 50% 100%, rgba(148,163,184,0.05) 0%, transparent 64%)`,
      }}
    >
      {/* Subtle architectural corner registration reticles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-[16px] border border-[var(--hairline)] opacity-45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-5 left-6 z-10 flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)]"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accentHex }}
        />
        <span>{PRESETS[activePreset]?.label ?? 'Prism'} · PBR 3D</span>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-6 z-10 font-mono-tech text-[10px] tracking-[0.14em] uppercase text-[var(--fg-muted)]"
      >
        DRAG TO ORBIT
      </div>

      <div
        ref={stageRef}
        data-cursor="DRAG 3D"
        className={`absolute inset-0 z-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* Floating 3D PBR Studio Tuner & EyeDropper Micro-Popover */}
      {tunerOpen && (
        <div
          data-testid="shader-tuner-panel"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[min(300px,calc(100%-24px))] p-3.5 rounded-2xl liquid-glass font-mono-tech text-[10.5px] space-y-3 text-[var(--fg-primary)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2">
            <span className="font-bold tracking-wider uppercase">3D PBR STUDIO</span>
            <button
              type="button"
              data-testid="btn-shader-reset"
              onClick={handleReset}
              className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--accent)] transition cursor-pointer"
            >
              RESET
            </button>
          </div>

          <div className="space-y-2">
            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>IRIDESCENCE</span>
                <span className="text-[var(--fg-primary)]">{iridescence.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-iridescence"
                min={0}
                max={2.4}
                step={0.1}
                value={iridescence}
                onChange={(e) => setIridescence(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>WAVE PULSE</span>
                <span className="text-[var(--fg-primary)]">{ripple.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-ripple"
                min={0}
                max={2.6}
                step={0.1}
                value={ripple}
                onChange={(e) => setRipple(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-[var(--fg-secondary)]">
                <span>ORBIT SPEED</span>
                <span className="text-[var(--fg-primary)]">{orbitSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                data-testid="slider-speed"
                min={0.2}
                max={2.4}
                step={0.1}
                value={orbitSpeed}
                onChange={(e) => setOrbitSpeed(Number.parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)] h-1 cursor-pointer"
              />
            </label>
          </div>

          {/* Dynamic Accent Swatches + EyeDropper API */}
          <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {ACCENT_SWATCHES.map((sw) => {
                const active = accentHex.toUpperCase() === sw.hex;
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    data-testid={`accent-swatch-${sw.name.toLowerCase()}`}
                    aria-label={`Accent ${sw.name}`}
                    onClick={() => {
                      tactileAudio.playTick(1480);
                      onAccentChange(sw.hex);
                    }}
                    style={{
                      backgroundColor: sw.hex,
                      boxShadow: active ? '0 0 0 2px var(--fg-primary)' : undefined,
                    }}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-110 cursor-pointer"
                  />
                );
              })}
            </div>

            {eyeDropperAvailable && (
              <button
                type="button"
                data-testid="btn-eyedropper"
                onClick={() => void handleEyeDropper()}
                className="px-2 py-0.5 rounded-full border border-[var(--hairline)] hover:border-[var(--accent)] text-[10px] text-[var(--fg-primary)] transition cursor-pointer"
              >
                Pick
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Floating Liquid Glass Artifact Switcher + Tune Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 rounded-full liquid-glass">
        {PRESETS.map((preset) => {
          const selected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              data-testid={`shader-preset-${preset.id}`}
              onClick={() => {
                tactileAudio.playLatch();
                setActivePreset(preset.id);
                targetPresetRef.current = preset.id;
              }}
              style={{
                backgroundColor: selected ? 'var(--fg-primary)' : 'transparent',
                color: selected ? 'var(--bg-primary)' : 'var(--fg-secondary)',
              }}
              className="px-3 py-1 rounded-full font-mono-tech text-[11px] font-semibold tracking-wide transition cursor-pointer"
            >
              {preset.label}
            </button>
          );
        })}

        <span aria-hidden="true" className="w-px h-3.5 bg-[var(--hairline-strong)] mx-0.5" />

        <button
          type="button"
          data-testid="btn-shader-tune"
          onClick={() => {
            tactileAudio.playTick(1520);
            setTunerOpen((v) => !v);
          }}
          style={{
            backgroundColor: tunerOpen ? 'var(--accent)' : 'transparent',
            color: tunerOpen ? '#ffffff' : 'var(--fg-secondary)',
          }}
          className="px-2.5 py-1 rounded-full font-mono-tech text-[11px] font-semibold tracking-wide hover:text-[var(--fg-primary)] transition cursor-pointer"
        >
          Tune
        </button>
      </div>
    </div>
  );
}
