export interface MonographPlateItem {
  plateNo: string;
  year: string;
  domainTag: string;
  title: string;
  subtitleEn: string;
  subtitleVi: string;
  summaryEn: string;
  summaryVi: string;
  metrics: Array<{ label: string; value: string }>;
  stack: string[];
  liveUrl?: string;
  repoUrl: string;
  ciProof: string;
  topologyNodes: [string, string, string, string];
}

export const MONOGRAPH_PLATES: MonographPlateItem[] = [
  {
    plateNo: 'PLATE 01',
    year: '2026',
    domainTag: 'POLYGLOT DISTRIBUTED KERNEL & AGENTIC SRE',
    title: 'AegisPulse — High-Concurrency Kernel & Hybrid-RAG Control Plane',
    subtitleEn: 'C# .NET 10 Minimal API + Python 3.12 FastAPI Hybrid RAG + React 19 Telemetry Cockpit',
    subtitleVi: 'Nhân giao dịch tải cao C# .NET 10 + Agentic SRE Hybrid RAG Python 3.12 + Buồng lái React 19',
    summaryEn:
      'Unifies a lock-free atomic quota & RowVersion Compare-And-Swap engine (139,099 RPS, 0 oversold units across 10,000-request flash-sale bursts, SHA-256 Idempotency-Key 409 guard, W3C traceparent waterfall) with an Okapi BM25 + 384-d Dense Vector RRF (k=60) SRE Co-Pilot achieving 100% Recall@1 and 100% out-of-domain abstention precision.',
    summaryVi:
      'Hợp nhất nhân kiểm soát hạn ngạch phi khóa & RowVersion CAS (139.099 RPS, 0 rò rỉ âm kho trước đợt bão 10.000 truy vấn đồng thời, chống trùng SHA-256 Idempotency-Key 409, thác vết W3C OpenTelemetry) cùng trợ lý SRE tự hành kết hợp BM25 + Vector 384 chiều RRF (k=60) đạt 100% Recall@1 và chặn 100% ảo giác ngoài miền.',
    metrics: [
      { label: 'PEAK THROUGHPUT', value: '139,099 RPS' },
      { label: 'DOUBLE-SPEND LEAKS', value: '0 / 10,000' },
      { label: 'RAG RECALL@1 / OOD', value: '100% / 100%' },
    ],
    stack: ['.NET 10', 'C# Channel<T>', 'Python 3.12', 'FastAPI', 'BM25 + RRF', 'OpenTelemetry', 'React 19'],
    liveUrl: 'https://tvt987.github.io/aegispulse-distributed-sre/',
    repoUrl: 'https://github.com/tvt987/aegispulse-distributed-sre',
    ciProof: '18/18 .NET xUnit + Pytest + Vitest PASS (GitHub Actions)',
    topologyNodes: ['HTTP/2 Burst', 'SHA-256 Idem 409', 'Atomic CAS / WAL', 'BM25+384d RRF'],
  },
  {
    plateNo: 'PLATE 02',
    year: '2026',
    domainTag: 'LOCAL-FIRST OLAP LAKEHOUSE & MCP BI WORKBENCH',
    title: 'Nexus Lake — Collaborative DuckDB-WASM Lakehouse & WebGPU Workbench',
    subtitleEn: 'Self-Hosted DuckDB-WASM + Apache Arrow + Yjs CRDT Multiplayer + WGSL Compute + Real TypeScript MCP Server',
    subtitleVi: 'Kho dữ liệu SQL tại trình duyệt DuckDB-WASM + Yjs CRDT đa người dùng + WebGPU WGSL + MCP Server thật',
    summaryEn:
      'Zero-server thick-client analytics studio scanning 100K–500K Apache Arrow rows inside browser Web Workers via DuckDB-WASM, paired with lossless Yjs CRDT offline partition/merge labs, inspectable WGSL WebGPU scatter shaders, AG-UI generative BI widgets, 128-d IndexedDB semantic catalog search, and a standalone AST-guarded TypeScript MCP Server.',
    summaryVi:
      'Nền tảng phân tích OLAP không cần máy chủ truy vấn trực tiếp 100K–500K dòng Apache Arrow bằng DuckDB-WASM, tích hợp cộng tác không xung đột Yjs CRDT ngoại tuyến, biểu đồ dị thường WebGPU WGSL, trợ lý Generative BI chuẩn AG-UI và gói TypeScript MCP Server chặn ghi SQL bằng AST.',
    metrics: [
      { label: 'CLIENT-SIDE OLAP', value: '100K–500K ROWS' },
      { label: 'CRDT MERGE DELTA', value: '166 BYTES' },
      { label: 'CI SUITE (MCP+WEB)', value: '22 / 22 PASS' },
    ],
    stack: ['DuckDB-WASM', 'Apache Arrow', 'Yjs CRDT', 'WebGPU WGSL', 'AG-UI', 'MCP Server TS', 'React 19'],
    liveUrl: 'https://tvt987.github.io/nexus-lake/',
    repoUrl: 'https://github.com/tvt987/nexus-lake',
    ciProof: '22/22 MCP Server + Web Vitest PASS (GitHub Actions)',
    topologyNodes: ['Arrow IPC 500K', 'DuckDB-WASM SQL', 'Yjs CRDT Sync', 'WGSL + MCP/AG-UI'],
  },
  {
    plateNo: 'PLATE 03',
    year: '2026',
    domainTag: 'AGENTIC PROTOCOL CONTROL PLANE & TIME-TRAVEL DEBUGGER',
    title: 'Verdict Graph — Visual Multi-Agent Orchestrator & Protocol Debugger',
    subtitleEn: 'MCP JSON-RPC 2.0 + A2A AgentCards + AG-UI SSE + Immutable LangGraph Checkpointer + OpenTelemetry GenAI',
    subtitleVi: 'Trung tâm điều phối đa tác tử chuẩn MCP × A2A × AG-UI + Tua ngược Time-Travel Checkpoint + Thác vết OTel GenAI',
    summaryEn:
      'Polyglot FastAPI + React 19 multi-agent mission control featuring a cyclic 6-node execution DAG, real Human-in-the-Loop approval interrupts, indirect prompt-injection blocking (INJ-EXFIL-001), immutable checkpoint branching with side-by-side FinOps diff (+0.38 groundedness at -52% cost), and live MCP/A2A/AG-UI/OTel wire inspectors.',
    summaryVi:
      'Hệ thống điều khiển đa tác tử AI song runtime (FastAPI + React 19) sở hữu đồ thị thực thi có chu trình 6 nút, chốt duyệt Human-in-the-Loop, lá chắn chặn prompt injection (INJ-EXFIL-001), tách nhánh tua ngược checkpoint so sánh chi phí/độ trung thực và bộ soi gói tin MCP/A2A/AG-UI/OTel trực tiếp.',
    metrics: [
      { label: 'FORK GROUNDEDNESS', value: '0.61 -> 0.99' },
      { label: 'TOKEN COST DELTA', value: '-52.2% USD' },
      { label: 'POLYGLOT CI SUITE', value: '27 / 27 PASS' },
    ],
    stack: ['Python 3.12', 'FastAPI', 'LangGraph Pattern', 'MCP 2.0', 'A2A Protocol', 'AG-UI SSE', 'OTel GenAI'],
    liveUrl: 'https://tvt987.github.io/verdict-graph/',
    repoUrl: 'https://github.com/tvt987/verdict-graph',
    ciProof: '27/27 Python Pytest + Vitest PASS (GitHub Actions)',
    topologyNodes: ['Cyclic 6-Node DAG', 'MCP & A2A Wire', 'HITL & Guardrail', 'Time-Travel Fork'],
  },
  {
    plateNo: 'PLATE 04',
    year: '2026',
    domainTag: 'LUXURY 3D E-COMMERCE & REAL-TIME SPATIAL AUDIO',
    title: 'Aether Acoustics — 3D PBR Hardware Flagship & Spatial DSP Store',
    subtitleEn: 'Three.js RoomEnvironment PBR 3D Configurator + Scroll Exploded Anatomy + Web Audio DSP + Idempotent Checkout',
    subtitleVi: 'Cửa hàng âm thanh cao cấp 3D PBR thời gian thực + Giải phẫu linh kiện theo cuộn + Phòng nghe DSP + Thanh toán Idempotent',
    summaryEn:
      'Awwwards-grade commercial flagship store combining a procedural 5-layer CNC aluminum 3D monolith configurator (4 PBR finishes, scroll-choreographed exploded view via Lenis + GSAP), real-time Web Audio API Biquad/Convolver spatial audition lab, 6-SKU industrial catalog, idempotent promo voucher engine, and 3-step checkout with 3D metallic card & authenticity certificate.',
    summaryVi:
      'Website thương mại điện tử cao cấp tích hợp bộ tùy biến loa 3D PBR 5 lớp CNC thời gian thực (4 vật liệu kim loại, tách lớp theo nhịp cuộn Lenis + GSAP), phòng nghe thử Web Audio API DSP 60fps, danh mục 6 thiết bị vẽ đồ họa công nghiệp, nhân voucher chống trùng và quy trình checkout thẻ kim loại 3D xuất chứng nhận số.',
    metrics: [
      { label: '3D PBR ANATOMY', value: '5 KINEMATIC LAYERS' },
      { label: 'SPATIAL AUDIO LAB', value: '3 LIVE DSP MODES' },
      { label: 'COMMERCE CI SUITE', value: '17 / 17 PASS' },
    ],
    stack: ['React 19', 'Three.js PBR', 'Lenis + GSAP', 'Web Audio DSP', 'View Transitions', 'Zod', 'Vitest'],
    liveUrl: 'https://tvt987.github.io/aether-acoustics/',
    repoUrl: 'https://github.com/tvt987/aether-acoustics',
    ciProof: '17/17 Cart, Voucher & Checkout Vitest PASS (GitHub Actions)',
    topologyNodes: ['Three.js PBR 3D', 'Web Audio DSP', 'Idempotent Voucher', '3D Card + Cert'],
  },
  {
    plateNo: 'PLATE 05',
    year: '2026',
    domainTag: 'INTERACTIVE VECTOR DESIGN STUDIO & DEV-MODE CODEGEN',
    title: 'Atelier Canvas — Browser Figma-Class UI & Design-System Studio',
    subtitleEn: 'Infinite Pan/Zoom + 6px Smart Snap Guides + Live Design Tokens + React/TW4 Dev Mode + SVG/2x PNG + Yjs CRDT',
    subtitleVi: 'Phần mềm thiết kế đồ họa & UI trên trình duyệt chuẩn Figma + Smart Snap + Design Tokens + Dev Mode xuất React/SVG/PNG + Yjs CRDT',
    summaryEn:
      'Browser-native vector and UI authoring workspace featuring synchronized pixel rulers, 9 Figma-shortcut tools, 6px magenta smart alignment guides, atomic Undo/Redo, 4 art-directed templates, real-time Design Token theme morphing, Figma Dev Mode redlines generating React 19 + Tailwind v4 JSX, standalone SVG/2x PNG export, and Yjs CRDT multi-tab collaboration.',
    summaryVi:
      'Công cụ thiết kế UI/Vector chuyên sâu ngay trên trình duyệt với thước pixel đồng bộ, 9 công cụ chuẩn phím tắt Figma, lưới hít thông minh 6px, Undo/Redo, 4 template dựng sẵn, đổi bộ màu Design Tokens tức thì, chế độ Dev Mode đo khoảng cách xuất code React 19 + Tailwind v4 / SVG / PNG 2× và cộng tác Yjs CRDT.',
    metrics: [
      { label: 'DIRECT ENGINE', value: '9 TOOLS · 6PX SNAP' },
      { label: 'EXPORT PIPELINE', value: 'TSX · SVG · 2X PNG' },
      { label: 'STUDIO CI SUITE', value: '12 / 12 PASS' },
    ],
    stack: ['React 19', 'TypeScript', 'Yjs CRDT', 'Design Tokens', 'SVG/Canvas 2x', 'Tailwind v4', 'Vitest'],
    liveUrl: 'https://tvt987.github.io/atelier-canvas/',
    repoUrl: 'https://github.com/tvt987/atelier-canvas',
    ciProof: '12/12 Viewport, Snap, Codegen & Yjs Vitest PASS (GitHub Actions)',
    topologyNodes: ['Infinite Canvas', '6px Smart Snap', 'Dev Mode JSX', 'SVG/2x PNG + Yjs'],
  },
  {
    plateNo: 'PLATE 06',
    year: '2026',
    domainTag: 'EDITORIAL LUXURY E-COMMERCE & 3D EYEWEAR STOREFRONT',
    title: 'Maison Véra — Architectural Fashion, 3D Eyewear & Objects Store',
    subtitleEn: 'Three.js PBR Titanium Eyewear + 12-SKU Faceted Search + Shop-The-Look Bundles + Live USD/VND & EN/VI',
    subtitleVi: 'Cửa hàng thời trang & kính mắt Titanium 3D PBR + Bộ lọc đa chiều 12 SKU + Shop-The-Look -10% + Chuyển đổi USD/VNĐ & EN/VI',
    summaryEn:
      'Parisian Archival Paper storefront contrasting dark tech UIs with an interactive Three.js PBR titanium eyewear hero, 12 dual-angle SKUs with instant faceted search/filter, pulsing Shop-The-Look hotspot bundles (-10%), live USD/VND currency conversion, height/weight fit estimator, Wishlist, gift wrapping, idempotent promo codes, and 3-step checkout with dispatch timeline.',
    summaryVi:
      'Website thương mại điện tử phong cách Parisian Editorial sáng cao cấp tích hợp kính mắt Titanium 3D PBR xoay tương tác, 12 SKU đổi góc nhìn kèm bộ lọc đa chiều, điểm nóng Shop-The-Look giảm 10% theo set, đổi tiền tệ USD/VNĐ & song ngữ EN/VI, tính size theo chiều cao/cân nặng, gói quà và checkout 3 bước theo dõi hành trình đơn.',
    metrics: [
      { label: 'RETAIL CATALOG', value: '12 SKUs · 5 CATS' },
      { label: 'GLOBAL COMMERCE', value: 'USD/VND · EN/VI' },
      { label: 'COMMERCE CI SUITE', value: '20 / 20 PASS' },
    ],
    stack: ['React 19', 'Three.js PBR', 'Lenis + GSAP', 'Faceted Filter', 'Zod Checkout', 'View Transitions', 'Vitest'],
    liveUrl: 'https://tvt987.github.io/maison-vera/',
    repoUrl: 'https://github.com/tvt987/maison-vera',
    ciProof: '20/20 Filter, Currency, Bundle & Checkout Vitest PASS (GitHub Actions)',
    topologyNodes: ['Three.js Eyewear', 'Faceted 12-SKU', 'Shop-Look -10%', 'USD/VND Checkout'],
  },
];

export interface ArchitecturalLaw {
  index: string;
  metric: string;
  titleEn: string;
  titleVi: string;
  bodyEn: string;
  bodyVi: string;
}

export const ARCHITECTURAL_LAWS: ArchitecturalLaw[] = [
  {
    index: 'LAW 01',
    metric: '1,200ms -> 41.8ms p99',
    titleEn: 'Hot-Path Allocation Discipline Over ORM Convenience',
    titleVi: 'Kỷ Luật Cấp Phát Bộ Nhớ Trên Đường Nóng Thay Vì Sự Tiện Lợi Của ORM',
    bodyEn:
      'At 5,000+ RPS across 700+ retail stores, EF Core ChangeTracker graphs and dynamic expression trees trigger Gen0/Gen1 GC pauses. Hot transaction paths belong to parameterized Dapper stored procedures, Span-friendly DTOs, and single-roundtrip atomic Redis Lua gates.',
    bodyVi:
      'Ở ngưỡng tải 5.000+ RPS trên 700+ siêu thị, đồ thị theo dõi trạng thái của ORM truyền thống gây áp lực thu gom rác bộ nhớ (GC Pause). Đường nóng giao dịch phải được tối ưu bằng Dapper Stored Procedures tham số hóa và chốt chặn nguyên tử Redis Lua một vòng mạng.',
  },
  {
    index: 'LAW 02',
    metric: '0.000% Double-Spend',
    titleEn: 'Idempotency & Optimistic CAS Are Financial Primitives',
    titleVi: 'Idempotency & Khóa Lạc Quan CAS Là Tiên Đề Toàn Vẹn Tài Chính',
    bodyEn:
      'Mobile networks retry timeouts; cashiers double-click under pressure. Every mutating endpoint enforces SHA-256 payload-hashed Idempotency-Keys (200 replay / 409 payload mutation) backed by SQL RowVersion optimistic compare-and-swap.',
    bodyVi:
      'Mạng di động luôn rớt gói và tự thử lại khi nghẽn. Mọi API thay đổi dữ liệu tiền tệ/tồn kho đều bắt buộc kiểm soát khóa Idempotency băm SHA-256 kết hợp đối soát phiên bản RowVersion nguyên tử dưới cơ sở dữ liệu.',
  },
  {
    index: 'LAW 03',
    metric: '100% OOD Abstention',
    titleEn: 'AI Systems Must Know When To Refuse To Speak',
    titleVi: 'Hệ Thống AI Thực Chiến Phải Biết Từ Chối Trả Lời Khi Thiếu Căn Cứ',
    bodyEn:
      'Unbounded LLM generation in enterprise ops destroys trust. Production RAG requires hybrid lexical + dense vector fusion (BM25 + RRF), strict Pydantic output schemas, inline source citations, and deterministic abstention below calibrated confidence thresholds.',
    bodyVi:
      'Một mô hình ngôn ngữ tự suy diễn khi thiếu tài liệu là rủi ro chí mạng cho vận hành. Hệ thống RAG cấp doanh nghiệp bắt buộc kết hợp tìm kiếm từ khóa BM25 + Vector RRF, ép kiểu Pydantic nghiêm ngặt và tự động từ chối trả lời dưới ngưỡng tin cậy.',
  },
  {
    index: 'LAW 04',
    metric: '4–6h US/EU/APAC Overlap',
    titleEn: 'Autonomous Ownership From Architecture To CI Green',
    titleVi: 'Làm Chủ Trọn Vẹn Từ Thiết Kế Kiến Trúc Đến Khi CI Xanh 100%',
    bodyEn:
      'Zero hand-holding required: clear RFC trade-offs, reproducible benchmarks, containerized deployments, automated xUnit/Pytest/Playwright verification, and frictionless B2B contractor execution across timezones.',
    bodyVi:
      'Tác phong đối tác kỹ thuật độc lập: phân tích đánh đổi rõ ràng, đo đạc benchmark định lượng, đóng gói Docker, kiểm thử tự động đa tầng xanh 100% và bàn giao đúng cam kết milestone cho khách hàng quốc tế lẫn nội địa.',
  },
];

export interface ExperienceMilestone {
  period: string;
  org: string;
  roleEn: string;
  roleVi: string;
  scopeBadge: string;
  bulletsEn: string[];
  bulletsVi: string[];
}

export const EXPERIENCE_LEDGER: ExperienceMilestone[] = [
  {
    period: 'NOV 2023 — PRESENT',
    org: 'CON CUNG CORPORATION',
    roleEn: 'Full-Stack .NET & Applied AI Engineer',
    roleVi: 'Kỹ Sư Full-Stack .NET & Trí Tuệ Nhân Tạo Ứng Dụng',
    scopeBadge: '700+ NATIONWIDE RETAIL STORES · CORE ERP & COMMERCE',
    bulletsEn: [
      'Engineered high-concurrency C# / .NET 8 & Angular voucher, promotion, and 7-tier subscription APIs with SQL Server stored procedures, Dapper mapping, Redis caching, and pre-batch validation.',
      'Implemented Keycloak OAuth 2.0 / OpenID Connect / JWT authentication and granular RBAC across internal retail operations and store-layout planogram data structures.',
      'Integrated semantic vector search into commerce workflows and automated market-intelligence & QA pipelines using Python, FastAPI, Qdrant, n8n, and MCP agent toolchains.',
    ],
    bulletsVi: [
      'Phát triển và tối ưu hệ thống API C# / .NET 8 & Angular quản lý voucher, khuyến mãi, gói hội viên 7 tầng quyền lợi với SQL Server Stored Procedures, Dapper và Redis trên quy mô 700+ siêu thị.',
      'Triển khai xác thực tập trung Keycloak OAuth 2.0 / OIDC / JWT và phân quyền RBAC chi tiết cùng cấu trúc dữ liệu tối ưu trưng bày quầy kệ cửa hàng.',
      'Tích hợp tìm kiếm ngữ nghĩa Vector Search vào cổng thương mại và tự động hóa quy trình thu thập dữ liệu / kiểm thử bằng Python, FastAPI, Qdrant, n8n và Agent MCP.',
    ],
  },
  {
    period: 'SEP 2023 — NOV 2023',
    org: 'FPT SOFTWARE',
    roleEn: 'Frontend Software Engineering Intern',
    roleVi: 'Thực Tập Sinh Kỹ Sư Phần Mềm Frontend',
    scopeBadge: 'ENTERPRISE E-COMMERCE WEB',
    bulletsEn: [
      'Built modular Angular & TypeScript UI workflows, integrated RESTful e-commerce APIs, and resolved cross-device responsive layout bottlenecks.',
    ],
    bulletsVi: [
      'Xây dựng các phân hệ giao diện Angular & TypeScript, tích hợp RESTful API thương mại điện tử và xử lý triệt để tương thích đa thiết bị.',
    ],
  },
  {
    period: '2022 — 2026',
    org: 'UNIVERSITY OF INFORMATION TECHNOLOGY (UIT — VNU-HCM)',
    roleEn: 'B.S. in Information Technology',
    roleVi: 'Cử Nhân Công Nghệ Thông Tin — ĐH Công Nghệ Thông Tin (ĐHQG TP.HCM)',
    scopeBadge: 'HO CHI MINH CITY, VIETNAM',
    bulletsEn: [
      'Focused on Distributed Systems, Database Internals, High-Concurrency Backend Engineering, and Applied Machine Learning / Retrieval Systems.',
    ],
    bulletsVi: [
      'Chuyên sâu Hệ thống phân tán, Kiến trúc cơ sở dữ liệu hiệu năng cao, Kỹ thuật phần mềm chịu tải và Hệ thống truy xuất thông tin thông minh (RAG/LLM).',
    ],
  },
];
