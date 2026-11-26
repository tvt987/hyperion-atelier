export type WorkCategory = 'all' | 'commerce' | 'design' | 'ai' | 'systems';

export interface FlagshipWorkItem {
  id: string;
  index: string;
  title: string;
  version: string;
  category: Exclude<WorkCategory, 'all'>;
  taglineEn: string;
  taglineVi: string;
  previewImage: string;
  highlightMetric: string;
  ciBadge: string;
  keywords: string[];
  liveUrl: string;
  repoUrl: string;
}

export const FLAGSHIP_WORKS: FlagshipWorkItem[] = [
  {
    id: 'maison-vera',
    index: '01',
    title: 'Maison Véra',
    version: 'v3.0',
    category: 'commerce',
    taglineEn: 'Photorealistic Luxury E-Commerce & 3D Titanium CAD',
    taglineVi: 'Thương Mại Điện Tử Xa Xỉ & Kính 3D Tách Lớp',
    previewImage: 'previews/maison-vera.webp',
    highlightMetric: '16 Studio WebP · 3D Exploded',
    ciBadge: '33/33 CI',
    keywords: ['Three.js PBR', 'AI Stylist -12%', '2.2x Loupe', '24K Monogram', 'USD / VND'],
    liveUrl: 'https://tvt987.github.io/maison-vera/',
    repoUrl: 'https://github.com/tvt987/maison-vera',
  },
  {
    id: 'atelier-canvas',
    index: '02',
    title: 'Atelier Canvas',
    version: 'v3.0',
    category: 'design',
    taglineEn: 'Browser Figma Pro × Framer Design & Prototyping Studio',
    taglineVi: 'Phần Mềm Thiết Kế & Tạo Mẫu Chuẩn Figma Trên Trình Duyệt',
    previewImage: 'previews/atelier-canvas.webp',
    highlightMetric: 'Multi-Screen · 3D Z-Stack',
    ciBadge: '18/18 CI',
    keywords: ['Multi-Artboard', 'GPU Photo Grade', '3D Stack', 'Dev Mode TSX', 'Yjs CRDT'],
    liveUrl: 'https://tvt987.github.io/atelier-canvas/',
    repoUrl: 'https://github.com/tvt987/atelier-canvas',
  },
  {
    id: 'aether-acoustics',
    index: '03',
    title: 'Aether Acoustics',
    version: 'v1.0',
    category: 'commerce',
    taglineEn: '3D PBR Spatial Audio Hardware Store & Live DSP Lab',
    taglineVi: 'Cửa Hàng Âm Thanh 3D PBR & Phòng Nghe DSP',
    previewImage: 'previews/aether-acoustics.webp',
    highlightMetric: '5-Layer 3D CNC · Web Audio DSP',
    ciBadge: '17/17 CI',
    keywords: ['Three.js IBL', 'Web Audio DSP', 'Lenis + GSAP', '3D Card Checkout'],
    liveUrl: 'https://tvt987.github.io/aether-acoustics/',
    repoUrl: 'https://github.com/tvt987/aether-acoustics',
  },
  {
    id: 'nexus-lake',
    index: '04',
    title: 'Nexus Lake',
    version: 'v1.0',
    category: 'systems',
    taglineEn: 'Local-First DuckDB-WASM Lakehouse & MCP Server',
    taglineVi: 'Kho Dữ Liệu DuckDB-WASM, WebGPU & MCP Server',
    previewImage: 'previews/nexus-lake.webp',
    highlightMetric: '500K Arrow Rows · 166B CRDT',
    ciBadge: '22/22 CI',
    keywords: ['DuckDB-WASM', 'WebGPU WGSL', 'Yjs CRDT', 'AG-UI', 'MCP Server TS'],
    liveUrl: 'https://tvt987.github.io/nexus-lake/',
    repoUrl: 'https://github.com/tvt987/nexus-lake',
  },
  {
    id: 'verdict-graph',
    index: '05',
    title: 'Verdict Graph',
    version: 'v1.0',
    category: 'ai',
    taglineEn: 'Multi-Agent Control Plane & Time-Travel Protocol Debugger',
    taglineVi: 'Điều Phối Đa Tác Tử AI & Tua Ngược Checkpoint',
    previewImage: 'previews/verdict-graph.webp',
    highlightMetric: '0.99 Grounded · -52% Cost',
    ciBadge: '27/27 CI',
    keywords: ['MCP 2.0', 'A2A Protocol', 'AG-UI SSE', 'LangGraph Fork', 'OTel GenAI'],
    liveUrl: 'https://tvt987.github.io/verdict-graph/',
    repoUrl: 'https://github.com/tvt987/verdict-graph',
  },
  {
    id: 'aegispulse',
    index: '06',
    title: 'AegisPulse',
    version: 'v1.0',
    category: 'systems',
    taglineEn: '.NET 10 High-Concurrency Kernel & Hybrid RAG SRE',
    taglineVi: 'Nhân Giao Dịch .NET 10 Tải Cao & Trợ Lý Hybrid RAG',
    previewImage: 'previews/aegispulse.webp',
    highlightMetric: '139,099 RPS · 0 Double-Spend',
    ciBadge: '18/18 CI',
    keywords: ['.NET 10 CAS', 'Channel<T> WAL', 'FastAPI', 'BM25 + 384d RRF', 'OpenTelemetry'],
    liveUrl: 'https://tvt987.github.io/aegispulse-distributed-sre/',
    repoUrl: 'https://github.com/tvt987/aegispulse-distributed-sre',
  },
];

export interface ExperienceRow {
  period: string;
  org: string;
  roleEn: string;
  roleVi: string;
  keywords: string[];
}

export const EXPERIENCE_ROWS: ExperienceRow[] = [
  {
    period: '2023 — NOW',
    org: 'Con Cung Corp',
    roleEn: 'Full-Stack .NET & Applied AI',
    roleVi: 'Full-Stack .NET & Applied AI',
    keywords: ['700+ Stores', '.NET 8', 'Dapper', 'SQL Server', 'Redis Lua', 'Keycloak OIDC', 'n8n', 'MCP'],
  },
  {
    period: '2023',
    org: 'FPT Software',
    roleEn: 'Frontend Engineer Intern',
    roleVi: 'Thực Tập Sinh Frontend',
    keywords: ['Angular', 'TypeScript', 'E-Commerce REST', 'Responsive UI'],
  },
  {
    period: '2022 — 2026',
    org: 'UIT — VNU-HCM',
    roleEn: 'B.S. Information Technology',
    roleVi: 'Cử Nhân CNTT — ĐHQG TP.HCM',
    keywords: ['Distributed Systems', 'Database Internals', 'Applied AI / RAG'],
  },
];

export interface SkillGroup {
  labelEn: string;
  labelVi: string;
  items: string[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    labelEn: 'Backend & Concurrency',
    labelVi: 'Backend & Tải Cao',
    items: ['C#', '.NET 8/10', 'Dapper', 'SQL Server', 'PostgreSQL', 'Redis Lua', 'RabbitMQ', 'Polly v8', 'Keycloak OIDC', 'OpenTelemetry'],
  },
  {
    labelEn: 'Applied AI & Protocols',
    labelVi: 'AI Ứng Dụng & Giao Thức',
    items: ['Python 3.12', 'FastAPI', 'MCP Server 2.0', 'A2A Protocol', 'AG-UI SSE', 'LangGraph', 'Hybrid RAG (BM25 + RRF)', 'Qdrant', 'Prompt Guardrails'],
  },
  {
    labelEn: 'Frontend, 3D & Local-First',
    labelVi: 'Frontend, 3D & Local-First',
    items: ['React 19', 'TypeScript', 'Angular 19', 'Tailwind v4', 'Three.js PBR', 'WebGL2 / WebGPU WGSL', 'DuckDB-WASM', 'Yjs CRDT', 'Lenis + GSAP', 'Web Audio DSP'],
  },
];

export interface CvItem {
  id: string;
  titleEn: string;
  titleVi: string;
  keywords: string;
  href: string;
  accent: string;
}

export const CV_DOSSIERS: CvItem[] = [
  {
    id: 'backend',
    titleEn: 'Backend CV',
    titleVi: 'CV Backend',
    keywords: '.NET 10 · C# · SQL · Redis · OTel',
    href: './CV_Backend_TruongVanTinh.pdf',
    accent: '#38BDF8',
  },
  {
    id: 'fullstack',
    titleEn: 'Full-Stack CV',
    titleVi: 'CV Full-Stack',
    keywords: 'React 19 · Angular · Three.js · WASM',
    href: './CV_FullStack_TruongVanTinh.pdf',
    accent: '#A78BFA',
  },
  {
    id: 'ai',
    titleEn: 'Applied AI CV',
    titleVi: 'CV Applied AI',
    keywords: 'Python · MCP · A2A · LangGraph · RAG',
    href: './CV_AI_TruongVanTinh.pdf',
    accent: '#34D399',
  },
];
