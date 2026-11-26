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
    id: 'tvt-studio',
    index: '01',
    title: 'TVT Studio',
    version: 'STORE',
    category: 'commerce',
    taglineEn: 'Commercial Web Marketplace, Price Estimator & Multi-Channel Checkout',
    taglineVi: 'Cửa Hàng Website Mẫu, Máy Tính Báo Giá & Thanh Toán QR',
    previewImage: 'previews/tvt-studio.webp',
    highlightMetric: '9 Web Templates · Zalo/MoMo/B2B',
    ciBadge: '25/25 CI',
    keywords: ['Web Storefront', 'Price Estimator', 'Live Sandbox', 'ZaloPay / B2B', 'Proposal .md'],
    liveUrl: 'https://tvt987.github.io/tvt-studio/',
    repoUrl: 'https://github.com/tvt987/tvt-studio',
  },
  {
    id: 'maison-vera',
    index: '02',
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
    index: '03',
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
    id: 'lumina-medspa',
    index: '04',
    title: 'Lumina MedSpa',
    version: 'v1.0',
    category: 'commerce',
    taglineEn: 'Swiss Dental & MedSpa Clinic, AI Quiz & QR Slot Booking',
    taglineVi: 'Phòng Khám Nha Khoa Thụy Sĩ, Tư Vấn AI & Thẻ Đặt Lịch QR',
    previewImage: 'previews/lumina-medspa.webp',
    highlightMetric: 'Before/After · QR VIP Pass',
    ciBadge: '24/24 CI',
    keywords: ['Before/After', 'AI Diagnostic', 'Doctor Slots', 'QR + .ICS Pass', 'VNĐ / USD'],
    liveUrl: 'https://tvt987.github.io/lumina-medspa/',
    repoUrl: 'https://github.com/tvt987/lumina-medspa',
  },
  {
    id: 'kinetix-proptech',
    index: '05',
    title: 'Kinetix PropTech',
    version: 'v1.0',
    category: 'commerce',
    taglineEn: 'Luxury Real Estate Tower Explorer, CAD Plans & Mortgage ROI',
    taglineVi: 'Sàn BĐS Hạng Sang, Chọn Tầng Tháp & Mô Phỏng Lãi Vay ROI',
    previewImage: 'previews/kinetix-proptech.webp',
    highlightMetric: 'Floors 18–42 · 10Y ROI Engine',
    ciBadge: '27/27 CI',
    keywords: ['Tower Stack', 'CAD Floorplan', 'Mortgage PMT', '10Y Equity SVG', 'Compare 3 Units'],
    liveUrl: 'https://tvt987.github.io/kinetix-proptech/',
    repoUrl: 'https://github.com/tvt987/kinetix-proptech',
  },
  {
    id: 'pulse-pos-fnb',
    index: '06',
    title: 'PulsePOS F&B',
    version: 'v1.0',
    category: 'systems',
    taglineEn: 'Multi-Branch Cloud POS, Table Map, Live KDS & Inventory BOM',
    taglineVi: 'Hệ Thống POS F&B Đa Chi Nhánh, Bếp KDS & Kho Định Lượng',
    previewImage: 'previews/pulse-pos-fnb.webp',
    highlightMetric: 'POS ↔ Live KDS · 80mm Receipt',
    ciBadge: '30/30 CI',
    keywords: ['Table Map POS', 'Live KDS SLA', 'Split Bill', 'VietQR Receipt', 'BOM Inventory'],
    liveUrl: 'https://tvt987.github.io/pulse-pos-fnb/',
    repoUrl: 'https://github.com/tvt987/pulse-pos-fnb',
  },
  {
    id: 'aether-acoustics',
    index: '07',
    title: 'Aether Acoustics',
    version: 'v2.0',
    category: 'commerce',
    taglineEn: '3D FFT Spatial Audio Store, 5-Band EQ & Room Acoustics Lab',
    taglineVi: 'Cửa Hàng Âm Thanh 3D FFT, EQ 5 Băng Tần & Phòng Hiệu Chuẩn',
    previewImage: 'previews/aether-acoustics.webp',
    highlightMetric: '3D FFT Audio · Room RT60 Lab',
    ciBadge: '28/28 CI',
    keywords: ['3D Laser Plaque', '5-Band EQ', 'Room RT60 Lab', 'USD / VND', 'Compare 3 SKUs'],
    liveUrl: 'https://tvt987.github.io/aether-acoustics/',
    repoUrl: 'https://github.com/tvt987/aether-acoustics',
  },
  {
    id: 'nexus-lake',
    index: '08',
    title: 'Nexus Lake',
    version: 'v2.0',
    category: 'systems',
    taglineEn: 'Local-First DuckDB-WASM Lakehouse, Brush-to-SQL & Live CDC',
    taglineVi: 'Kho Dữ Liệu DuckDB-WASM, Khoanh Vùng SQL & Live CDC',
    previewImage: 'previews/nexus-lake.webp',
    highlightMetric: 'Brush-to-SQL · Live CDC +5K/s',
    ciBadge: '36/36 CI',
    keywords: ['Brush-to-SQL', 'EXPLAIN Plan', 'Auto-Chart', 'Kafka CDC', 'MCP Server'],
    liveUrl: 'https://tvt987.github.io/nexus-lake/',
    repoUrl: 'https://github.com/tvt987/nexus-lake',
  },
  {
    id: 'verdict-graph',
    index: '09',
    title: 'Verdict Graph',
    version: 'v2.0',
    category: 'ai',
    taglineEn: 'Photonic Multi-Agent Control Plane, Red-Team & FinOps A/B',
    taglineVi: 'Điều Phối Đa Tác Tử Photonic, Red-Team & Mô Phỏng FinOps',
    previewImage: 'previews/verdict-graph.webp',
    highlightMetric: 'Photonic DAG · Red-Team 8-Rule',
    ciBadge: '43/43 CI',
    keywords: ['Photonic DAG', 'Red-Team', 'FinOps -52%', 'Signed OTLP', 'MCP × A2A'],
    liveUrl: 'https://tvt987.github.io/verdict-graph/',
    repoUrl: 'https://github.com/tvt987/verdict-graph',
  },
  {
    id: 'aegispulse',
    index: '10',
    title: 'AegisPulse',
    version: 'v2.0',
    category: 'systems',
    taglineEn: '.NET 10 139K RPS Kernel, 60fps Packet Lab & Hybrid RAG',
    taglineVi: 'Nhân .NET 10 139K RPS, Gói Tin 60fps & Trợ Lý Hybrid RAG',
    previewImage: 'previews/aegispulse.webp',
    highlightMetric: '139K RPS · 3-Engine Race Lab',
    ciBadge: '24/24 CI',
    keywords: ['60fps Packets', '3-Engine Race', 'P99 Histogram', 'RAG α-Slider', 'Post-Mortem .md'],
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
