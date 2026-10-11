"use strict";

  const roleConfig = {
    customer_owner: {
      name: "周岚", initial: "周", title: "项目协调人", company: "华星钢铁有限公司",
      nav: [
        ["work", "◉", "当前工作", "1"], ["roadmap", "→", "全年流程"], ["services", "▣", "服务与范围"],
        ["products", "◇", "产品与工厂"], ["data", "▦", "季度数据", "2"],
        ["results", "∿", "计算与成本", "2"], ["deliverables", "□", "报告与交付"],
        ["team", "◎", "团队与权限"]
      ]
    },
    customer_admin: {
      name: "周岚", initial: "周", title: "企业管理员", company: "华星钢铁有限公司",
      nav: [["work", "◉", "当前工作", "1"], ["roadmap", "→", "全年流程"], ["products", "◇", "产品与工厂"], ["data", "▦", "季度数据", "2"], ["results", "∿", "计算与成本", "2"], ["deliverables", "□", "报告与交付"], ["programs", "▣", "年度与订单"], ["team", "◎", "企业与权限", "2"]]
    },
    customer_contrib: {
      name: "陈浩", initial: "陈", title: "数据贡献者", company: "华星钢铁有限公司",
      nav: [["contributor-work", "◉", "分配给我", "2"], ["data", "▦", "我的材料"]]
    },
    customer_approver: {
      name: "赵海峰", initial: "赵", title: "内部审批人", company: "华星钢铁有限公司",
      nav: [["approvals", "✓", "待我审批", "2"], ["deliverables", "□", "合规交付"], ["results", "∿", "结果摘要"]]
    },
    expert: {
      name: "王晨", initial: "王", title: "CBAM 制备专家", company: "Lumino 服务团队",
      nav: [["queue", "◉", "判断队列", "12"], ["case-workspace", "▣", "案件工作台"], ["findings", "!", "Findings", "7"]]
    },
    reviewer: {
      name: "李娜", initial: "李", title: "独立复核专家", company: "Lumino 复核中心",
      nav: [["review", "✓", "复核与锁定", "3"]]
    },
    ops: {
      name: "林晓", initial: "林", title: "客户运营", company: "Lumino 项目中心",
      nav: [["engagements", "▣", "订单履约", "3"], ["workflow-governance", "∿", "状态与责任"], ["portfolio", "◉", "项目组合", "8"], ["handoffs", "→", "交接中心", "2"], ["sla", "◷", "SLA 与阻塞", "5"], ["resources", "◎", "资源与异常"]]
    },
    sales: {
      name: "陈宇", initial: "陈", title: "商务顾问", company: "Lumino 商务中心",
      nav: [["leads", "◉", "线索与客户", "6"], ["quotes", "◇", "报价与合同", "4"], ["accounts", "◎", "客户关系"]]
    },
    importer: {
      name: "Anna", initial: "A", title: "欧盟进口商 / 申报人", company: "NordWerk GmbH",
      nav: [["received-packages", "□", "收到的数据包", "2"], ["importer-questions", "?", "问题与回执", "1"]]
    },
    verifier: {
      name: "Marta", initial: "M", title: "第三方核查员", company: "Veritas Climate GmbH",
      nav: [["verification-cases", "✓", "核查案件", "2"], ["verification-findings", "!", "核查发现", "3"]]
    },
    supplier: {
      name: "刘明", initial: "刘", title: "前体供应商", company: "北方特钢有限公司",
      nav: [["supplier-requests", "→", "数据请求", "2"], ["supplier-history", "□", "已提交记录"]]
    },
    support: {
      name: "许言", initial: "许", title: "平台支持", company: "Lumino 平台团队",
      nav: [["support-cases", "◉", "支持工单", "4"], ["job-health", "◷", "任务运行", "1"]]
    },
    platform_admin: {
      name: "顾清", initial: "顾", title: "平台管理员", company: "Lumino 平台团队",
      nav: [["tenant-governance", "◎", "租户治理"], ["rulepacks", "▣", "规则包"], ["audit-events", "□", "审计与紧急访问", "1"]]
    }
  };

  const years = {
    "2027": { label: "2027 · 待开始", short: "待开始 · 可准备", progress: 8, chip: "warn" },
    "2026": { label: "2026 · Q3 进行中", short: "Q3 数据采集中", progress: 68, chip: "active" },
    "2025": { label: "2025 · 完整归档", short: "已完成 · 已封存", progress: 100, chip: "locked" }
  };

  const annualProfiles = {
    "2025": {
      mode: "archived", defaultQuarter: "Q4", step: 5, progress: 100,
      position: "年度已完成并封存", foundation: "4 个产品 · 2 座工厂 · 监测计划 Rev 2",
      quarters: { Q1: ["已冻结", 100, "ok"], Q2: ["已冻结", 100, "ok"], Q3: ["已冻结", 100, "ok"], Q4: ["已冻结", 100, "ok"] },
      monitoring: ["已锁定 · Rev 2", "2025-03-15"], emissions: ["已核查 · Rev 1", "2026-03-08"], verification: ["核查完成", "无开放 Finding"],
    },
    "2026": {
      mode: "active", defaultQuarter: "Q3", step: 3, progress: 68,
      position: "Q3 数据采集中", foundation: "4 个产品 · 2 座工厂 · 监测计划 Rev 3",
      quarters: { Q1: ["已完成", 100, "ok"], Q2: ["已完成", 100, "ok"], Q3: ["采集中", 68, "warn"], Q4: ["未开始", 0, ""] },
      monitoring: ["当前适用 · Rev 3", "本年度方法已建立"], emissions: ["尚未生成", "年度关账后生成"], verification: ["尚未开始", "年度报告批准后启动"],
    },
    "2027": {
      mode: "planned", defaultQuarter: "Q1", step: 1, progress: 8,
      position: "年度准备 · 待确认范围", foundation: "已引用企业主档 · 产品与工厂待年度确认",
      quarters: { Q1: ["待计划", 0, ""], Q2: ["待计划", 0, ""], Q3: ["待计划", 0, ""], Q4: ["待计划", 0, ""] },
      monitoring: ["待生成年度草稿", "范围确认后开始"], emissions: ["未开始", "等待年度数据"], verification: ["未开始", "等待年度报告"],
    },
  };

  const certificatePrices2026 = {
    Q1: { price: "€75.36", published: "2026-04-07" },
    Q2: { price: "€75.28", published: "2026-07-06" },
    Q3: { price: "€82.32", published: "2026-10-05" },
    Q4: { price: "待发布", published: "预计 2027-01-04" },
  };
  const quarterMeta = {
    Q1: { months: "1–3 月", endMonth: "3 月" },
    Q2: { months: "4–6 月", endMonth: "6 月" },
    Q3: { months: "7–9 月", endMonth: "9 月" },
    Q4: { months: "10–12 月", endMonth: "12 月" },
  };

  const workflowStates = {
    productMaster: {
      label: "企业产品主档", cadence: "企业 × 产品 × 有效期版本", current: "ACTIVE",
      states: ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"],
      next: "核对下一年度引用范围；历史快照不回写"
    },
    cnDecision: {
      label: "CN Code 决定", cadence: "产品 × 编码 × 有效期", current: "UNDER_REVIEW",
      states: ["SUGGESTED", "UNDER_REVIEW", "CONFIRMED", "SUPERSEDED"],
      next: "关务确认 72083900 的商品描述与依据"
    },
    shipment: {
      label: "出口发运匹配", cadence: "发运批次 × 季度 × 进口商", current: "NEEDS_REVIEW",
      states: ["IMPORTED", "MATCHING", "NEEDS_REVIEW", "RECONCILED", "INCLUDED", "FROZEN"],
      next: "确认 EuroFab 退运批次是否排除"
    },
    evidence: {
      label: "证据处理", cadence: "文件版本 × 事实范围", current: "PARSED",
      states: ["UPLOADED", "SECURITY_SCANNED", "PARSED", "CLASSIFIED", "LINKED", "REVIEWED", "ACCEPTED", "ARCHIVED"],
      next: "项目协调人确认账期、设施和提取值"
    },
    calculation: {
      label: "计算运行", cadence: "输入快照 × 规则包 × 价格版本", current: "CURRENT",
      states: ["QUEUED", "RUNNING", "SUCCEEDED", "CURRENT", "STALE", "SUPERSEDED"],
      next: "供应商映射变化后创建 Run 05"
    },
    finding: {
      label: "Finding", cadence: "问题 × 对象 × 来源", current: "VALIDATING",
      states: ["OPEN", "TRIAGED", "ASSIGNED", "RESPONSE_SUBMITTED", "VALIDATING", "RESOLVED", "CLOSED"],
      next: "专家验证客户回应；外部核查 Finding 不可内部风险接受"
    },
    quarterlyPackage: {
      label: "季度数据包", cadence: "季度 × 进口商范围", current: "COLLECTING",
      states: ["NOT_STARTED", "PLANNED", "COLLECTING", "READY_FOR_REVIEW", "APPROVED", "PACKAGE_READY", "SHARED", "ACKNOWLEDGED", "FROZEN"],
      next: "补齐 Q3 天然气账单与 1 批发运数量"
    },
    emissionsReport: {
      label: "设施年度排放报告", cadence: "年度 × 设施", current: "DRAFT",
      states: ["DRAFT", "GENERATED", "VALIDATED", "INTERNAL_REVIEW", "APPROVED", "LOCKED", "SHARED", "DELIVERED", "ACKNOWLEDGED"],
      next: "全年数据齐备后生成上海一厂 Rev 1"
    },
    verification: {
      label: "设施核查报告", cadence: "年度 × 设施 × 核查机构", current: "NOT_STARTED",
      states: ["NOT_STARTED", "PLANNED", "IN_VERIFICATION", "REMEDIATION", "VERIFIED", "DELIVERED", "ACKNOWLEDGED"],
      next: "先完成年度排放报告内部复核"
    },
    importerSupport: {
      label: "进口商年度申报支持包", cadence: "年度 × 进口商", current: "NOT_STARTED",
      states: ["NOT_STARTED", "DRAFT", "VALIDATED", "APPROVED", "LOCKED", "SHARED", "ACKNOWLEDGED"],
      next: "等待年度核查结论；正式申报由欧盟申报人完成"
    },
    serviceOrder: {
      label: "Lumino 服务订单", cadence: "订单版本", current: "ACTIVE",
      states: ["DRAFT", "PENDING_CUSTOMER_CONFIRMATION", "SIGNED_PENDING_HANDOFF", "PENDING_OPS_ACCEPTANCE", "ACTIVATING", "ACTIVE", "PENDING_ACCEPTANCE", "COMPLETED", "CLOSED"],
      next: "下一里程碑：Q3 数据包交付"
    },
    workPackage: {
      label: "专家工作包", cadence: "任务授权", current: "IN_PROGRESS",
      states: ["DRAFT", "READY", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "DONE"],
      next: "王晨提交 Run 05；李娜独立复核"
    },
    handoff: {
      label: "跨角色交接", cadence: "交接单 × 工作包", current: "SENT",
      states: ["PROPOSED", "SENT", "ACCEPTED", "CLOSED"],
      next: "运营接收商务交接后启动 SLA"
    },
    approval: {
      label: "具名审批", cadence: "决定对象 × 版本", current: "IN_REVIEW",
      states: ["PENDING", "IN_REVIEW", "APPROVED", "WITHDRAWN", "SUPERSEDED"],
      next: "内部审批人查看差异、依据和影响后决定"
    }
  };

  const workflowObjectRefs = {
    productMaster: ["PRD-HRC-01", "productMaster"], cnDecision: ["CN-HRC-72083900", "cnDecision"], shipment: ["SHP-2026-Q3-EUROFAB", "shipment"],
    evidence: ["EVD-2026-Q3-POWER", "evidence"], calculation: ["RUN-04", "calculationRun"], finding: ["FND-PRE-004", "finding"],
    quarterlyPackage: ["PKG-2026-Q3-NORDWERK", "quarterlyPackage"], emissionsReport: ["OER-2026-SH01-R1", "formalArtifact"],
    verification: ["VER-2026-SH01", "verification"], importerSupport: ["IDS-2026-NORDWERK-R1", "formalArtifact"],
    serviceOrder: ["SO-2026-018-R2", "serviceOrder"], workPackage: ["WP-CALC-026", "workPackage"], handoff: ["HO-2026-043", "handoff"], approval: ["AP-2026-014", "approval"],
  };

  const workflowEngine = new window.LuminoWorkflow.WorkflowEngine({ storage: window.localStorage });
  workflowEngine.seed([
    { id: "PRD-HRC-01", type: "productMaster", status: "ACTIVE", owner: "周岚", scope: "热轧非合金钢卷" },
    { id: "CN-HRC-72083900", type: "cnDecision", status: "UNDER_REVIEW", owner: "关务负责人", scope: "PRD-HRC-01" },
    { id: "SHP-2026-Q3-EUROFAB", type: "shipment", status: "NEEDS_REVIEW", owner: "外贸负责人", year: "2026", quarter: "Q3", scope: "EuroFab S.r.l." },
    { id: "EVD-2026-Q3-POWER", type: "evidence", status: "ACCEPTED", owner: "周岚", year: "2026", quarter: "Q3", scope: "上海一厂电力账单" },
    { id: "FACT-2026-Q3-GAS", type: "fact", status: "MISSING", owner: "周岚", year: "2026", quarter: "Q3", scope: "江苏二厂天然气用量" },
    { id: "RUN-04", type: "calculationRun", status: "CURRENT", owner: "王晨", year: "2026", quarter: "Q3", dependsOn: ["FACT-2026-Q3-GAS"], metadata: { rulepack: "EU-CBAM-2026.3" } },
    { id: "FND-PRE-004", type: "finding", status: "OPEN", owner: "王晨", year: "2026", quarter: "Q3", metadata: { source: "INTERNAL", severity: "HIGH" } },
    { id: "PKG-2026-Q3-NORDWERK", type: "quarterlyPackage", status: "COLLECTING", owner: "周岚", year: "2026", quarter: "Q3", scope: "NordWerk GmbH" },
    { id: "OER-2026-SH01-R1", type: "formalArtifact", status: "DRAFT", owner: "王晨", year: "2026", scope: "上海浦东一厂", metadata: { artifactType: "OPERATOR_EMISSIONS_REPORT" } },
    { id: "VER-2026-SH01", type: "verification", status: "NOT_STARTED", owner: "Veritas Climate GmbH", year: "2026", scope: "上海浦东一厂" },
    { id: "IDS-2026-NORDWERK-R1", type: "formalArtifact", status: "DRAFT", owner: "林晓", year: "2026", scope: "NordWerk GmbH", metadata: { artifactType: "IMPORTER_DECLARATION_SUPPORT" } },
    { id: "SO-2026-018-R2", type: "serviceOrder", status: "ACTIVE", owner: "林晓", year: "2026", scope: "华星钢铁 CBAM 全流程服务" },
    { id: "WP-CALC-026", type: "workPackage", status: "IN_PROGRESS", owner: "王晨", year: "2026", scope: "计算与报告制备" },
    { id: "HO-2026-043", type: "handoff", status: "SENT", owner: "林晓", year: "2026", scope: "商务 → 运营" },
    { id: "AP-2026-014", type: "approval", status: "IN_REVIEW", owner: "赵海峰", year: "2026", scope: "默认值并行路径" },
  ]);

  const defaultPages = { customer_admin: "work", customer_owner: "work", customer_contrib: "contributor-work", customer_approver: "approvals", expert: "queue", reviewer: "review", ops: "engagements", sales: "leads", importer: "received-packages", verifier: "verification-cases", supplier: "supplier-requests", support: "support-cases", platform_admin: "tenant-governance" };
  const incoming = new URLSearchParams(window.location.search);
  const importedTrial = incoming.get("source") === "calculator" ? {
    year: incoming.get("year") || "2027",
    cnCode: incoming.get("cnCode") || "72081000",
    sector: incoming.get("sector") || "Iron and Steel",
    quantity: Number(incoming.get("quantity")) || 10000,
    estimatedCostCny: Number(incoming.get("estimatedCostCny")) || 3822222,
  } : null;
  const portalStateStorageKey = "lumino-cbam-portal-ui-v1";
  let restoredPortalState = {};
  try { restoredPortalState = JSON.parse(window.localStorage.getItem(portalStateStorageKey) || "{}"); } catch (_) { restoredPortalState = {}; }
  const state = {
    role: "customer_owner", page: "work", year: "2026", quarter: "Q3", loggedIn: false, answer: null,
    importedTrial, uploadAdded: false, factConfirmed: false, findingResolved: false,
    yearCreated: false, deliveryExpanded: null, productAdded: false,
    configurationAdded: false, orgEditing: false, selectedProduct: "hrc",
    productYears: [], productCnCodes: [], questionHelpOpen: false, findingChoiceOpen: false, dataPathChoice: null,
    drawer: null, periodData: {}, productOverrides: {}, configurationDrafts: {}, facilities: [], invitedMembers: [], actionBusy: false,
    onboardingDismissed: window.localStorage.getItem("lumino-portal-onboarding") === "dismissed", online: navigator.onLine,
    organization: { name: "华星钢铁有限公司", code: "91310000••••••••3X", address: "上海市浦东新区临港工业区 88 号" },
    ...restoredPortalState,
  };
  if (state.yearCreated && !years["2028"]) years["2028"] = { label: "2028 · 变化确认", short: "变化确认中", progress: 8, chip: "warn" };
  const $ = (selector) => document.querySelector(selector);
