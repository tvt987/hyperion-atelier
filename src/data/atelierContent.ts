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
    year: '2025–2026',
    domainTag: 'FLASH-SALE FINANCIAL INTEGRITY',
    title: 'High-Concurrency Voucher Redemption Engine',
    subtitleEn: 'Atomic Redis 7 Lua Scripting + SQL Server 2022 RowVersion + Dapper Zero-Alloc Pipelines',
    subtitleVi: 'Kịch bản nguyên tử Redis 7 Lua + Khóa lạc quan RowVersion SQL Server 2022 + Dapper tối ưu bộ nhớ',
    summaryEn:
      'Engineered from battle-tested patterns across 700+ nationwide hypermarkets: pre-loaded single-threaded Redis Lua scripts reject 90%+ over-quota traffic in under 1ms before surviving requests commit via parameterized Dapper stored procedures and optimistic RowVersion concurrency tokens.',
    summaryVi:
      'Đúc kết từ kiến trúc vận hành thực tế trên chuỗi 700+ siêu thị toàn quốc: kịch bản Redis Lua đơn luồng chặn sớm hơn 90% truy vấn vượt hạn ngạch dưới 1ms trước khi các giao dịch hợp lệ đối soát khóa lạc quan RowVersion qua Dapper Stored Procedures.',
    metrics: [
      { label: 'STRESS BENCHMARK', value: '5,000+ RPS' },
      { label: 'TAIL LATENCY P99', value: '41.8 ms' },
      { label: 'RACE CONDITIONS', value: '0.000%' },
    ],
    stack: ['.NET 8', 'Dapper', 'SQL Server 2022', 'Redis 7 Lua', 'RowVersion', 'k6 Stress', 'xUnit'],
    repoUrl: 'https://github.com/tvt987/high-concurrency-voucher-engine',
    ciProof: '5/5 xUnit Concurrency Integration Suite PASS',
    topologyNodes: ['700+ POS Edge', 'Redis EVALSHA', 'Dapper StoredProc', 'RowVersion Commit'],
  },
  {
    plateNo: 'PLATE 03',
    year: '2025',
    domainTag: 'FAULT-TOLERANT PARTNER GATEWAY',
    title: 'Resilient Partner Integration BFF & Quorum DLQ',
    subtitleEn: 'Polly v8 Circuit Breaker + RabbitMQ Quorum Queues + Constant-Time HMAC Auth',
    subtitleVi: 'Ngắt mạch tự thích nghi Polly v8 + Hàng đợi RabbitMQ Quorum DLQ + Xác thực khóa hằng thời gian',
    summaryEn:
      'Shields core checkout pipelines when upstream payment or ERP gateways suffer 40% latency blackouts: trips Polly v8 circuit state to OPEN within milliseconds, deflects partner payloads into durable RabbitMQ Quorum Dead-Letter exchanges, and enforces strict 202/409 idempotent replay semantics.',
    summaryVi:
      'Bảo vệ đường ống thanh toán lõi khi đối tác cổng thanh toán hoặc ERP gặp sự cố timeout 40%: kích hoạt ngắt mạch Polly v8 dưới 1ms, điều hướng gói tin sang hàng đợi bền vững RabbitMQ Quorum DLQ và đảm bảo ngữ nghĩa chống lặp 202/409.',
    metrics: [
      { label: 'FAIL-FAST TRIP', value: '< 1.0 ms' },
      { label: 'MESSAGE LOSS', value: '0.00%' },
      { label: 'INTEGRATION SUITE', value: '54 / 54 PASS' },
    ],
    stack: ['.NET 8', 'Polly v8', 'RabbitMQ Quorum', 'FluentValidation', 'ProblemDetails', 'Docker'],
    repoUrl: 'https://github.com/tvt987/partner-integration-bff',
    ciProof: '54/54 WebApplicationFactory & Resilience Tests PASS',
    topologyNodes: ['Partner Webhook', 'Constant-Time Auth', 'Polly Circuit', 'RabbitMQ DLQ'],
  },
  {
    plateNo: 'PLATE 04',
    year: '2025–2026',
    domainTag: 'GROUNDED ENTERPRISE APPLIED AI',
    title: 'Hybrid Retail RAG Assistant & Abstention Engine',
    subtitleEn: 'FastAPI + Qdrant Vector Search + Sparse Lexical Fusion + Citation Verification',
    subtitleVi: 'Truy xuất lai FastAPI + Qdrant Vector + Đối chiếu từ khóa chính xác SKU & Kiểm chứng trích dẫn',
    summaryEn:
      'Eliminates dense-embedding SKU confusion on exact alphanumeric retail codes by fusing lexical retrieval with dense vector similarity, enforcing calibrated confidence thresholds, inline document citations, and deterministic extractive fallback whenever upstream LLM endpoints degrade.',
    summaryVi:
      'Khắc phục triệt để điểm mù mã SKU của vector thuần bằng kiến trúc truy xuất lai từ khóa + Qdrant dense embeddings, kiểm soát ngưỡng tự tin chống bịa đặt, gắn trích dẫn nguồn minh bạch và tự động chuyển sang trích xuất tất định khi LLM gặp sự cố.',
    metrics: [
      { label: 'SKU RECALL', value: '98.4%' },
      { label: 'FAITHFULNESS', value: '99.2%' },
      { label: 'PYTEST SUITE', value: '18 / 18 PASS' },
    ],
    stack: ['Python 3.12', 'FastAPI', 'Qdrant', 'LangChain LCEL', 'Pydantic v2', 'Pytest'],
    repoUrl: 'https://github.com/tvt987/retail-rag-assistant',
    ciProof: '18/18 Groundedness & Citation Suite PASS',
    topologyNodes: ['PDF/MD Chunker', 'Qdrant + Lexical', 'Confidence Gate', 'Cited Synthesis'],
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
