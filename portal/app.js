(function () {
  "use strict";

  const roleConfig = {
    customer_owner: {
      name: "周岚", initial: "周", title: "项目协调人", company: "华星钢铁有限公司",
      nav: [
        ["work", "◉", "我的工作", "3"], ["roadmap", "→", "操作指南"], ["services", "▣", "我的服务"],
        ["products", "◇", "产品与供应链"], ["data", "▦", "数据与证据", "2"],
        ["results", "∿", "成本与结果", "2"], ["deliverables", "□", "合规交付"],
        ["team", "◎", "团队与权限"]
      ]
    },
    customer_admin: {
      name: "周岚", initial: "周", title: "企业管理员", company: "华星钢铁有限公司",
      nav: [["services", "▣", "服务与订单", "1"], ["programs", "→", "年度项目"], ["team", "◎", "成员与授权", "2"], ["org-settings", "◇", "企业主档"]]
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
      nav: [["engagements", "▣", "订单履约", "3"], ["portfolio", "◉", "项目组合", "8"], ["handoffs", "→", "交接中心", "2"], ["sla", "◷", "SLA 与阻塞", "5"], ["resources", "◎", "资源与异常"]]
    },
    sales: {
      name: "陈宇", initial: "陈", title: "商务顾问", company: "Lumino 商务中心",
      nav: [["leads", "◉", "线索与客户", "6"], ["quotes", "◇", "报价与合同", "4"], ["accounts", "◎", "客户关系"]]
    }
  };

  const years = {
    "2027": { label: "2027 · 数据采集中", short: "数据采集中", progress: 62, chip: "active" },
    "2026": { label: "2026 · 核查整改", short: "核查整改中", progress: 88, chip: "warn" },
    "2025": { label: "2025 · 已锁定", short: "已锁定 · Rev 1", progress: 100, chip: "locked" }
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

  const defaultPages = { customer_admin: "services", customer_owner: "work", customer_contrib: "contributor-work", customer_approver: "approvals", expert: "queue", reviewer: "review", ops: "engagements", sales: "leads" };
  const incoming = new URLSearchParams(window.location.search);
  const importedTrial = incoming.get("source") === "calculator" ? {
    year: incoming.get("year") || "2027",
    cnCode: incoming.get("cnCode") || "72081000",
    sector: incoming.get("sector") || "Iron and Steel",
    quantity: Number(incoming.get("quantity")) || 10000,
    estimatedCostCny: Number(incoming.get("estimatedCostCny")) || 3822222,
  } : null;
  const state = {
    role: "customer_owner", page: "work", year: "2027", quarter: "Q3", loggedIn: false, answer: null,
    importedTrial, uploadAdded: false, factConfirmed: false, findingResolved: false,
    yearCreated: false, deliveryExpanded: null, productAdded: false,
    configurationAdded: false, orgEditing: false, selectedProduct: "hrc",
    productYears: [], productCnCodes: [], questionHelpOpen: false, findingChoiceOpen: false, dataPathChoice: null,
    drawer: null, periodData: {}, productOverrides: {}, configurationDrafts: {}, facilities: [], invitedMembers: [],
    organization: { name: "华星钢铁有限公司", code: "91310000••••••••3X", address: "上海市浦东新区临港工业区 88 号" },
  };
  const $ = (selector) => document.querySelector(selector);
  const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

  const customerRoles = new Set(["customer_admin", "customer_owner", "customer_contrib", "customer_approver"]);
  const isCustomer = () => customerRoles.has(state.role);
  const isLockedYear = () => years[state.year]?.chip === "locked";
  const canManageOrganization = () => state.role === "customer_admin";
  const canCreateYear = () => state.role === "customer_admin";

  function periodKey() { return `${state.year}-${state.quarter}`; }

  function savePeriodState() {
    state.periodData[periodKey()] = {
      uploadAdded: state.uploadAdded,
      factConfirmed: state.factConfirmed,
      findingResolved: state.findingResolved,
      findingChoiceOpen: state.findingChoiceOpen,
      dataPathChoice: state.dataPathChoice,
      answer: state.answer,
    };
  }

  function loadPeriodState() {
    const saved = state.periodData[periodKey()] || {};
    state.uploadAdded = Boolean(saved.uploadAdded);
    state.factConfirmed = Boolean(saved.factConfirmed);
    state.findingResolved = Boolean(saved.findingResolved);
    state.findingChoiceOpen = Boolean(saved.findingChoiceOpen);
    state.dataPathChoice = saved.dataPathChoice || null;
    state.answer = saved.answer || null;
  }

  function iconLabel(role) {
    if (customerRoles.has(role)) return "客户企业";
    return { expert: "制备专家", reviewer: "独立复核", ops: "运营视图", sales: "商务视图" }[role];
  }

  function pageHeader(eyebrow, title, aside = "") {
    return `<header class="page-head"><div><p>${eyebrow}</p><h1>${title}</h1></div>${aside}</header>`;
  }

  function actionButton(label, variant = "primary", attributes = "") {
    return `<button class="button button--${variant}" type="button" ${attributes}>${label}</button>`;
  }

  function statusChip(label, tone = "") {
    return `<span class="status-chip ${tone}">${label}</span>`;
  }

  function login(role) {
    state.role = role || "customer_owner";
    if (state.role === "customer_admin") state.year = "2027";
    if (state.role === "customer_owner" && state.importedTrial && years[state.importedTrial.year]) state.year = state.importedTrial.year;
    state.page = defaultPages[state.role];
    state.loggedIn = true;
    $("#loginScreen").hidden = true;
    $("#portal").hidden = false;
    $("#roleSelect").value = state.role;
    $("#settingsButton").hidden = !canManageOrganization();
    syncShell();
    render();
    window.scrollTo(0, 0);
  }

  function logout() {
    state.loggedIn = false;
    $("#portal").hidden = true;
    $("#loginScreen").hidden = false;
    $("#sidebar").classList.remove("open");
    $("#mobileMenu").setAttribute("aria-expanded", "false");
  }

  function syncShell() {
    const config = roleConfig[state.role];
    $("#settingsButton").hidden = !canManageOrganization();
    $("#companyName").textContent = isCustomer() ? state.organization.name : config.company;
    $("#profileName").textContent = config.name;
    $("#profileInitial").textContent = config.initial;
    $("#profileRole").textContent = config.title;
    document.querySelector(".project-period").hidden = !isCustomer() || state.role === "customer_admin";
    $("#yearSelect").innerHTML = Object.entries(years).map(([value, data]) => `<option value="${value}">${data.label}</option>`).join("") + (canCreateYear() ? `<option value="new">＋ 创建新年度</option>` : "");
    $("#yearSelect").value = state.year;
    $("#quarterSelect").value = state.quarter;
    $("#roleNav").innerHTML = `<p class="nav-label">${iconLabel(state.role)}</p>` + config.nav.map(([id, icon, label, badge]) => `
      <button class="nav-item ${state.page === id ? "active" : ""}" type="button" data-page="${id}" ${state.page === id ? 'aria-current="page"' : ""}>
        <span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ""}
      </button>`).join("");
    $("#settingsButton").classList.toggle("active", state.page === "org-settings");
    if (state.page === "org-settings") $("#settingsButton").setAttribute("aria-current", "page");
    else $("#settingsButton").removeAttribute("aria-current");
  }

  function render() {
    syncShell();
    if (isCustomer()) renderCustomer();
    if (state.role === "expert") renderExpert();
    if (state.role === "reviewer") renderStaffSecondary("reviewer");
    if (state.role === "ops") renderOps();
    if (state.role === "sales") renderSales();
    document.title = `${roleConfig[state.role].nav.find(([id]) => id === state.page)?.[2] || "CBAM 工作门户"} · Lumino`;
  }

  function yearBadge() {
    const data = years[state.year];
    return statusChip(data.short, data.chip === "warn" ? "warn" : data.chip === "locked" ? "locked" : "");
  }

  function nextAction(kicker, title, description, label, attributes) {
    return `<section class="next-action" aria-label="下一步"><div><small>${kicker}</small><strong>${title}</strong><p>${description}</p></div><button class="button button--primary" type="button" ${attributes}>${label}<span aria-hidden="true">→</span></button></section>`;
  }

  function formField(label, control, hint = "") {
    return `<label class="drawer-field"><span>${label}</span>${control}${hint ? `<small>${hint}</small>` : ""}</label>`;
  }

  function drawerForm(id, intro, fields, submitLabel = "保存") {
    return `<form class="drawer-form" data-drawer-form="${id}"><p class="drawer-intro">${intro}</p><div class="drawer-fields">${fields}</div><footer class="drawer-actions"><button class="button button--secondary" type="button" data-close-drawer>取消</button><button class="button button--primary" type="submit">${submitLabel}</button></footer></form>`;
  }

  function drawerTemplate(id, context = {}) {
    const commonRole = `<div class="drawer-context"><span>${iconLabel(state.role)}</span><strong>${roleConfig[state.role].name}</strong><small>${roleConfig[state.role].company}</small></div>`;
    const baseProductYears = { hrc: ["2026", "2027"], coated: ["2027"], section: ["2026", "2027"], wire: ["2027"], cold: state.productYears };
    const yearChecks = (selectedYears = []) => Object.entries(years)
      .filter(([, data]) => data.chip !== "locked")
      .map(([year]) => `<label><input type="checkbox" name="productYears" value="${year}" ${selectedYears.includes(year) ? "checked" : ""}>${year}</label>`)
      .join("");
    const newProductYearChecks = yearChecks([]);
    const managedProductYearChecks = yearChecks(state.productOverrides[state.selectedProduct]?.scope || baseProductYears[state.selectedProduct] || []);
    const templates = {
      "upload-evidence": ["QUARTERLY EVIDENCE", `上传 ${state.year} ${state.quarter} 材料`, drawerForm("upload-evidence", "上传后先进入 Agent 提取区。只有你确认账期、设施和数值后，材料才会进入正式事实建议。", `${formField("材料类型", '<select name="type"><option>能源账单</option><option>产量台账</option><option>发运台账</option><option>供应商排放数据</option><option>其他证明</option></select>')}${formField("所属设施", '<select name="facility"><option>上海浦东一厂</option><option>江苏二厂</option><option>暂不确定</option></select>')}${formField("数据期间", `<input name="period" value="${state.year} ${state.quarter}" readonly>`)}<label class="upload-drop"><input name="file" type="file" required><strong>选择文件或拖到这里</strong><small>PDF、XLSX、CSV、JPG；单个文件不超过 30 MB</small></label>${formField("补充说明", '<textarea name="note" rows="3" placeholder="例如：账单同时覆盖两座设施"></textarea>')}`, "上传并交给 Agent")],
      "new-product": ["ENTERPRISE PRODUCT MASTER", "新增产品主档", drawerForm("new-product", "产品属于企业长期主档，不必绑定某一年。可以先创建，再由 Agent 或关务人员补充 CN Code。", `${formField("产品名称", '<input name="productName" value="冷轧非合金钢板" required>')}${formField("内部编码", '<input name="internalCode" value="CRS-02" required>')}${formField("CN Code 候选", '<input name="cnCodes" placeholder="如 72091690；多个用逗号分隔">', "可留空；候选不会自动成为已确认编码")}<fieldset class="drawer-field drawer-fieldset"><legend>初始年度范围（可选）</legend><div class="check-grid">${newProductYearChecks}</div><small>这里只列出已创建且未锁定的年度；也可以稍后再纳入。</small></fieldset>`, "创建产品主档")],
      "edit-product": ["PRODUCT MASTER", "编辑产品主档", drawerForm("edit-product", "主档变更会形成新版本，不覆盖锁定年度中的历史快照。", `${formField("产品名称", `<input name="productName" value="${safe(context.name || "热轧非合金钢卷")}" required>`)}${formField("内部编码", `<input name="internalCode" value="${safe(context.code || "HRC-01")}" required>`)}${formField("变更生效日", '<input name="effectiveDate" type="date" value="2026-10-10">')}${formField("变更原因", '<textarea name="reason" rows="4" required placeholder="说明为何修改产品主档"></textarea>')}`, "保存为新版本")],
      "manage-cn": ["CN CODE MANAGEMENT", "管理 CN Code", drawerForm("manage-cn", "同一企业产品可以保留多个候选编码。最终确认需要记录依据、确认人和有效期。", `<div class="code-candidate"><div><strong>72083900</strong><small>候选 · Agent 根据产品说明建议</small></div><span class="record-state warn">待关务确认</span></div><div class="code-candidate"><div><strong>72083800</strong><small>历史候选 · 2026 年使用</small></div><span class="record-state">历史</span></div>${formField("新增候选 CN Code", '<input name="cnCode" inputmode="numeric" placeholder="8 位 CN Code">')}${formField("建议依据", '<textarea name="basis" rows="3" placeholder="产品说明、材质、规格或关务意见"></textarea>')}`, "保存候选")],
      "manage-years": ["ANNUAL SCOPE", "管理适用年度", drawerForm("manage-years", "年度项目引用产品主档。纳入或移除只影响该年度范围，不删除企业产品和历史数据。", `<fieldset class="drawer-field drawer-fieldset"><legend>开放年度</legend><div class="check-grid">${managedProductYearChecks}</div></fieldset><div class="locked-row"><strong>2025 · 已锁定</strong><span>只能通过 Amendment Revision 调整</span></div>`, "更新年度范围")],
      "new-configuration": ["PRODUCTION CONFIGURATION", "新增生产配置", drawerForm("new-configuration", "同一销售产品可以按工厂、工艺和前体来源建立多条配置，分别核算后汇总。", `${formField("生产设施", '<select name="facility" required><option value="">请选择</option><option>上海浦东一厂</option><option>江苏二厂</option></select>')}${formField("主要工艺", '<select name="process" required><option value="">请选择</option><option>高炉—转炉长流程</option><option>电弧炉</option><option>仅轧制/加工</option><option>暂不确定，让 Agent 询问</option></select>')}${formField("前体来源", '<select name="precursor" required><option>自产</option><option>外购</option><option>自产与外购并存</option><option>暂不确定</option></select>')}${formField("区分依据", '<input name="basis" placeholder="例如采购批次、订单号或产线">')}`, "创建配置草稿")],
      "service-scope": ["SERVICE ORDER", "申请服务范围变更", drawerForm("service-scope", "变更不会立即覆盖当前服务订单；运营确认影响、费用与 SLA 后生成新版本。", `${formField("变更类型", '<select><option>新增产品</option><option>新增设施</option><option>新增进口商</option><option>增加核查支持</option><option>其他</option></select>')}${formField("期望生效时间", '<input type="date" value="2026-11-01">')}${formField("业务原因", '<textarea rows="4" required></textarea>')}`, "提交变更申请")],
      "shipping-import": ["SHIPMENT LEDGER", "导入出口发运台账", drawerForm("shipping-import", "系统先预览列映射、重复批次和进口商范围，不会直接覆盖已对账记录。", `${formField("数据期间", `<select name="period"><option>${state.year} ${state.quarter}</option><option>${state.year} 全年</option></select>`)}<label class="upload-drop"><input name="file" type="file" accept=".xlsx,.csv" required><strong>选择 XLSX 或 CSV</strong><small>建议字段：报关单号、发运日、进口商、产品、CN Code、数量</small></label>${formField("重复记录处理", '<select name="duplicatePolicy"><option>停止并让我确认</option><option>仅导入新批次</option></select>')}`, "进入映射预览")],
      "document-preview": ["DOCUMENT PREVIEW", "交付文件预览", `<div class="document-sheet"><small>PREVIEW · NOT FOR SUBMISSION</small><h3>${state.deliveryExpanded === "emissions" ? "年度排放报告" : state.deliveryExpanded === "verification" ? "Verification Package" : "年度监测计划 / 监测报告"}</h3><dl><div><dt>企业</dt><dd>华星钢铁有限公司</dd></div><div><dt>年度</dt><dd>${state.year}</dd></div><div><dt>计算版本</dt><dd>Run 04</dd></div><div><dt>规则版本</dt><dd>EU-CBAM-${state.year}.1</dd></div><div><dt>开放缺口</dt><dd>2 项</dd></div></dl><p>正式导出前将执行字段完整性、数据血缘、制备/复核职责分离和版本锁定检查。</p></div><footer class="drawer-actions"><button class="button button--secondary" type="button" data-close-drawer>关闭</button><button class="button button--primary" type="button" data-drawer="generic-action" data-drawer-label="生成带水印 PDF">生成带水印 PDF</button></footer>`],
      "invite-member": ["ORGANIZATION ACCESS", "邀请成员", drawerForm("invite-member", "成员权限由企业、年度、设施和任务范围共同决定。邀请不会默认开放全量生产数据。", `${formField("工作邮箱", '<input name="email" type="email" required placeholder="name@company.com">')}${formField("企业角色", '<select name="role"><option>数据贡献者</option><option>项目协调人</option><option>内部审批人</option><option>企业管理员</option></select>')}${formField("数据范围", '<select name="scope"><option>仅分配给我的任务</option><option>上海浦东一厂</option><option>江苏二厂</option><option>当前年度全部设施</option></select>')}${formField("授权期限", '<input name="expiresAt" type="date" value="2027-03-31">')}`, "发送邀请")],
      "permission-audit": ["ACCESS AUDIT", "有效权限与继承来源", `<div class="audit-list"><article><span>周岚</span><strong>企业管理员 + 项目协调人</strong><p>企业角色 → 全部年度；项目角色 → SO-2027-018。最近访问：今天 09:12。</p></article><article><span>王晨</span><strong>制备专家</strong><p>服务订单授权 → 2027 年度、2 座设施；不包含成员管理和最终复核。</p></article><article><span>NordWerk GmbH</span><strong>外部接收方</strong><p>仅可下载已分享的产品与期间交付包；不可查看其他进口商或原始账单。</p></article></div>`],
      "organization-edit": ["ENTERPRISE MASTER", "编辑企业资料", drawerForm("organization-edit", "企业资料属于长期主档。变更按生效日期形成版本，锁定年度继续引用原快照。", `${formField("法定名称", `<input name="organizationName" value="${safe(state.organization.name)}" required>`)}${formField("统一社会信用代码", `<input name="organizationCode" value="${safe(state.organization.code)}" required>`)}${formField("注册地址", `<textarea name="organizationAddress" rows="3">${safe(state.organization.address)}</textarea>`)}${formField("生效日期", '<input name="effectiveDate" type="date" value="2026-10-10">')}`, "保存企业主档版本")],
      "new-facility": ["FACILITY MASTER", "新建生产设施", drawerForm("new-facility", "设施先进入企业主档，再选择纳入哪些年度项目。年度产量和能耗不会随设施主档复制。", `${formField("设施名称", '<input name="facilityName" required placeholder="例如：广东三厂">')}${formField("内部编码", '<input name="facilityCode" required placeholder="例如：GD-03">')}${formField("地址", '<textarea name="address" rows="3" required></textarea>')}${formField("主要生产活动", '<input name="activity" placeholder="例如：电弧炉炼钢与热轧">')}${formField("初始状态", '<select name="status"><option>在建</option><option>试生产</option><option>在用</option></select>')}`, "创建设施主档")],
      "generic-action": [context.eyebrow || "ACTION", context.title || "完成操作", drawerForm("generic-action", context.description || "补充必要信息后执行。动作、理由和影响范围会写入审计记录。", `${commonRole}${formField(context.fieldLabel || "处理说明", `<textarea rows="4" required placeholder="${context.placeholder || "说明处理内容或判断依据"}"></textarea>`)}${formField("责任人", '<select><option>我负责</option><option>转交项目协调人</option><option>转交制备专家</option><option>转交运营</option></select>')}${formField("期望完成时间", '<input type="date" value="2026-10-15">')}`, context.submitLabel || "确认并记录")],
      "record-detail": [context.eyebrow || "DETAIL", context.title || "记录详情", `<div class="detail-ledger">${commonRole}<dl><div><dt>对象</dt><dd>${context.object || "华星钢铁 · 2027"}</dd></div><div><dt>当前状态</dt><dd>${context.status || "处理中"}</dd></div><div><dt>负责人</dt><dd>${context.owner || roleConfig[state.role].name}</dd></div><div><dt>权限范围</dt><dd>${context.scope || "当前服务订单与已授权数据"}</dd></div><div><dt>最近更新</dt><dd>今天 09:20</dd></div></dl><section><strong>当前需要处理</strong><p>${context.description || "查看记录、确认下一步，并保留处理依据。"}</p></section></div><footer class="drawer-actions"><button class="button button--secondary" type="button" data-close-drawer>关闭</button>${context.action ? `<button class="button button--primary" type="button" data-drawer="generic-action" data-drawer-label="${context.action}">${context.action}</button>` : ""}</footer>`],
    };
    return templates[id] || templates["record-detail"];
  }

  let drawerReturnFocus = null;
  function openDrawer(id, context = {}) {
    drawerReturnFocus = document.activeElement;
    state.drawer = { id, context };
    const [eyebrow, title, body] = drawerTemplate(id, context);
    $("#drawerEyebrow").textContent = eyebrow;
    $("#drawerTitle").textContent = title;
    $("#drawerBody").innerHTML = body;
    $("#drawerLayer").hidden = false;
    $("#drawer").querySelector("button, input, select, textarea, [href]")?.focus();
    $("#portal").inert = true;
    $("#portal").setAttribute("aria-hidden", "true");
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    $("#drawerLayer").hidden = true;
    $("#portal").inert = false;
    $("#portal").removeAttribute("aria-hidden");
    document.body.classList.remove("drawer-open");
    state.drawer = null;
    drawerReturnFocus?.focus?.();
  }

  function customerQuestion() {
    if (state.year === "2028") return `
      <p class="question-count">年度变化确认 · 第 1 项</p>
      <h2>2028 年还会使用这 2 个生产设施吗？</h2>
      <p class="why">我从 2027 年带入的是设施结构，不是年度数值。确认后，我会继续询问新增生产线、产品和供应商变化。</p>
      <div class="answer-row"><button class="answer-button" data-answer="设施没有变化">是，没有变化</button><button class="answer-button" data-answer="设施发生变化">有新增或停用</button><button class="answer-button secondary" data-answer="不确定">我不确定</button><button class="answer-button secondary" data-answer="delegate">交给生产同事</button></div>`;
    if (state.year === "2025") return `
      <div class="locked-banner"><b aria-hidden="true">⌾</b><p><strong>2025 年度已锁定。</strong><br>这是交付时的 Rev 1 快照。如需更正，将创建新的 Amendment Revision。</p></div>`;
    if (state.year === "2026") return `
      <p class="question-count">核查问题 · FINDING #18</p>
      <h2>核查员想确认：5 月电耗比其他月份高，是因为产量增加了吗？</h2>
      <p class="why">我们已经整理了电费单和月度产量。你只需要说明当月发生了什么，专家会处理报告修订。</p>
      <div class="answer-row"><button class="answer-button" data-answer="产量增加">是，产量增加</button><button class="answer-button" data-answer="设备检修">不是，设备检修</button><button class="answer-button secondary" data-answer="不确定">我不确定</button><button class="answer-button secondary" data-answer="delegate">交给生产同事</button></div>`;
    if (state.answer) return `
      <div class="agent-result"><strong>已记录：${state.answer === "delegate" ? "已交给生产负责人" : state.answer}</strong><p>Agent 已更新待确认理解，正式数据不会被直接覆盖。</p><button class="text-button" type="button" data-action="revise-answer">修改回答</button></div>`;
    return `
      <p class="question-count">今天第 1 个问题 · 预计 1 分钟</p>
      <h2>生产热轧卷时使用的钢坯，是你们自己生产的吗？</h2>
      <p class="why">这会决定钢坯的排放数据从内部生产记录获取，还是向供应商索取。你不需要判断它属于哪类“前体”。</p>
      ${state.questionHelpOpen ? '<div class="question-explainer"><strong>为什么现在问？</strong><p>产品和生产配置决定后，Agent 才能生成准确的材料清单、监测计划任务和供应商请求。此处只记录业务事实。</p></div>' : ""}
      <div class="answer-row"><button class="answer-button" data-answer="是，钢坯自产">是，自己生产</button><button class="answer-button" data-answer="不是，从供应商采购">不是，向外采购</button><button class="answer-button secondary" data-answer="不确定">我不确定</button><button class="answer-button secondary" data-answer="delegate">交给同事</button></div>`;
  }

  function renderCustomer() {
    if (state.page !== "work") return renderCustomerSecondary();
    const year = years[state.year];
    const locked = state.year === "2025";
    const currentStep = journeyStage();
    const stepNames = ["确认申报范围", "确认怎么生产", "准备监测与职责", "收集本期数据", "计算并选择路径", "复核与核查", "生成并交付"];
    const homeTitle = locked ? "查看已完成的年度档案" : state.year === "2026" ? "还有 2 个核查问题需要处理" : state.findingResolved ? "数据路径已确定，接下来准备复核" : state.factConfirmed ? "数据已确认，接下来选择处理路径" : "早上好，今天只做三件事";
    const coordinatorNext = locked ? ""
      : state.findingResolved
        ? nextAction("当前阶段 · 6/7", "准备专家复核与合规交付", "数据路径已经具名确认，下一步检查监测计划和交付文件缺口。", "检查交付准备度", 'data-page="deliverables"')
        : state.factConfirmed
          ? nextAction("当前任务 · 3/5 已完成", "选择成本与数据路径", "比较默认值、混合路径和全链路实测的影响，并处理开放缺口。", "查看成本与结果", 'data-page="results"')
          : state.uploadAdded
            ? nextAction("当前任务 · 3/5", "确认 Agent 提取的数据", "核对用量、账期和设施后，新数据才会进入计算版本。", "去确认", 'data-page="data"')
            : state.answer
              ? nextAction("当前任务 · 1/5 已完成", "核对产品与生产配置", "确认产品、工厂、工艺和钢坯来源，Agent 才能列出需要收集的材料。", "继续核对", 'data-page="products"')
              : "";
    const taskRows = locked ? `
      <li class="task-row"><span class="task-number">✓</span><div><strong>Communication Package 已交付</strong><small>进口商：NordWerk GmbH · 已接收</small></div><time>2026-03-18</time></li>
      <li class="task-row"><span class="task-number">✓</span><div><strong>核查报告已归档</strong><small>Verification Report · Rev 1</small></div><time>2026-03-12</time></li>`
      : state.findingResolved ? `
      <li class="task-row"><span class="task-number">1</span><div><strong>完成监测计划的 4 个缺口</strong><small>已确认事实会自动复用，无需重新填写</small></div><div class="task-row-action"><time>今天</time><button class="text-button" type="button" data-page="deliverables">去处理</button></div></li>
      <li class="task-row"><span class="task-number">2</span><div><strong>等待专家复核 Run 05</strong><small>王晨制备 · 李娜独立复核</small></div><div class="task-row-action"><time>处理中</time><button class="text-button" type="button" data-page="results">查看结果</button></div></li>
      <li class="task-row"><span class="task-number">3</span><div><strong>继续跟进供应商实测数据</strong><small>默认值并行路径不会停止供应商请求</small></div><div class="task-row-action"><time>已等待 6 天</time><button class="text-button" type="button" data-page="products">查看配置</button></div></li>`
      : state.factConfirmed ? `
      <li class="task-row"><span class="task-number">1</span><div><strong>处理钢坯数据缺口</strong><small>比较默认值并行、等待供应商和保守默认值</small></div><div class="task-row-action"><time>现在</time><button class="text-button" type="button" data-page="results">选择路径</button></div></li>
      <li class="task-row"><span class="task-number">2</span><div><strong>复核 Run 05 成本变化</strong><small>确认新增天然气数据带来的影响</small></div><div class="task-row-action"><time>待决定</time><button class="text-button" type="button" data-page="results">查看</button></div></li>`
      : `
      <li class="task-row"><span class="task-number">1</span><div><strong>${state.year === "2026" ? "解释 5 月电耗变化" : `上传 ${quarterMeta[state.quarter].endMonth}天然气账单`}</strong><small>${state.year === "2026" ? "核查 Finding #18" : `补齐 ${state.quarter} 数据包；Agent 会识别用量、账期和设施`}</small></div><div class="task-row-action"><time>${state.year === "2026" ? "今天" : "10 月 10 日"}</time><button class="text-button" type="button" data-page="${state.year === "2026" ? "results" : "data"}">去处理</button></div></li>
      <li class="task-row"><span class="task-number">2</span><div><strong>${state.year === "2026" ? "确认修订结果" : "确认钢坯供应商"}</strong><small>${state.year === "2026" ? "由王晨顾问准备" : "可直接转发给采购负责人"}</small></div><div class="task-row-action"><time>${state.year === "2026" ? "待专家" : "10 月 12 日"}</time><button class="text-button" type="button" data-page="${state.year === "2026" ? "deliverables" : "products"}">查看</button></div></li>
      <li class="task-row"><span class="task-number">3</span><div><strong>${state.year === "2026" ? "回复核查员" : "复核产品清单"}</strong><small>${state.year === "2026" ? "锁定新快照后发送" : "3 个产品来自去年，1 个为新增"}</small></div><div class="task-row-action"><time>${state.year === "2026" ? "10 月 14 日" : "10 月 15 日"}</time><button class="text-button" type="button" data-page="${state.year === "2026" ? "deliverables" : "products"}">查看</button></div></li>`;
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} ANNUAL COMPLIANCE CYCLE`, homeTitle, yearBadge())}
      <div class="customer-layout">
        <section class="customer-main">
          ${state.importedTrial && state.year === String(state.importedTrial.year) ? `<section class="trial-handoff"><div><small>来自免费成本试算</small><strong>${state.importedTrial.cnCode} · ${state.importedTrial.quantity.toLocaleString("zh-CN")} 吨</strong><p>估算成本 ¥${state.importedTrial.estimatedCostCny.toLocaleString("zh-CN")}。这只是线索，确认产品与工厂后才会建立正式事实。</p></div><button class="action secondary-action" type="button" data-action="review-trial">核对并转为项目</button></section>` : ""}
          <section class="control-tower"><div class="tower-step"><small>年度旅程</small><strong>${locked ? "7/7 已完成" : `${currentStep}/7 ${stepNames[currentStep - 1]}`}</strong><button class="text-button" type="button" data-page="roadmap">打开操作指南 →</button></div><div class="tower-cost"><small>${state.quarter} 默认基线 → 当前认可成本</small><strong><s>¥4.90m</s> <span>¥3.82m</span></strong><p>按当期适用证书价格估算</p></div><div class="tower-period"><small>当前季度数据包</small><strong>${locked ? "年度已封存" : `${state.quarter} · 68% 齐备`}</strong><button class="text-button" type="button" data-page="data">查看缺少材料 →</button></div></section>
          <div class="journey-mini">${stepNames.map((name, index) => `<span class="${index + 1 < currentStep || locked ? "done" : index + 1 === currentStep ? "current" : ""}" title="${name}"><i></i><small>${index + 1}</small></span>`).join("")}</div>
          <section class="panel agent-task">
            <div class="agent-task-top"><div class="agent-identity"><span class="agent-mark" aria-hidden="true">✦</span><div><strong>Lumino 协调 Agent</strong><small>把业务事实转换为合规数据</small></div></div><button class="text-button" type="button" data-action="explain-question" aria-expanded="${state.questionHelpOpen}">为什么问这些？</button></div>
            <div class="agent-task-body">${customerQuestion()}</div>
          </section>
          ${coordinatorNext}
          <section class="panel"><div class="panel-head"><h2>${locked ? "年度记录" : "接下来"}</h2><button class="text-button" type="button" data-page="roadmap">查看全部</button></div>
            <ol class="task-list">
              ${taskRows}
            </ol>
          </section>
        </section>
        <aside class="panel context-rail" aria-label="Agent 当前理解">
          <div class="context-intro"><p>AGENT CURRENT UNDERSTANDING</p><h2>${locked ? "交付时的正式事实快照" : "我目前这样理解这项业务"}</h2></div>
          <section class="context-section"><h3>已知事实</h3><dl class="fact-list"><div><dt>产品</dt><dd>热轧非合金钢卷</dd></div><div><dt>生产设施</dt><dd>上海浦东一厂</dd></div><div><dt>工艺</dt><dd>高炉—转炉长流程</dd></div><div><dt>年度</dt><dd>${state.year}</dd></div><div><dt>状态</dt><dd>${year.short}</dd></div></dl></section>
          <section class="context-section"><h3>证据与影响</h3><p class="source-line"><span>▣</span> ${state.year === "2028" ? "沿用建议来自 2027 锁定/确认数据" : `采购台账_${state.year}.xlsx · 已识别 2 个钢坯供应商`}</p><p class="source-line"><span>→</span> 你的回答将影响前体数据任务、排放核算和监测计划。</p></section>
          <section class="context-section"><button class="text-button" type="button" data-page="products">查看专业字段与数据来源 →</button></section>
        </aside>
      </div>`;
  }

  function renderCustomerSecondary() {
    if (state.page === "services") return renderServices();
    if (state.page === "programs") return renderPrograms();
    if (state.page === "contributor-work") return renderContributorWork();
    if (state.page === "approvals") return renderApprovals();
    if (state.page === "roadmap") return renderRoadmap();
    if (state.page === "products") return renderProducts();
    if (state.page === "data") return renderData();
    if (state.page === "results") return renderResults();
    if (state.page === "deliverables") return renderDeliverables();
    if (state.page === "team") return renderTeam();
    if (state.page === "annual-setup") return renderAnnualSetup();
    if (state.page === "org-settings") return renderOrganizationSettings();
  }

  function renderServices() {
    const admin = state.role === "customer_admin";
    $("#main").innerHTML = `
      ${pageHeader("SERVICE ENTITLEMENTS", admin ? "服务与订单" : "我的服务", statusChip("SO-2027-018 · 履约中"))}
      <section class="service-hero"><div><small>LUMINO SERVICE ORDER</small><h2>2027 年度 CBAM 全流程服务</h2><p>合同 CT-2026-044 · 华星钢铁有限公司 · 2026-11-01 至 2028-03-31</p></div><div><small>服务负责人</small><strong>林晓 · 客户运营</strong><span>王晨 · 制备专家 / 李娜 · 独立复核</span></div></section>
      <div class="content-split service-layout">
        <section class="panel"><div class="panel-head"><div><h2>订单覆盖范围</h2><span>客户确认版本 · Rev 2</span></div>${admin ? '<button class="button button--secondary" type="button" data-drawer="service-scope">申请变更</button>' : ""}</div><dl class="scope-grid"><div><dt>申报年度</dt><dd>2027</dd></div><div><dt>设施</dt><dd>2 座</dd></div><div><dt>产品</dt><dd>4 类 / 7 个配置</dd></div><div><dt>欧盟进口商</dt><dd>3 家</dd></div><div><dt>服务模块</dt><dd>建档、核算、监测计划、核查支持、交付</dd></div><div><dt>SLA</dt><dd>专业问题 2 个工作日</dd></div></dl></section>
        <aside class="panel"><div class="panel-head"><h2>约定交付物</h2></div><ol class="compact-checklist"><li><span>↻</span><div><strong>季度进口商数据包</strong><small>Q1–Q4 · 按进口商范围生成</small></div></li><li><span>✓</span><div><strong>年度监测计划</strong><small>草稿 Rev 3 · 准备复核</small></div></li><li><span>→</span><div><strong>年度排放报告与核查包</strong><small>全年数据完成后生成并核查</small></div></li></ol></aside>
      </div>
      <section class="panel wide-panel"><div class="panel-head"><div><h2>出口订单与发运覆盖</h2><span>业务订单不会与 Lumino 服务订单混用</span></div><button class="text-button" type="button" data-drawer="shipping-import">导入发运台账</button></div><table class="data-table"><thead><tr><th>进口商</th><th>申报期间</th><th>发运批次</th><th>产品覆盖</th><th>数量状态</th><th>数据范围</th></tr></thead><tbody><tr><td><strong>NordWerk GmbH</strong><small>德国</small></td><td>2027 Q1–Q3</td><td>18</td><td>热轧卷、镀层板</td><td><span class="record-state ok">已对账</span></td><td>仅本进口商可见交付包</td></tr><tr><td><strong>EuroFab S.r.l.</strong><small>意大利</small></td><td>2027 Q2–Q3</td><td>7</td><td>型钢</td><td><span class="record-state warn">缺 1 批数量</span></td><td>仅本进口商可见交付包</td></tr></tbody></table></section>`;
  }

  function renderPrograms() {
    const nextYearRow = state.yearCreated ? `<tr><td><strong>2028</strong></td><td><span class="status-chip warn">变化确认</span></td><td>待关联</td><td>周岚</td><td>结构待确认</td><td><button class="text-button" type="button" data-action="enter-program" data-year="2028">以协调人身份进入</button></td></tr>` : "";
    $("#main").innerHTML = `
      ${pageHeader("ANNUAL PROGRAMS", "年度项目", actionButton("创建新年度", "primary", 'data-action="open-year-setup"'))}
      <section class="panel wide-panel"><div class="panel-head"><div><h2>华星钢铁 CBAM Program</h2><span>长期主档与年度数据分离</span></div></div><table class="data-table"><thead><tr><th>年度</th><th>当前阶段</th><th>服务订单</th><th>项目协调人</th><th>数据状态</th><th>可执行动作</th></tr></thead><tbody>${nextYearRow}<tr><td><strong>2027</strong></td><td><span class="status-chip">数据采集中</span></td><td>SO-2027-018</td><td>周岚</td><td>Q3 · 68%</td><td><button class="text-button" type="button" data-action="enter-program" data-year="2027">以协调人身份进入</button></td></tr><tr><td><strong>2026</strong></td><td><span class="status-chip warn">核查整改</span></td><td>SO-2026-006</td><td>周岚</td><td>Amendment 2</td><td><button class="text-button" type="button" data-action="enter-program" data-year="2026">进入整改项目</button></td></tr><tr><td><strong>2025</strong></td><td><span class="status-chip locked">已锁定</span></td><td>SO-2025-002</td><td>周岚</td><td>Rev 1</td><td><button class="text-button" type="button" data-action="enter-program" data-year="2025">查看只读档案</button></td></tr></tbody></table></section>`;
  }

  function renderContributorWork() {
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · ASSIGNED TO ME`, "分配给我的工作", statusChip("仅显示上海一厂范围"))}
      <div class="privacy-band"><strong>你当前是数据贡献者</strong><span>可以回答和上传自己负责的材料；无法查看其他设施、完整报告或成员权限。</span></div>
      <section class="panel task-focus"><div><small>${state.quarter} · 今天到期 · 约 3 分钟</small><h2>请上传上海一厂 ${quarterMeta[state.quarter].endMonth}天然气账单</h2><p>Agent 会提取账期与用量；上传结果先进入待确认区，不会直接进入正式核算。</p></div><button class="button button--primary" type="button" data-action="mock-upload">上传账单</button></section>
      <section class="panel wide-panel"><div class="panel-head"><h2>我的任务</h2><span>2 项</span></div><div class="record-list"><article class="record"><span class="record-code">GAS</span><div><strong>${quarterMeta[state.quarter].endMonth}天然气账单</strong><p>${state.year} ${state.quarter} · 上海一厂 · 今天到期</p></div><span class="record-state warn">待上传</span></article><article class="record"><span class="record-code">LINE</span><div><strong>确认热轧线 2 是否检修</strong><p>只需回答实际发生的情况</p></div><span class="record-state">待回答</span></article></div></section>`;
  }

  function renderApprovals() {
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · INTERNAL APPROVAL`, "待我审批", statusChip("2 项等待决定", "warn"))}
      <div class="approval-board"><section class="panel"><div class="panel-head"><h2>审批队列</h2><span>按成本与交付影响排序</span></div><div class="stack-list"><button type="button" class="stack-row active" data-drawer="record-detail" data-drawer-label="默认值并行路径" data-drawer-object="AP-2027-014" data-drawer-status="等待内部审批"><span>风险路径 · 今天</span><strong>供应商数据未返回，是否暂用默认值？</strong><small>影响 37% 总排放 · 不影响继续采集</small></button><button type="button" class="stack-row" data-drawer="record-detail" data-drawer-label="NordWerk Communication Package" data-drawer-object="2027 Q1–Q3 · 2 个产品"><span>交付范围 · 周五</span><strong>NordWerk Communication Package</strong><small>2 个产品 · 2027 Q1–Q3</small></button></div></section><section class="panel review-sheet"><small>DECISION AP-2027-014</small><h2>默认值并行路径</h2><p>批准后，团队会继续向供应商索取实测数据，同时以保守默认值维持当前进度。批准不会关闭 Finding。</p><ol><li><span>¥</span><div><strong>当前成本影响</strong><small>较目标情景约增加 ¥230k</small></div></li><li><span>✓</span><div><strong>可以撤回</strong><small>供应商数据通过核查后创建新计算版本</small></div></li></ol><div class="action-bar"><button class="button button--primary" type="button" data-staff-action="已批准默认值并行路径">批准并记录理由</button><button class="button button--secondary" type="button" data-staff-action="已退回项目协调人补充说明">退回补充</button></div></section></div>`;
  }

  function journeyStage() {
    if (state.year === "2025") return 7;
    if (state.year === "2026") return 6;
    if (state.year === "2028") return 1;
    if (state.findingResolved) return 6;
    if (state.factConfirmed) return 5;
    return 4;
  }

  function renderRoadmap() {
    const steps = [
      { name: "确认申报范围", desc: "企业、设施、产品和进口商", owner: "项目协调人", result: "年度范围快照", page: "products" },
      { name: "确认怎么生产", desc: "工厂、工艺、前体与供应链", owner: "生产 / 采购", result: "生产配置", page: "products" },
      { name: "建立年度监测方法", desc: "确定取数方法、职责与控制", owner: "Agent + 专家", result: "年度监测计划", page: "deliverables" },
      { name: `完成 ${state.quarter} 数据包`, desc: "台账、账单、发运与供应商数据", owner: "财务 / 生产 / 采购", result: `${state.quarter} 可回溯数据集`, page: "data" },
      { name: "计算并反馈进口商", desc: "比较数据路径、成本并形成季度包", owner: "Agent + 协调人", result: `${state.quarter} Communication Package`, page: "results" },
      { name: "形成年度报告并核查", desc: "年度排放报告、专家复核与核查", owner: "制备 / 复核专家", result: "已核查年度结果", page: "deliverables" },
      { name: "支持年度申报并封存", desc: "向进口商交付年度数据与证据", owner: "Lumino + 客户审批人", result: "年度交付档案", page: "deliverables" },
    ];
    const stepPages = steps.map((step) => step.page);
    const current = journeyStage();
    const locked = state.year === "2025";
    const macroCurrent = locked ? 4 : current <= 2 ? 1 : current <= 5 ? 2 : 3;
    const macroSteps = [
      { no: "01", name: "启动年度项目", desc: "登录后直接开始，不要求先试算", page: "services" },
      { no: "02", name: "确认范围与监测方法", desc: "产品、CN Code、工厂、工艺与职责", page: "products" },
      { no: "03", name: "按季度收集与反馈", desc: "每季交材料、核算并反馈进口商", page: "data" },
      { no: "04", name: "年度报告与核查", desc: "年度汇总、核查、支持进口商申报", page: "deliverables" },
    ];
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · HOW TO USE LUMINO`, locked ? "这个年度已完成" : "怎么完成今年的 CBAM 工作", yearBadge())}
      <section class="guide-overview">
        <div><small>ONE ROUTE · ONE NEXT STEP</small><h2>有账号即可直接开始；免费试算只是可选入口。</h2><p>你负责讲清业务事实、提供现有材料并确认结果。Agent 负责转成合规数据，专家负责年度报告、判断与核查支持。</p><div class="guide-entry-links"><button class="text-button" type="button" data-page="services">直接进入年度项目 →</button><a href="../calculator/">可选：先做免费试算 ↗</a></div></div>
        <div class="guide-now"><small>你现在在这里</small><strong>${locked ? "年度已封存" : `${current}/7 · ${steps[current - 1].name}`}</strong><span>${locked ? "查看交付记录，更正时创建新修订版。" : steps[current - 1].desc}</span><button class="button button--primary" type="button" data-page="${stepPages[current - 1]}">${locked ? "查看年度档案" : "继续当前工作"}<b aria-hidden="true">→</b></button></div>
      </section>
      <nav class="platform-flow" aria-label="Lumino 端到端操作流程">${macroSteps.map((step, index) => {
        const stateClass = index < macroCurrent ? "done" : index === macroCurrent ? "current" : "";
        const content = `<span>${index < macroCurrent ? "✓" : step.no}</span><strong>${step.name}</strong><small>${step.desc}</small>`;
        return step.href ? `<a class="flow-node ${stateClass}" href="${step.href}">${content}</a>` : `<button class="flow-node ${stateClass}" type="button" data-page="${step.page}" ${index === macroCurrent ? 'aria-current="step"' : ""}>${content}</button>`;
      }).join("")}</nav>
      <section class="cadence-map" aria-label="季度与年度工作节奏"><div><small>QUARTERLY · 每季重复</small><strong>Q1 → Q2 → Q3 → Q4</strong><p>收集当期产量、发运、能源与前体数据；按当期价格计算，并向进口商提供数据包。</p><button class="text-button" type="button" data-page="data">查看 ${state.quarter} 数据包 →</button></div><div><small>ANNUAL · 年度完成</small><strong>监测计划 → 排放报告 → 核查</strong><p>年度监测方法贯穿全年；年度结束后汇总排放报告、完成核查并支持进口商年度申报。</p><button class="text-button" type="button" data-page="deliverables">查看年度交付 →</button></div></section>
      <section class="panel guide-roles"><div class="panel-head"><div><h2>谁负责什么</h2><small>你不需要先学会 CBAM 专业字段</small></div></div><div class="guide-role-list"><article><span>01 · 你和同事</span><strong>提供业务事实和现有材料</strong><p>回答看得懂的问题、上传台账，不知道时可以交给同事。</p></article><article><span>02 · Lumino Agent</span><strong>理解、提取、映射和追踪缺口</strong><p>把业务语言转为合规数据，只请你确认结果。</p></article><article><span>03 · Lumino 专家</span><strong>专业判断、独立复核与交付</strong><p>处理规则边界、计算版本、Findings 和正式文件。</p></article></div></section>
      <div class="guide-section-head"><div><small>${state.year} ANNUAL CYCLE</small><h2>本年度的 7 个操作步骤</h2></div><p>点击任一步可查看要求或历史记录。</p></div>
      <section class="journey-rail" aria-label="年度合规路线">${steps.map((step, index) => `<button type="button" class="journey-node ${index + 1 < current || locked ? "done" : index + 1 === current ? "current" : ""}" data-page="${step.page}" ${index + 1 === current && !locked ? 'aria-current="step"' : ""}><span>${index + 1 < current || locked ? "✓" : index + 1}</span><strong>${step.name}</strong><em>${step.desc}</em><small>${index + 1 < current || locked ? `已完成 · ${step.result}` : index + 1 === current ? `正在进行 · ${step.owner}` : `后续 · ${step.owner}`}</small></button>`).join("")}</section>
      <div class="roadmap-layout">
        <section class="panel step-focus"><div class="panel-head"><h2>${locked ? "年度交付记录" : "完成本步骤还需要什么"}</h2><span>${locked ? "Rev 1" : "2 个阻塞项"}</span></div>
          <div class="step-checks">${locked ? `<div class="complete"><b>✓</b><span><strong>Communication Package 已交付</strong><small>NordWerk GmbH 已接收</small></span></div><div class="complete"><b>✓</b><span><strong>年度数据与版本已封存</strong><small>2026-03-18</small></span></div>` : `<div class="complete"><b>✓</b><span><strong>${state.quarter} 的 4 个产品产量已齐备</strong><small>本季度产品范围已确认</small></span></div><div class="complete"><b>✓</b><span><strong>${quarterMeta[state.quarter].months}电力数据已复核</strong><small>来自上海一厂能源台账</small></span></div><div><b>!</b><span><strong>${quarterMeta[state.quarter].endMonth}天然气账单</strong><small>财务 · 本期截止前</small></span><button class="text-button" type="button" data-page="data">去处理</button></div><div><b>!</b><span><strong>供应商甲的前体数据</strong><small>采购 · 已等待 6 天</small></span><button class="text-button" type="button" data-page="products">查看配置</button></div>`}</div>
        </section>
        <aside class="panel gate-panel"><div class="panel-head"><h2>进入下一步的门槛</h2></div><div><span class="gate-count">${locked ? "✓" : "3/5"}</span><p>${locked ? "所有步骤均已完成。任何更正将创建新的 Amendment Revision。" : "所有阻塞数据有可用值，或由具名审批人批准适用的默认值路径。"}</p><button class="action secondary-action" type="button" data-page="results">查看数据路径与成本</button></div></aside>
      </div>`;
  }

  function renderData() {
    const locked = isLockedYear();
    const currentPeriod = quarterMeta[state.quarter];
    if (state.role === "customer_contrib") {
      $("#main").innerHTML = `
        ${pageHeader(`${state.year} · MY EVIDENCE`, "我的材料", statusChip("上海一厂 · 限定范围"))}
        <div class="privacy-band"><strong>最小可见范围</strong><span>这里仅显示分配给你的设施与材料。其他设施、供应商和完整计算结果保持隐藏。</span></div>
        <section class="panel wide-panel"><div class="panel-head"><h2>${state.quarter} 我负责的材料</h2><button class="button button--primary" type="button" data-action="mock-upload">上传材料</button></div><div class="record-list"><article class="record"><span class="record-code">BILL</span><div><strong>上海一厂电力账单 · ${quarterMeta[state.quarter].months}</strong><p>已解析 3/3 · 等待项目协调人确认</p></div><span class="record-state ok">已上传</span></article><article class="record"><span class="record-code">GAS</span><div><strong>上海一厂天然气账单 · ${quarterMeta[state.quarter].endMonth}</strong><p>今天到期</p></div><span class="record-state warn">待上传</span></article></div></section>`;
      return;
    }
    const periods = [
      ["Q1", "已冻结", 100, "ok"], ["Q2", "已复核", 96, "ok"], ["Q3", "采集中", state.uploadAdded ? 84 : 68, "warn"], ["Q4", "未开始", 0, ""],
    ];
    const gasState = state.uploadAdded ? '<span class="record-state ok">已解析</span>' : '<span class="record-state warn">待补</span>';
    const reviewStep = state.uploadAdded ? `<section class="panel extraction-review"><div><small>AGENT EXTRACTION · 待协调人确认</small><h2>${currentPeriod.endMonth}天然气：18,420 Nm³</h2><p>识别自“江苏二厂天然气账单_${state.year}-${currentPeriod.endMonth.replace(" 月", "").padStart(2, "0")}.pdf”，账期与设施已匹配。确认后才进入正式事实建议。</p></div>${state.factConfirmed ? '<span class="status-chip">已确认并进入 Run 05</span>' : '<button class="button button--primary" type="button" data-action="confirm-fact">确认提取结果</button>'}</section>` : "";
    const dataNext = !state.uploadAdded
        ? nextAction("当前季度任务", `先补齐 ${state.quarter} 的 ${currentPeriod.endMonth}天然气账单`, "上传后 Agent 会提取用量、账期和设施，你只需核对结果。", "演示上传并解析", 'data-action="mock-upload"')
      : !state.factConfirmed
        ? nextAction("当前任务 · 3/5", "确认 Agent 提取的数据", "确认前不会进入正式核算，也不会覆盖历史记录。", "确认提取结果", 'data-action="confirm-fact"')
        : nextAction("当前任务 · 3/5 已完成", "查看成本与数据路径", "新数据已进入待复核计算版本，下一步选择默认值或实测数据路径。", "查看更新结果", 'data-page="results"');
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · ${state.quarter} QUARTERLY DATA`, `${state.quarter} 数据与证据`, locked ? yearBadge() : actionButton("上传本季度材料", "primary", 'data-action="mock-upload"'))}
      <section class="cadence-notice"><div><small>季度工作包</small><strong>每个季度独立检查数据完整度、计算版本和进口商反馈</strong></div><p>季度数据持续累积到年度数据集；监测计划、年度排放报告和核查在年度层管理。</p></section>
      ${locked ? '<div class="privacy-band"><strong>年度快照只读</strong><span>新材料必须通过更正申请进入 Amendment 草稿，不会覆盖 Rev 1。</span><button class="text-button" type="button" data-staff-action="已创建年度更正申请">发起更正</button></div>' : ""}
      <section class="period-grid" aria-label="选择季度数据包">${periods.map(([label, status, coverage, tone]) => {
        const price = state.year === "2026" ? certificatePrices2026[label].price : state.year >= "2027" ? "按周价格" : "不适用";
        return `<button type="button" class="period-card ${tone} ${state.quarter === label ? "selected" : ""}" data-quarter="${label}" aria-pressed="${state.quarter === label}"><div><small>${label}</small><span class="record-state ${tone}">${status}</span></div><strong>${coverage}%</strong><p>数据与证据覆盖</p><i><em style="width:${coverage}%"></em></i><ul><li>产品数量 ${coverage ? "✓" : "—"}</li><li>能源数据 ${coverage > 70 ? "✓" : coverage ? "待补" : "—"}</li><li>前体数据 ${coverage > 90 ? "✓" : coverage ? "缺 1 项" : "—"}</li><li>证书价格 ${price}</li></ul></button>`;
      }).join("")}</section>
      ${reviewStep}
      <div class="content-split data-layout"><section class="panel flat-panel"><div class="panel-head"><h2>${state.quarter} 本期材料</h2><button class="text-button" type="button">责任人 ▾</button></div><div class="record-list"><article class="record"><span class="record-code">BILL</span><div><strong>电力账单 · ${currentPeriod.months}</strong><p>上海一厂 · 财务 · 已解析 3/3</p></div><span class="record-state ok">已关联</span></article><article class="record"><span class="record-code">GAS</span><div><strong>天然气账单 · ${currentPeriod.months}</strong><p>江苏二厂 · ${state.uploadAdded ? "已解析 3/3" : `缺 ${currentPeriod.endMonth}`}</p></div>${gasState}</article><article class="record"><span class="record-code">PRE</span><div><strong>钢坯供应商数据</strong><p>北方特钢 · 请求已发送</p></div><span class="record-state warn">等待外部</span></article></div></section><aside class="panel trace-panel"><div class="panel-head"><h2>${state.quarter} 进入核算前</h2></div><ol class="trace-list"><li><span>01</span><div><strong>期间完整</strong><small>${state.uploadAdded ? "账期已覆盖，无重复或缺月" : `仍缺 ${currentPeriod.endMonth}天然气`}</small></div></li><li><span>02</span><div><strong>对象已关联</strong><small>设施、产品配置和前体明确</small></div></li><li><span>03</span><div><strong>证据可回溯</strong><small>文件版本与位置已记录</small></div></li><li><span>04</span><div><strong>异常已处理</strong><small>冲突有具名裁决</small></div></li></ol></aside></div>
      ${locked ? "" : dataNext}`;
  }

  function renderProducts() {
    const locked = state.year === "2025";
    const count = state.productAdded ? 5 : 4;
    const products = {
      hrc: { code: "HRC-01", name: "热轧非合金钢卷", cn: "CN 7208 候选已由关务确认", summary: "3 个生产配置", scope: ["2026", "2027"] },
      coated: { code: "CTS-01", name: "镀层钢板", cn: "CN 7210 候选 · 待关务复核", summary: "1 个生产配置 · 缺外包证明", scope: ["2027"] },
      section: { code: "SEC-01", name: "型钢", cn: "CN 7216 已确认", summary: "1 个生产配置", scope: ["2026", "2027"] },
      wire: { code: "WRD-01", name: "非合金钢盘条", cn: "CN 7213 已确认", summary: "2 个生产配置", scope: ["2027"] },
      cold: { code: "CRS-02", name: "冷轧非合金钢板", cn: state.productCnCodes.length ? `CN ${state.productCnCodes.join(" / ")} · 候选待确认` : "CN Code 尚未设置 · 可由 Agent 建议", summary: "尚未添加生产配置", scope: state.productYears },
    };
    Object.entries(state.productOverrides).forEach(([id, overrides]) => {
      if (products[id]) products[id] = { ...products[id], ...overrides };
    });
    if (!products[state.selectedProduct] || (state.selectedProduct === "cold" && !state.productAdded)) state.selectedProduct = "hrc";
    const selected = products[state.selectedProduct];
    const productRow = (id) => `<button class="product-row ${state.selectedProduct === id ? "active" : ""}" type="button" data-product="${id}" aria-pressed="${state.selectedProduct === id}"><span>${safe(products[id].code)}</span><strong>${safe(products[id].name)}</strong><small>${safe(products[id].summary)}</small><em>${products[id].scope.length ? `纳入 ${safe(products[id].scope.join(" / "))}` : "尚未纳入年度项目"}</em></button>`;
    const configurationDraft = state.configurationDrafts[state.selectedProduct];
    const configurations = state.selectedProduct === "hrc" ? `<article><div class="config-top"><span>A</span><div><strong>上海一厂 · 自产钢坯</strong><small>高炉—转炉长流程 · 有效期 2025–至今</small></div><span class="record-state ok">37% 产量</span></div><dl><div><dt>主要前体</dt><dd>自产钢水、钢坯</dd></div><div><dt>数据路径</dt><dd>自身实测</dd></div><div><dt>单位排放</dt><dd>1.72 tCO₂e/t</dd></div></dl></article><article><div class="config-top"><span>B</span><div><strong>上海一厂 · 外购钢坯</strong><small>供应商甲 / 北方特钢 · 采购批次区分</small></div><span class="record-state warn">43% 产量</span></div><dl><div><dt>主要前体</dt><dd>外购非合金钢坯</dd></div><div><dt>数据路径</dt><dd>前体默认 + 自身实测</dd></div><div><dt>单位排放</dt><dd>1.96 tCO₂e/t</dd></div></dl></article><article><div class="config-top"><span>C</span><div><strong>江苏二厂 · 电弧炉</strong><small>供应商乙钢坯 · 订单号区分</small></div><span class="record-state ok">20% 产量</span></div><dl><div><dt>主要前体</dt><dd>外购低碳钢坯</dd></div><div><dt>数据路径</dt><dd>全链路实测 · 待核查</dd></div><div><dt>单位排放</dt><dd>1.31 tCO₂e/t</dd></div></dl></article>` : state.selectedProduct === "cold" ? `<div class="configuration-empty"><span>✦</span><h3>还没有生产配置</h3><p>告诉 Agent 这个产品在哪里生产、用了什么原料，我们会生成待确认的配置草稿。</p></div>` : `<article><div class="config-top"><span>A</span><div><strong>上海一厂 · 标准生产路径</strong><small>已从上一年度带入结构，待确认本年变化</small></div><span class="record-state warn">待完善</span></div><dl><div><dt>主要前体</dt><dd>待 Agent 确认</dd></div><div><dt>数据路径</dt><dd>暂用默认值</dd></div><div><dt>单位排放</dt><dd>待核算</dd></div></dl></article>`;
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · PRODUCT & SUPPLY CHAIN`, "产品与供应链", locked ? yearBadge() : actionButton("＋ 新建产品", "primary", 'data-action="toggle-product-form"'))}
      <div class="product-workspace">
        <section class="panel product-index"><div class="panel-head"><div><h2>企业产品主档</h2><small>当前查看 ${state.year} 年度范围</small></div><span>${count} 个</span></div><div class="product-list">${productRow("hrc")}${productRow("coated")}${productRow("section")}${productRow("wire")}${state.productAdded ? productRow("cold") : ""}</div><div class="product-index-foot"><button class="text-button" type="button" data-drawer="generic-action" data-drawer-label="Excel 批量导入产品">Excel 批量导入</button><button class="text-button" type="button" data-drawer="record-detail" data-drawer-label="重复产品检查" data-drawer-status="未发现重复项">查找重复</button></div></section>
        <section class="product-detail">
          <div class="product-title"><div><small>PRODUCT MASTER · ${state.selectedProduct === "cold" ? "DRAFT" : "ACTIVE"}</small><h2>${safe(selected.name)}</h2><p>${safe(selected.code)} · ${safe(selected.cn)}</p><div class="product-year-line">适用年度 ${safe(selected.scope.join(" · ") || "尚未纳入年度项目")}</div></div><div>${locked ? '<span class="status-chip locked">快照只读</span>' : '<button class="action secondary-action" type="button" data-drawer="manage-cn">管理 CN Code</button><button class="action secondary-action" type="button" data-drawer="manage-years">管理年度</button><button class="action secondary-action" type="button" data-action="edit-product">编辑主档</button><button class="action secondary-action" type="button" data-staff-action="产品将从未来年度候选中停用">停用</button>'}</div></div>
          <section class="configuration-section"><div class="section-heading"><div><h3>生产配置</h3><p>同一销售产品可以有不同工厂、工艺和前体来源；分别核算后再汇总。</p></div>${locked ? "" : `<button class="action primary-action" type="button" data-action="add-configuration">＋ 添加配置</button>`}</div>
            <div class="configuration-list">${configurations}${configurationDraft ? `<article class="new-config"><div class="config-top"><span>${state.selectedProduct === "hrc" ? "D" : "A"}</span><div><strong>${safe(configurationDraft.facility)} · ${safe(configurationDraft.precursor)}</strong><small>${safe(configurationDraft.process)}${configurationDraft.basis ? ` · ${safe(configurationDraft.basis)}` : ""}</small></div><span class="record-state warn">草稿</span></div><button class="text-button" type="button" data-page="work">让 Agent 帮我确认专业字段 →</button></article>` : ""}</div>
          </section>
        </section>
      </div>
      ${locked ? "" : configurationDraft && !state.answer ? nextAction("当前任务 · 2/5", "让 Agent 补齐新配置", "用业务语言确认工厂、工艺和钢坯来源；无需填写专业字段。", "回答配置问题", 'data-page="work"') : nextAction("当前任务 · 2/5 已核对", "收集本期数据与证据", "产品范围确定后，Agent 已生成按责任人拆分的材料清单。", "继续收集材料", 'data-page="data"')}`;
  }

  function renderResults() {
    const resolved = state.findingResolved;
    const pathLabels = { parallel: "供应商请求 + 默认值并行", supplier: "等待供应商实测数据", conservative: "本期采用保守默认值" };
    const decisionPanel = state.findingChoiceOpen && !resolved ? `<section class="panel decision-panel"><div class="decision-copy"><small>PATH DECISION · GAP-PRE-004</small><h2>钢坯数据暂时怎么处理？</h2><p>这项决定只影响当前计算版本，不会停止向供应商索取实测数据，也可以在新证据通过后撤回。</p></div><div class="decision-options" role="group" aria-label="选择数据处理路径"><button type="button" class="decision-option ${state.dataPathChoice === "parallel" ? "selected" : ""}" data-path-choice="parallel" aria-pressed="${state.dataPathChoice === "parallel"}"><strong>建议：两条路径并行</strong><span>先用默认值保持进度，同时继续追踪供应商数据</span></button><button type="button" class="decision-option ${state.dataPathChoice === "supplier" ? "selected" : ""}" data-path-choice="supplier" aria-pressed="${state.dataPathChoice === "supplier"}"><strong>等待供应商数据</strong><span>结果更完整，但当前核算和交付会继续等待</span></button><button type="button" class="decision-option ${state.dataPathChoice === "conservative" ? "selected" : ""}" data-path-choice="conservative" aria-pressed="${state.dataPathChoice === "conservative"}"><strong>本期使用默认值</strong><span>最快形成结果，预计证书成本最高</span></button></div><div class="decision-footer"><button class="button button--secondary" type="button" data-action="close-path-choice">暂不决定</button><button class="button button--primary" type="button" data-action="confirm-data-path" ${state.dataPathChoice ? "" : "disabled"}>确认${state.dataPathChoice ? `：${pathLabels[state.dataPathChoice]}` : "处理路径"}</button></div></section>` : "";
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · ${state.quarter} DATA STRATEGY`, `${state.quarter} 成本与结果`, yearBadge())}
      <section class="certificate-price-strip"><div><small>2026 OFFICIAL CBAM CERTIFICATE PRICES</small><strong>2026 年按季度；2027 年起按周平均价格</strong><p>单位为 €/tCO₂，更新至 2026-10-10。项目计算必须保存实际采用的期间与价格版本。<a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en" target="_blank" rel="noopener">欧盟委员会原始价格页 ↗</a></p></div>${Object.entries(certificatePrices2026).map(([quarter, data]) => `<button type="button" class="price-cell ${state.year === "2026" && state.quarter === quarter ? "active" : ""}" data-quarter="${quarter}" aria-pressed="${state.year === "2026" && state.quarter === quarter}"><small>${quarter}</small><strong>${data.price}</strong><span>${data.published}</span></button>`).join("")}</section>
      <section class="scenario-intro"><div><small>当前认可路径 · ${state.quarter}</small><strong>自身实测 + 前体默认</strong><p>同一产品、数量、期间、证书价格和规则版本下比较。实测并不保证一定降低成本。</p></div><div class="recognized-saving"><small>相对默认基线已确认减少</small><strong>¥1.08m</strong><span>另有约 ¥0.47m 潜在变化待核查</span></div></section>
      <section class="scenario-board">
        <article><header><span>A</span><div><small>DEFAULT BASELINE</small><h2>默认基线</h2></div></header><strong>¥4.90m</strong><p>预计证书成本</p><dl><div><dt>数据构成</dt><dd>100% 适用默认值</dd></div><div><dt>单位排放</dt><dd>2.34 tCO₂e/t</dd></div><div><dt>准备工作</dt><dd>产品范围与数量</dd></div></dl><span class="scenario-state">保守比较基线</span></article>
        <article class="current"><header><span>B</span><div><small>CURRENT RECOGNIZED</small><h2>自身实测 + 前体默认</h2></div></header><strong>¥3.82m</strong><p>当前认可结果</p><dl><div><dt>数据构成</dt><dd>76% 实测 / 24% 默认</dd></div><div><dt>单位排放</dt><dd>1.83 tCO₂e/t</dd></div><div><dt>合规要求</dt><dd>监测计划、自身数据、核查</dd></div></dl><span class="scenario-state ok">当前核算 Run 04</span></article>
        <article><header><span>C</span><div><small>TARGET SCENARIO</small><h2>全链路实测</h2></div></header><strong>¥3.35m</strong><p>情景值 · 尚未认可</p><dl><div><dt>数据构成</dt><dd>预计 94% 实测</dd></div><div><dt>单位排放</dt><dd>1.60 tCO₂e/t</dd></div><div><dt>仍需完成</dt><dd>供应商数据与上游核查</dd></div></dl><span class="scenario-state warn">潜在变化，不是节省承诺</span></article>
      </section>
      ${decisionPanel}
      <section class="panel reduction-ledger"><div class="panel-head"><div><h2>${state.quarter} 成本变化台账</h2><span>每一项变化都能回到当期工作、证据与计算版本</span></div><button class="text-button" type="button">查看计算假设</button></div><table class="data-table"><thead><tr><th>已完成 / 待完成工作</th><th>替代内容</th><th>影响数量</th><th>排放强度变化</th><th>证书成本影响</th><th>认可状态</th></tr></thead><tbody><tr><td><strong>完成上海一厂实测</strong><small>年度监测计划 Rev 3</small></td><td>工厂默认值</td><td>6,500 t</td><td>2.10 → 1.72</td><td class="text-success"><strong>−¥620k</strong></td><td><span class="record-state ok">已复核</span></td></tr><tr><td><strong>获得供应商甲数据</strong><small>${state.quarter} Communication Form 草稿</small></td><td>钢坯默认值</td><td>2,100 t</td><td>1.85 → 1.54</td><td class="text-warning"><strong>约 −¥230k</strong></td><td><span class="record-state warn">待核查</span></td></tr><tr><td><strong>补齐 ${state.quarter} 天然气</strong><small>江苏二厂</small></td><td>缺失期估算</td><td>1 个季度</td><td>待计算</td><td>待计算</td><td><span class="record-state">待材料</span></td></tr></tbody></table><p class="scenario-disclaimer">情景金额为演示。实际结果可能升高或降低，以适用规则、认可数据、核查结论和当期证书价格为准；监测、核查和供应商协作成本应另行评估。</p></section>
      <div class="content-split result-content">
        <section class="panel flat-panel"><div class="panel-head"><h2>需要处理的缺口</h2><span>${resolved ? "1" : "2"} 个阻塞项</span></div><div class="finding-list">
          <article class="finding ${resolved ? "resolved" : ""}"><span class="finding-level">高</span><div><strong>${resolved ? "钢坯数据路径已确定" : "钢坯供应商排放数据缺失"}</strong><p>${resolved ? `已选择“${pathLabels[state.dataPathChoice] || pathLabels.parallel}”，等待后续证据。` : "影响两个产品的前体嵌入排放。可以向供应商索取，或先使用保守默认值。"}</p><small>GAP-PRE-004 · 影响 37% 总排放</small></div>${resolved ? `<span class="record-state ok">已记录决定</span>` : `<button class="action primary-action" type="button" data-action="resolve-finding">选择处理方式</button>`}</article>
          <article class="finding"><span class="finding-level medium">中</span><div><strong>6 月电费单尚未关联设施</strong><p>Agent 已识别用电量，需要确认账单覆盖一厂还是两座设施。</p><small>GAP-ENE-012 · 不影响当前试算</small></div><button class="action secondary-action" type="button" data-page="work">去确认</button></article>
        </div></section>
        <aside class="panel trace-panel"><div class="panel-head"><h2>结果从哪里来</h2></div><ol class="trace-list"><li><span>01</span><div><strong>业务事实</strong><small>42 条已确认 · 3 条待确认</small></div></li><li><span>02</span><div><strong>活动数据与证据</strong><small>28 份材料 · 76% 实测覆盖</small></div></li><li><span>03</span><div><strong>确定性计算</strong><small>Engine 0.4 · Run 04</small></div></li><li><span>04</span><div><strong>规则校验</strong><small>EU-CBAM-2027.1 · 2 个 Finding</small></div></li></ol><button class="text-button trace-action" type="button">查看完整计算血缘 →</button></aside>
      </div>
      ${resolved ? nextAction("当前季度任务已完成", `准备 ${state.quarter} 进口商数据包`, "季度数据路径已记录；年度监测计划、排放报告和核查继续在年度交付区管理。", "检查季度与年度交付", 'data-page="deliverables"') : nextAction("当前季度任务", "先处理阻塞的数据路径", "明确临时使用默认值还是等待供应商数据，当前季度才能形成可交付版本。", "选择处理方式", 'data-action="resolve-finding"')}`;
  }

  function renderDeliverables() {
    const locked = state.year === "2025";
    const docs = [
      ["monitoring", "年度监测计划 / 监测报告", locked ? "已锁定 · Rev 1" : "18 / 22 项已具备", locked ? "2025-12-19" : "草稿 Rev 3"],
      ["emissions", "年度排放报告", locked ? "已核查" : "等待全年数据与核算复核", locked ? "2026-03-12" : "年度结束后生成"],
      ["verification", "年度核查与 Verification Package", locked ? "核查完成" : "尚未送审", locked ? "无开放 Finding" : "年度报告定稿后启动"],
    ];
    $("#main").innerHTML = `
      ${pageHeader(`${state.year} · COMPLIANCE DELIVERABLES`, "合规交付", yearBadge())}
      <div class="delivery-intro"><div><small>TWO CADENCES</small><strong>${locked ? "季度记录与年度文件均已封存" : "季度反馈持续推进，年度文件集中完成"}</strong><p>${locked ? "所有文件保留交付时版本、规则和接收记录。" : "季度数据包用于持续向进口商反馈；监测计划、排放报告和核查属于年度合规闭环。"}</p></div><div class="stage-line"><i class="done"></i><i class="done"></i><i class="${locked ? "done" : "current"}"></i><i class="${locked ? "done" : ""}"></i></div></div>
      <section class="cadence-deliverables"><article class="panel"><div class="panel-head"><div><h2>季度数据与进口商反馈</h2><small>运营节奏 · 每季重复</small></div><button class="text-button" type="button" data-page="data">查看 ${state.quarter} 数据</button></div><div class="quarter-package-list">${["Q1", "Q2", "Q3", "Q4"].map((quarter) => `<button type="button" class="quarter-package ${state.quarter === quarter ? "active" : ""}" data-quarter="${quarter}" aria-pressed="${state.quarter === quarter}"><span>${quarter}</span><strong>${quarter === "Q1" || quarter === "Q2" ? "已发送" : quarter === "Q3" ? "准备中" : "未开始"}</strong><small>Communication Package</small></button>`).join("")}</div></article><article class="panel annual-rule"><div class="panel-head"><div><h2>年度法定合规</h2><small>年度节奏 · 全年汇总</small></div></div><ol><li><span>01</span><div><strong>年度监测计划 / 监测报告</strong><small>定义全年一致的监测方法、职责和控制</small></div></li><li><span>02</span><div><strong>年度排放报告</strong><small>基于全年批准数据形成</small></div></li><li><span>03</span><div><strong>年度核查</strong><small>核查结论关联最终报告版本</small></div></li></ol></article></section>
      <div class="guide-section-head"><div><small>ANNUAL DELIVERABLES</small><h2>年度文件与核查状态</h2></div><p>季度包不会替代年度报告与核查。</p></div>
      <section class="delivery-list">${docs.map(([id, name, status, note], index) => `<article class="delivery-row ${state.deliveryExpanded === id ? "expanded" : ""}"><span class="delivery-index">0${index + 1}</span><div><small>${["PLAN", "REPORT", "VERIFY"][index]}</small><h2>${name}</h2><p>${status}</p>${state.deliveryExpanded === id ? `<div class="delivery-detail"><strong>来源和版本</strong><p>企业正式事实 · Calculation Run 04 · Rulepack EU-CBAM-${state.year}.1 · 所有未确认项以 GAP 标记。</p><button class="action secondary-action" type="button" data-action="document-preview">预览演示文件</button></div>` : ""}</div><span class="delivery-note">${note}</span><button class="round-action" type="button" data-delivery="${id}" aria-label="展开 ${name}">${state.deliveryExpanded === id ? "−" : "+"}</button></article>`).join("")}</section>
      ${locked ? nextAction("年度已封存", "返回操作指南", "查看季度循环和年度闭环的完成记录。", "查看完整记录", 'data-page="roadmap"') : nextAction("年度工作", "先完善年度监测计划", `同时可以继续准备 ${state.quarter} 进口商数据包；两条工作流互不阻塞。`, "返回今日工作", 'data-page="work"')}`;
  }

  function renderTeam() {
    const admin = state.role === "customer_admin";
    const invitedRows = state.invitedMembers.map((member) => `<tr><td><strong>${safe(member.email.split("@")[0])}</strong><small>${safe(member.email)}</small></td><td>${safe(member.role)}</td><td>${safe(member.scope)}</td><td>企业管理员邀请</td><td><span class="record-state warn">等待接受 · ${safe(member.expiresAt)}</span></td></tr>`).join("");
    $("#main").innerHTML = `
      ${pageHeader("ORGANIZATION & ACCESS", admin ? "成员与授权" : "团队与权限", admin ? actionButton("邀请成员", "primary", 'data-action="invite-member"') : statusChip("项目范围只读"))}
      <div class="permission-summary"><div><small>企业成员</small><strong>${12 + state.invitedMembers.length}</strong></div><div><small>Lumino 服务团队</small><strong>3</strong></div><div><small>待接受邀请</small><strong>${state.invitedMembers.length}</strong></div><p>权限按企业、年度、设施和数据敏感级别共同计算。Agent 不会扩大成员已有权限。</p></div>
      <section class="panel wide-panel"><div class="panel-head"><h2>项目成员</h2><button class="text-button" type="button" data-drawer="permission-audit">查看权限审计</button></div><table class="data-table"><thead><tr><th>成员</th><th>角色</th><th>数据范围</th><th>授权来源</th><th>状态</th></tr></thead><tbody>
        <tr><td><strong>周岚</strong><small>zhou.lan@huaxing.cn</small></td><td>企业管理员 / 协调人</td><td>全部年度 · 全部设施</td><td>企业级角色</td><td><span class="record-state ok">有效</span></td></tr>
        <tr><td><strong>陈浩</strong><small>生产部</small></td><td>数据贡献者</td><td>2027 · 上海一厂</td><td>任务 + 设施范围</td><td><span class="record-state warn">2 项待办</span></td></tr>
        <tr><td><strong>王晨</strong><small>Lumino 制备专家</small></td><td>制备专家</td><td>SO-2027-018 · 2027</td><td>服务订单授权</td><td><span class="record-state ok">2028-03 到期</span></td></tr>
        <tr><td><strong>李娜</strong><small>Lumino 复核中心</small></td><td>独立复核专家</td><td>待复核快照</td><td>工作包 WP-REV-03</td><td><span class="record-state ok">有效</span></td></tr>
        <tr><td><strong>NordWerk GmbH</strong><small>欧盟进口商</small></td><td>外部接收方</td><td>2025 · 已分享产品范围</td><td>交付分享授权</td><td><span class="record-state">只读</span></td></tr>${invitedRows}
      </tbody></table></section>
      <div class="security-note"><strong>最小权限原则</strong><p>商务和运营默认看不到 BOM、供应商价格与原始凭证；管理员临时访问客户内容必须说明原因并写入审计。</p><button class="text-button" type="button" data-drawer="permission-audit">查看权限矩阵 →</button></div>`;
  }

  function renderOrganizationSettings() {
    if (!canManageOrganization()) {
      state.page = defaultPages[state.role];
      render();
      toast("只有企业管理员可以维护长期主档。");
      return;
    }
    const facilityRows = [
      { code: "SH-01", name: "上海浦东一厂", activity: "高炉—转炉、轧制与镀层 · 3 条生产线", status: "在用" },
      { code: "JS-02", name: "江苏二厂", activity: "电弧炉与型钢 · 2 条生产线", status: "在用" },
      ...state.facilities,
    ].map((facility) => `<article class="record"><span class="record-code">${safe(facility.code)}</span><div><strong>${safe(facility.name)}</strong><p>${safe(facility.activity || "生产活动待补充")}</p></div><button class="record-state ${facility.status === "在用" ? "ok" : "warn"}" type="button" data-drawer="record-detail" data-drawer-label="${safe(facility.name)}" data-drawer-object="设施 ${safe(facility.code)}" data-drawer-status="${safe(facility.status)}" data-drawer-description="查看设施版本、生产活动、年度引用和数据源。">查看</button></article>`).join("");
    $("#main").innerHTML = `
      ${pageHeader("PROGRAM MASTER DATA", "企业设置", actionButton("编辑企业资料", "secondary", 'data-action="toggle-org-edit"'))}
      <div class="master-data-note"><div><strong>这里维护长期主档</strong><p>年度项目引用当时有效的版本。修改不会覆盖已锁定年度；地址、设施或责任变化会创建新的有效期版本。</p></div><span class="status-chip">主档完整度 91%</span></div>
      <div class="settings-layout"><nav class="settings-nav" aria-label="企业设置导航"><button class="active" type="button" data-drawer="organization-edit">企业与法定主体</button><button type="button" data-drawer="record-detail" data-drawer-label="生产设施主档" data-drawer-object="${2 + state.facilities.length} 座设施">生产设施 <span>${2 + state.facilities.length}</span></button><button type="button" data-drawer="permission-audit">组织与职责 <span>8</span></button><button type="button" data-drawer="record-detail" data-drawer-label="仪表与数据源" data-drawer-object="14 个数据源">仪表与数据源 <span>14</span></button><button type="button" data-drawer="record-detail" data-drawer-label="欧盟进口商目录" data-drawer-object="3 家进口商">欧盟进口商 <span>3</span></button><button type="button" data-drawer="record-detail" data-drawer-label="供应商目录" data-drawer-object="12 家供应商">供应商目录 <span>12</span></button><button type="button" data-drawer="permission-audit">授权与审计</button></nav>
        <section class="settings-main">
          <article class="panel master-section"><div class="panel-head"><div><h2>法定主体</h2><span>当前版本 · 2025-01-01 起有效</span></div><span class="record-state ok">已验证</span></div><dl class="master-fields"><div><dt>法定名称</dt><dd>${safe(state.organization.name)}</dd></div><div><dt>统一社会信用代码</dt><dd>${safe(state.organization.code)}</dd></div><div><dt>注册地址</dt><dd>${safe(state.organization.address)}</dd></div><div><dt>企业管理员</dt><dd>周岚 · zhou.lan@huaxing.cn</dd></div></dl></article>
          <article class="panel master-section"><div class="panel-head"><div><h2>生产设施</h2><span>长期设施主档 · ${2 + state.facilities.length} 座</span></div><button class="text-button" type="button" data-drawer="new-facility">＋ 新建设施</button></div><div class="record-list">${facilityRows}</div></article>
          <article class="panel master-section"><div class="panel-head"><div><h2>组织与职责</h2><span>新年度会询问是否变化</span></div><button class="text-button" type="button" data-drawer="permission-audit">查看全部 8 个职责</button></div><div class="responsibility-grid"><div><small>企业管理员</small><strong>周岚</strong><span>账号与长期主档</span></div><div><small>CBAM 协调人</small><strong>周岚</strong><span>年度项目推进</span></div><div><small>生产数据</small><strong>陈浩</strong><span>上海一厂</span></div><div><small>内部审批</small><strong>赵总</strong><span>交付与风险路径</span></div></div></article>
        </section>
      </div>`;
  }

  function renderAnnualSetup() {
    if (!canCreateYear()) {
      state.page = defaultPages[state.role];
      render();
      toast("只有企业管理员可以创建新年度。");
      return;
    }
    $("#main").innerHTML = `
      ${pageHeader("NEW ANNUAL COMPLIANCE CYCLE", "创建 2028 年度", statusChip("尚未创建", "warn"))}
      <section class="year-setup"><div class="year-step active"><span>01</span><div><small>基线年度</small><strong>使用 2027 的结构，不复制年度数值</strong><p>设施、产品和工艺作为待确认建议带入；产量、能耗、采购量和核算结果不会复制。</p></div></div><div class="year-step"><span>02</span><div><small>变化确认</small><strong>Agent 将询问今年发生了什么变化</strong><p>新增产品、生产线、供应商、外包工序和能源类型会单独确认。</p></div></div><div class="year-step"><span>03</span><div><small>新年度规则</small><strong>重新解析 2028 Rulepack 与报告模板</strong><p>默认值、benchmark、必填字段和交付模板全部按新年度生成。</p></div></div></section>
      <section class="panel inheritance-panel"><div class="panel-head"><div><h2>2027 → 2028 继承清单</h2><span>继承的是可复用结构；年度事实和结论始终重新取得</span></div><span class="status-chip">创建前预览</span></div><div class="inheritance-table"><div class="inheritance-row"><strong>企业、设施、产品、CN Code 候选</strong><span>引用当前有效主档，作为待确认结构</span><em class="inherit yes">可继承</em></div><div class="inheritance-row"><strong>工艺、供应商、职责与数据源映射</strong><span>复制为新年度草稿，Agent 逐项询问变化</span><em class="inherit review">继承后确认</em></div><div class="inheritance-row"><strong>监测方法章节</strong><span>复制为新修订草稿，必须经专家年度复核</span><em class="inherit review">继承后复核</em></div><div class="inheritance-row"><strong>季度产量、能耗、采购与发运数据</strong><span>不得跨年度复制，按 Q1–Q4 重新采集</span><em class="inherit no">不继承</em></div><div class="inheritance-row"><strong>默认值、证书价格、核算结果与批准状态</strong><span>按 2028 Rulepack 重新计算，不沿用历史结论</span><em class="inherit no">不继承</em></div><div class="inheritance-row"><strong>年度报告、核查包与 Findings</strong><span>保留历史只读快照，新年度创建独立版本</span><em class="inherit no">不继承</em></div></div><div class="year-setup-actions"><button class="action secondary-action" type="button" data-page="programs">取消</button><button class="action primary-action" type="button" data-action="create-year">创建年度并返回年度列表</button></div></section>`;
  }

  function renderExpert() {
    if (state.page !== "queue") return renderStaffSecondary("expert");
    $("#main").innerHTML = `
      ${pageHeader("EXPERT DECISION QUEUE", "需要专业判断的，不应留给客户猜。", '<p class="head-note">按计算影响、截止日期和置信度排序。任何修改都保留理由、规则版本与重算记录。</p>')}
      <div class="metric-line"><div><span>待判断</span><strong>12</strong><small>项</small></div><div><span>阻塞核算</span><strong>5</strong><small>项</small></div><div><span>本周到期</span><strong>7</strong><small>项</small></div><div><span>待独立复核</span><strong>3</strong><small>项</small></div></div>
      <div class="staff-layout">
        <section class="panel"><div class="panel-head"><h2>案件队列</h2><button class="text-button" type="button" data-drawer="record-detail" data-drawer-label="判断队列筛选">筛选 ▾</button></div><div class="case-list">
          <button class="case-item active" type="button" data-drawer="record-detail" data-drawer-label="确认钢坯前体来源" data-drawer-object="华星钢铁 · 2027" data-drawer-status="阻塞正式核算" data-drawer-action="进入案件工作台"><span><strong>华星钢铁 · 2027</strong><em>高影响</em></span><p>确认钢坯前体来源</p><small>阻塞正式核算 · 今天</small></button>
          <button class="case-item" type="button" data-drawer="record-detail" data-drawer-label="分配方法与产量口径" data-drawer-object="远航铝业 · 2026" data-drawer-status="Finding #24"><span><strong>远航铝业 · 2026</strong><em>核查中</em></span><p>分配方法与产量口径不一致</p><small>Finding #24 · 4 小时后</small></button>
          <button class="case-item" type="button" data-drawer="record-detail" data-drawer-label="CN Code 候选冲突" data-drawer-object="新锐紧固件 · 2027"><span><strong>新锐紧固件 · 2027</strong></span><p>CN Code 候选存在冲突</p><small>需查看产品说明 · 明天</small></button>
          <button class="case-item" type="button" data-drawer="record-detail" data-drawer-label="供应商排放数据边界" data-drawer-object="北辰化工 · 2027"><span><strong>北辰化工 · 2027</strong></span><p>供应商排放数据边界不完整</p><small>证据已上传 · 周五</small></button>
        </div></section>
        <section class="panel case-detail"><div class="case-meta"><span class="status-chip warn">阻塞核算</span><span class="status-chip">置信度 71%</span></div><h2>钢坯是自产，还是外购前体？</h2><p>客户原话：“一部分从集团北方厂调过来，一部分从本地供应商买。”Agent 判断不能用单一答案覆盖全部批次。</p>
          <div class="comparison"><article><small>Agent Proposal</small><strong>按采购台账将 63% 标记为外购，37% 标记为集团内部供应。</strong></article><article><small>Canonical Data</small><strong>尚未确认 · 当前年度核算被阻塞</strong></article></div>
          <div class="evidence-box"><h3>依据与版本</h3><p>采购台账_2027.xlsx · Sheet 供应商明细；生产说明_v2.pdf；Rulepack EU-CBAM-2027.1。与 2026 年相比新增“北方特钢”来源。</p></div>
          <div class="action-bar"><button class="action primary-action" type="button" data-staff-action="接受并拆分来源">接受并拆分来源</button><button class="action secondary-action" type="button" data-staff-action="修改 Agent 建议">修改建议</button><button class="action secondary-action" type="button" data-staff-action="退回客户确认并说明所需业务事实">退回客户确认</button></div>
        </section>
      </div>`;
  }

  function renderOps() {
    if (state.page !== "portfolio") return renderStaffSecondary("ops");
    $("#main").innerHTML = `
      ${pageHeader("OPERATIONS PORTFOLIO", "本周有 8 个项目需要干预。", '<p class="head-note">这里显示节奏、责任人和阻塞类别，不默认展示客户 BOM、账单全文或供应商价格。</p>')}
      <div class="metric-line"><div><span>数据采集</span><strong>18</strong><small>项目</small></div><div><span>内部复核</span><strong>7</strong><small>项目</small></div><div><span>核查中</span><strong>5</strong><small>项目</small></div><div><span>SLA 风险</span><strong>8</strong><small>项目</small></div></div>
      <div class="callout"><strong>建议动作：</strong> 两名专家本周负载超过 90%。将 3 个低复杂度 CN Code 复核任务转派给备用专家，可恢复 2 个项目的交付日期。</div>
      <section class="panel wide-panel"><div class="panel-head"><h2>项目组合</h2><button class="text-button" type="button" data-staff-action="生成仅含项目状态、SLA 与责任人的进度摘要">导出进度摘要</button></div><table class="data-table"><thead><tr><th>客户 / 年度</th><th>阶段</th><th>准备度</th><th>主要阻塞</th><th>负责人</th><th>SLA</th></tr></thead><tbody>
        <tr><td><strong>华星钢铁</strong><small>2027</small></td><td><span class="status-chip">数据采集</span></td><td class="bar-cell">62%<span class="mini-bar"><i style="width:62%"></i></span></td><td>供应商来源待确认</td><td>王晨</td><td>2 天</td></tr>
        <tr><td><strong>远航铝业</strong><small>2026</small></td><td><span class="status-chip warn">核查整改</span></td><td class="bar-cell">88%<span class="mini-bar"><i style="width:88%"></i></span></td><td>Finding #24</td><td>李明</td><td><strong class="text-danger">今天</strong></td></tr>
        <tr><td><strong>新锐紧固件</strong><small>2027</small></td><td><span class="status-chip">范围确认</span></td><td class="bar-cell">31%<span class="mini-bar"><i style="width:31%"></i></span></td><td>CN Code 待专家判断</td><td>王晨</td><td>4 天</td></tr>
        <tr><td><strong>北辰化工</strong><small>2027</small></td><td><span class="status-chip warn">采集延期</span></td><td class="bar-cell">48%<span class="mini-bar"><i style="width:48%"></i></span></td><td>外部供应商未回复</td><td>周敏</td><td><strong class="text-danger">逾期 1 天</strong></td></tr>
      </tbody></table></section>`;
  }

  function renderSales() {
    if (state.page !== "leads") return renderStaffSecondary("sales");
    $("#main").innerHTML = `
      ${pageHeader("LEADS & ACCOUNTS", "把一次试算，接成一条清晰的服务路径。", '<p class="head-note">商务可看试算摘要、联系人和合规里程碑；生产数据、原始证据与专家内部意见保持隐藏。</p>')}
      <div class="metric-line"><div><span>本周新线索</span><strong>14</strong><small>个</small></div><div><span>待首次联系</span><strong>6</strong><small>个</small></div><div><span>方案中</span><strong>4</strong><small>家</small></div><div><span>已签约</span><strong>9</strong><small>家</small></div></div>
      <section class="panel wide-panel"><div class="panel-head"><h2>优先跟进</h2><button class="text-button" type="button" data-drawer="record-detail" data-drawer-label="全部销售线索" data-drawer-object="14 个本周新增线索" data-drawer-scope="试算摘要、联系人与商务阶段">查看全部线索</button></div><table class="data-table"><thead><tr><th>企业 / 联系人</th><th>来源</th><th>试算摘要</th><th>合规里程碑</th><th>敏感数据</th><th>下一动作</th></tr></thead><tbody>
        <tr><td><strong>华星钢铁</strong><small>周岚 · 外贸负责人</small></td><td>免费成本计算器</td><td><strong>钢铁 · 10,000 t</strong><small>估算成本 ¥3.82m · 非正式</small></td><td><span class="status-chip">数据采集中</span></td><td class="privacy-cell">无权查看</td><td><button class="action primary-action" type="button" data-staff-action="已记录联系">记录联系</button></td></tr>
        <tr><td><strong>远航铝业</strong><small>孙哲 · EHS</small></td><td>专家转介绍</td><td><strong>铝制品 · 4,800 t</strong><small>已完成诊断</small></td><td><span class="status-chip warn">核查整改</span></td><td class="privacy-cell">无权查看</td><td>续费沟通 · 周五</td></tr>
        <tr><td><strong>新锐紧固件</strong><small>刘女士 · 总经理</small></td><td>官网预约</td><td><strong>钢铁下游制品</strong><small>待确认 CN Code</small></td><td>尚未创建项目</td><td class="privacy-cell">无权查看</td><td>预约诊断会 · 明天</td></tr>
      </tbody></table></section>`;
  }

  function renderStaffSecondary(role) {
    if (role === "expert" && state.page === "case-workspace") {
      $("#main").innerHTML = `${pageHeader("AUTHORIZED CASE WORKSPACE", "华星钢铁 · 2027", statusChip("WP-CALC-027 · 已分派"))}
        <div class="privacy-band"><strong>授权边界</strong><span>SO-2027-018 · 2 座设施 · 4 个产品 · 有效至 2028-03-31。合同价格、回款与商务备注不可见。</span></div>
        <section class="case-ledger"><div><small>服务订单</small><strong>SO-2027-018</strong><span>年度全流程服务</span></div><div><small>工作包</small><strong>WP-CALC-027</strong><span>计算与报告制备</span></div><div><small>当前规则</small><strong>EU-CBAM-2027.1</strong><span>Report Schema 3.2</span></div><div><small>专业 SLA</small><strong>余 1 天 6 小时</strong><span>运营：林晓</span></div></section>
        <div class="content-split case-workspace"><section class="panel"><div class="panel-head"><div><h2>对象与证据关系</h2><span>同一事实，不同视图</span></div><button class="text-button" type="button" data-staff-action="已打开证据定位器">查看原件</button></div><div class="relationship-map"><div><small>产品</small><strong>热轧非合金钢卷</strong><span>CN 7208 · 已确认</span></div><i>→</i><div><small>生产配置</small><strong>上海一厂 · 外购钢坯</strong><span>43% 年度产量</span></div><i>→</i><div><small>前体</small><strong>北方特钢钢坯</strong><span>Communication Form 待补</span></div></div><div class="comparison"><article><small>客户业务回答</small><strong>“集团北方厂和本地供应商都有，需要按采购批次区分。”</strong></article><article><small>Canonical Data</small><strong>63% 外购 / 37% 集团内部供应 · 待复核</strong></article></div></section><aside class="panel"><div class="panel-head"><h2>计算与修订</h2></div><ol class="compact-checklist"><li><span>04</span><div><strong>Calculation Run 04</strong><small>当前认可 · 2027-10-08</small></div></li><li><span>03</span><div><strong>Run 03</strong><small>供应商映射调整后失效</small></div></li><li><span>!</span><div><strong>1 个开放 Finding</strong><small>供应商边界说明不完整</small></div></li></ol><div class="action-bar"><button class="button button--primary" type="button" data-staff-action="已创建带理由的重算请求">发起重算</button><button class="button button--secondary" type="button" data-page="findings">查看 Finding</button></div></aside></div>`;
      return;
    }
    if (role === "expert" && state.page === "findings") {
      $("#main").innerHTML = `${pageHeader("EXPERT FINDINGS", "Findings", '<p class="head-note">Finding 只能在证据、规则或具名风险接受满足条件后关闭，Agent 无权自行关闭。</p>')}
        <div class="metric-line"><div><span>开放</span><strong>7</strong></div><div><span>客户响应中</span><strong>4</strong></div><div><span>等待重算</span><strong>2</strong></div><div><span>逾期</span><strong>1</strong></div></div>
        <section class="panel wide-panel"><div class="panel-head"><h2>跨项目发现</h2><button class="text-button" type="button">严重性 ▾</button></div><table class="data-table"><thead><tr><th>Finding</th><th>客户 / 年度</th><th>影响</th><th>负责人</th><th>状态</th><th>下一步</th></tr></thead><tbody>
          <tr><td><strong>PRE-004</strong><small>供应商排放数据缺失</small></td><td>华星钢铁 · 2027</td><td>37% 总排放</td><td>王晨</td><td><span class="record-state warn">已响应</span></td><td><button class="text-button" type="button" data-staff-action="已发起证据复核">复核证据</button></td></tr>
          <tr><td><strong>VER-018</strong><small>月度电耗异常</small></td><td>远航铝业 · 2026</td><td>核查结论</td><td>李明</td><td><span class="record-state warn">待客户</span></td><td>今天到期</td></tr>
          <tr><td><strong>CLS-009</strong><small>CN Code 候选冲突</small></td><td>新锐紧固件 · 2027</td><td>适用范围</td><td>王晨</td><td><span class="record-state">专家判断</span></td><td>查看产品说明</td></tr>
          <tr><td><strong>ENE-012</strong><small>账单未关联设施</small></td><td>华星钢铁 · 2027</td><td>间接排放</td><td>周岚</td><td><span class="record-state">非阻塞</span></td><td>客户确认</td></tr>
        </tbody></table></section>`;
      return;
    }
    if (role === "reviewer" && state.page === "review") {
      $("#main").innerHTML = `${pageHeader("INDEPENDENT REVIEW", "复核与锁定", statusChip("3 个待复核", "warn"))}
        <div class="callout"><strong>职责分离：</strong> 你不能批准自己制备的最终交付件。下列项目已自动排除制单人与复核人相同的情况。</div>
        <div class="approval-board"><section class="panel"><div class="panel-head"><h2>待复核交付件</h2><button class="text-button" type="button" data-drawer="record-detail" data-drawer-label="复核队列排序">按风险排序</button></div><div class="stack-list">
          <button type="button" class="stack-row active" data-drawer="record-detail" data-drawer-label="监测计划 Rev 3" data-drawer-object="华星钢铁 · 2027" data-drawer-status="待独立复核"><span>华星钢铁 · 2027</span><strong>监测计划 Rev 3</strong><small>制备：王晨 · 与当前复核人不同</small></button>
          <button type="button" class="stack-row" data-drawer="record-detail" data-drawer-label="排放报告 Amendment 2" data-drawer-object="远航铝业 · 2026"><span>远航铝业 · 2026</span><strong>排放报告 Amendment 2</strong><small>制备：李明 · 1 小时前</small></button>
          <button type="button" class="stack-row" data-drawer="record-detail" data-drawer-label="Calculation Run 08" data-drawer-object="北辰化工 · 2027"><span>北辰化工 · 2027</span><strong>Calculation Run 08</strong><small>制备：周敏 · 昨天</small></button>
        </div></section><section class="panel review-sheet"><small>MONITORING PLAN · REV 3</small><h2>华星钢铁 2027 监测计划</h2><p>22 项要素中 21 项已通过结构校验；1 项采用具名风险接受。</p><ol><li><span>✓</span><div><strong>范围与工艺一致</strong><small>4 个产品、2 个设施均有确认关系</small></div></li><li><span>✓</span><div><strong>证据血缘完整</strong><small>42 条事实可回溯至 28 份材料</small></div></li><li><span>!</span><div><strong>供应商数据仍使用默认值</strong><small>客户已批准保守路径，Finding 保持开放</small></div></li></ol><div class="action-bar"><button class="action primary-action" type="button" data-staff-action="复核通过并进入锁定队列">复核通过</button><button class="action secondary-action" type="button" data-staff-action="退回复核件并要求制备人修改">退回修改</button></div></section></div>`;
      return;
    }
    if (role === "ops" && state.page === "engagements") {
      $("#main").innerHTML = `${pageHeader("SERVICE ORDER DELIVERY", "订单履约", statusChip("3 个需要运营动作", "warn"))}
        <div class="privacy-band"><strong>运营可见范围</strong><span>可管理服务范围、SLA、团队与交接；不展示合同价格、客户 BOM、供应商价格或原始凭证正文。</span></div>
        <section class="panel wide-panel"><div class="panel-head"><div><h2>履约中的服务订单</h2><span>合同签署后由商务正式移交</span></div><button class="text-button" type="button">服务负责人 ▾</button></div><table class="data-table"><thead><tr><th>服务订单</th><th>客户 / 年度</th><th>购买范围</th><th>团队</th><th>SLA / 健康度</th><th>运营动作</th></tr></thead><tbody><tr><td><strong>SO-2027-018</strong><small>年度全流程</small></td><td>华星钢铁 · 2027</td><td>2 设施 · 4 产品 · 3 进口商</td><td>林晓 / 王晨 / 李娜</td><td><span class="record-state ok">正常</span><small>下次交付 10 月 18 日</small></td><td><button class="text-button" type="button" data-staff-action="已打开华星钢铁履约详情">管理履约</button></td></tr><tr><td><strong>SO-2026-011</strong><small>核查支持</small></td><td>远航铝业 · 2026</td><td>1 设施 · 2 产品</td><td>孙宁 / 李明</td><td><span class="record-state warn">Finding 逾期</span></td><td><button class="text-button" type="button" data-staff-action="已创建运营升级单">创建升级单</button></td></tr><tr><td><strong>SO-2027-022</strong><small>首年建档</small></td><td>北辰化工 · 2027</td><td>范围待客户确认</td><td>待分配专家</td><td><span class="record-state warn">待启动</span></td><td><button class="text-button" type="button" data-staff-action="已进入项目启动与人员分派">启动项目</button></td></tr></tbody></table></section>`;
      return;
    }
    if (role === "ops" && state.page === "handoffs") {
      $("#main").innerHTML = `${pageHeader("CONTROLLED HANDOFFS", "交接中心", statusChip("2 项等待接收", "warn"))}
        <section class="handoff-flow" aria-label="标准交接链"><span class="done">商务</span><i>→</i><span class="current">运营</span><i>→</i><span>制备专家</span><i>→</i><span>独立复核</span><i>→</i><span>客户审批</span></section>
        <section class="panel wide-panel"><div class="panel-head"><div><h2>待处理交接</h2><span>每次交接都有范围、资料、完成条件和接收确认</span></div></div><table class="data-table"><thead><tr><th>交接单</th><th>从 / 到</th><th>服务订单</th><th>交接内容</th><th>完成条件</th><th>状态</th></tr></thead><tbody><tr><td><strong>HO-2027-043</strong><small>今天 09:20</small></td><td>商务 → 运营</td><td>SO-2027-022</td><td>已签合同、客户联系人、首年建档范围</td><td>运营确认团队与启动日</td><td><button class="button button--primary" type="button" data-staff-action="已接收交接并启动 SLA">接收</button></td></tr><tr><td><strong>HO-2027-041</strong><small>昨天</small></td><td>专家 → 客户</td><td>SO-2027-018</td><td>供应商默认值风险路径</td><td>客户审批人具名决定</td><td><span class="record-state warn">等待客户</span></td></tr></tbody></table></section>`;
      return;
    }
    if (role === "ops" && state.page === "sla") {
      $("#main").innerHTML = `${pageHeader("SERVICE LEVEL CONTROL", "SLA 与阻塞", '<p class="head-note">运营看到“哪类材料、谁负责、何时到期”，不会展开材料正文或逐项排放底稿。</p>')}
        <div class="metric-line"><div><span>今日到期</span><strong>5</strong></div><div><span>已逾期</span><strong>2</strong></div><div><span>等待客户</span><strong>9</strong></div><div><span>等待专家</span><strong>6</strong></div></div>
        <section class="panel wide-panel"><div class="panel-head"><h2>需要干预</h2><button class="text-button" type="button">责任方 ▾</button></div><table class="data-table"><thead><tr><th>项目</th><th>阻塞类别</th><th>责任方</th><th>已等待</th><th>承诺时间</th><th>运营动作</th></tr></thead><tbody>
          <tr><td><strong>远航铝业 · 2026</strong><small>核查整改</small></td><td>客户解释月度异常</td><td>孙哲 · EHS</td><td>3 天</td><td class="text-danger">今天 16:00</td><td><button class="text-button" type="button" data-staff-action="已发送温和提醒">提醒</button></td></tr>
          <tr><td><strong>华星钢铁 · 2027</strong><small>数据采集</small></td><td>供应商来源确认</td><td>周岚 · 协调人</td><td>18 小时</td><td>明天</td><td>已安排 Agent 任务</td></tr>
          <tr><td><strong>北辰化工 · 2027</strong><small>供应商协同</small></td><td>外部回函</td><td>采购部</td><td>6 天</td><td class="text-danger">逾期 1 天</td><td><button class="text-button" type="button" data-staff-action="已升级给客户协调人">升级</button></td></tr>
        </tbody></table></section>`;
      return;
    }
    if (role === "ops" && state.page === "resources") {
      $("#main").innerHTML = `${pageHeader("CAPACITY & EXCEPTIONS", "资源与异常", statusChip("2 项需调度", "warn"))}
        <div class="content-split"><section class="panel workload-panel"><div class="panel-head"><h2>专家本周负载</h2><button class="text-button" type="button" data-drawer="record-detail" data-drawer-label="专家排期与容量" data-drawer-object="本周全部工作包" data-drawer-action="发起任务调度">查看排期</button></div><div class="workload-list">
          <div><span><strong>王晨</strong><small>钢铁 · 6 个项目</small></span><b>94%</b><i><em style="width:94%"></em></i></div>
          <div><span><strong>李明</strong><small>铝 · 5 个项目</small></span><b>88%</b><i><em style="width:88%"></em></i></div>
          <div><span><strong>周敏</strong><small>化工 · 4 个项目</small></span><b>71%</b><i><em style="width:71%"></em></i></div>
          <div><span><strong>赵宁</strong><small>钢铁 · 2 个项目</small></span><b>46%</b><i><em style="width:46%"></em></i></div>
        </div></section><aside class="panel"><div class="panel-head"><h2>系统与人工升级</h2></div><div class="stack-list"><div class="stack-row"><span>文件解析</span><strong>1 个 Excel 列头无法识别</strong><small>已转人工映射 · 12 分钟前</small></div><div class="stack-row"><span>权限</span><strong>供应商任务链接即将过期</strong><small>北辰化工 · 余 4 小时</small></div><div class="stack-row"><span>规则</span><strong>2027 Rulepack 校验完成</strong><small>无失败运行</small></div></div></aside></div>`;
      return;
    }
    if (role === "sales" && state.page === "quotes") {
      $("#main").innerHTML = `${pageHeader("COMMERCIAL PIPELINE", "报价与合同", statusChip("4 个等待反馈", "warn"))}
        <section class="panel wide-panel"><div class="panel-head"><h2>进行中的方案</h2><button class="action primary-action" type="button" data-staff-action="已创建方案草稿">新建方案</button></div><table class="data-table"><thead><tr><th>客户</th><th>服务范围</th><th>方案阶段</th><th>预计启动</th><th>合规数据</th><th>下一动作</th></tr></thead><tbody>
          <tr><td><strong>华星钢铁</strong><small>Q-2027-041</small></td><td>2 设施 · 4 产品 · 年度服务</td><td><span class="record-state warn">客户评审</span></td><td>2026-11-01</td><td class="privacy-cell">仅里程碑摘要</td><td>周五跟进</td></tr>
          <tr><td><strong>新锐紧固件</strong><small>Q-2027-044</small></td><td>适用性诊断 + 首年建档</td><td><span class="record-state">准备中</span></td><td>待确认</td><td class="privacy-cell">尚未授权</td><td>完成产品范围</td></tr>
          <tr><td><strong>北辰化工</strong><small>Q-2027-038</small></td><td>核算 + 核查支持</td><td><span class="record-state ok">已签署</span></td><td>2026-10-15</td><td class="privacy-cell">项目状态可见</td><td><button class="text-button" type="button" data-staff-action="已生成服务订单 SO-2027-022 与交接单 HO-2027-043">合同转订单</button></td></tr>
        </tbody></table></section>`;
      return;
    }
    if (role === "sales" && state.page === "accounts") {
      $("#main").innerHTML = `${pageHeader("ACCOUNT RELATIONSHIPS", "客户关系", '<p class="head-note">仅显示客户授权的结果摘要、服务里程碑与商业动作；专家意见和生产底稿不会出现在这里。</p>')}
        <div class="account-grid"><article><small>年度服务客户</small><h2>华星钢铁</h2><p>项目健康度良好，2027 数据采集达到 62%。客户希望将 2028 年新增设施纳入服务。</p><dl><div><dt>关系负责人</dt><dd>陈宇</dd></div><div><dt>下次会议</dt><dd>10 月 12 日</dd></div><div><dt>续费信号</dt><dd>新增设施</dd></div></dl><button class="action primary-action" type="button" data-staff-action="已记录客户沟通">记录沟通</button></article><article><small>核查支持客户</small><h2>远航铝业</h2><p>2026 正在核查整改。商务只看到可能影响交付日期，不展示 Finding 证据内容。</p><dl><div><dt>关系负责人</dt><dd>陈宇</dd></div><div><dt>项目里程碑</dt><dd>核查整改</dd></div><div><dt>续费时间</dt><dd>12 月</dd></div></dl><button class="action secondary-action" type="button" data-drawer="record-detail" data-drawer-label="远航铝业商务记录" data-drawer-scope="会议、报价、合同与续费信号">查看商务记录</button></article></div>`;
    }
  }

  function toast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove("show"), 2800);
  }

  $("#loginForm").addEventListener("submit", (event) => { event.preventDefault(); login("customer_owner"); });
  document.querySelectorAll("[data-demo-role]").forEach((button) => button.addEventListener("click", () => login(button.dataset.demoRole)));
  $("#logoutButton").addEventListener("click", logout);
  $("#settingsButton").addEventListener("click", () => { if (canManageOrganization()) { state.page = "org-settings"; render(); } });
  document.querySelector(".company-switch").addEventListener("click", () => { if (canManageOrganization()) { state.page = "org-settings"; render(); } });
  $("#roleSelect").addEventListener("change", (event) => {
    state.role = event.target.value;
    if (state.role === "customer_admin") state.year = "2027";
    state.page = defaultPages[state.role];
    render();
    toast(`已切换为${iconLabel(state.role)}。正式产品将由账号权限决定。`);
  });
  $("#yearSelect").addEventListener("change", (event) => {
    if (event.target.value === "new") {
      state.page = "annual-setup";
      render();
      return;
    }
    savePeriodState();
    state.year = event.target.value;
    loadPeriodState();
    render();
    toast(`已切换到 ${state.year} 年度，页面数据与版本已整体切换。`);
  });
  $("#quarterSelect").addEventListener("change", (event) => {
    savePeriodState();
    state.quarter = event.target.value;
    loadPeriodState();
    render();
    toast(`已切换到 ${state.year} ${state.quarter} 数据包；年度主档和年度报告不受影响。`);
  });
  $("#mobileMenu").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("open");
    $("#mobileMenu").setAttribute("aria-expanded", String(open));
    $("#mobileMenu").setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if ($("#drawerLayer").hidden) return;
    if (event.key === "Escape") { closeDrawer(); return; }
    if (event.key === "Tab") {
      const focusable = [...$("#drawer").querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  document.addEventListener("click", (event) => {
    const closeDrawerButton = event.target.closest("[data-close-drawer]");
    if (closeDrawerButton) { closeDrawer(); return; }
    const drawerTrigger = event.target.closest("[data-drawer]");
    if (drawerTrigger) {
      openDrawer(drawerTrigger.dataset.drawer, {
        title: drawerTrigger.dataset.drawerLabel || drawerTrigger.textContent.trim(),
        eyebrow: drawerTrigger.dataset.drawerEyebrow,
        object: drawerTrigger.dataset.drawerObject,
        status: drawerTrigger.dataset.drawerStatus,
        owner: drawerTrigger.dataset.drawerOwner,
        scope: drawerTrigger.dataset.drawerScope,
        description: drawerTrigger.dataset.drawerDescription,
        action: drawerTrigger.dataset.drawerAction,
        submitLabel: drawerTrigger.dataset.drawerSubmit,
      });
      return;
    }
    const nav = event.target.closest("[data-page]");
    if (nav) { state.page = nav.dataset.page; render(); $("#sidebar").classList.remove("open"); $("#mobileMenu").setAttribute("aria-expanded", "false"); $("#mobileMenu").setAttribute("aria-label", "打开导航"); $("#main").focus({ preventScroll: true }); return; }
    const answer = event.target.closest("[data-answer]");
    if (answer) {
      if (isLockedYear()) { toast("锁定年度不能原位修改；请先创建更正申请。"); return; }
      state.answer = answer.dataset.answer; state.questionHelpOpen = false; render(); toast(state.answer === "delegate" ? "任务已转交给生产负责人，并保留当前上下文。下一步可以继续核对产品。" : "回答已保存为待确认建议。下一步请核对产品与生产配置。"); return;
    }
    const pathChoice = event.target.closest("[data-path-choice]");
    if (pathChoice) { state.dataPathChoice = pathChoice.dataset.pathChoice; render(); return; }
    const delivery = event.target.closest("[data-delivery]");
    if (delivery) { state.deliveryExpanded = state.deliveryExpanded === delivery.dataset.delivery ? null : delivery.dataset.delivery; render(); return; }
    const product = event.target.closest("[data-product]");
    if (product) { state.selectedProduct = product.dataset.product; state.configurationAdded = false; render(); return; }
    const quarter = event.target.closest("[data-quarter]");
    if (quarter) { savePeriodState(); state.quarter = quarter.dataset.quarter; loadPeriodState(); render(); toast(`正在查看 ${state.year} ${state.quarter} 数据包。`); return; }
    const customerAction = event.target.closest("[data-action]");
    if (customerAction) {
      const action = customerAction.dataset.action;
      if (isLockedYear() && ["mock-upload", "toggle-product-form", "add-configuration", "edit-product", "confirm-fact", "resolve-finding"].includes(action)) { toast("锁定年度为不可变快照；请通过更正申请创建新修订版。"); return; }
      if (action === "open-year-setup") { state.page = "annual-setup"; render(); }
      if (action === "enter-program") {
        savePeriodState();
        state.year = customerAction.dataset.year || "2027";
        state.role = "customer_owner";
        state.page = "work";
        loadPeriodState();
        render();
        toast(`已进入 ${state.year} 年度项目协调视图。`);
      }
      if (action === "review-trial") { state.page = "products"; render(); toast("试算信息已作为待核对线索带入，不会直接写入正式数据。"); }
      if (action === "mock-upload") openDrawer("upload-evidence");
      if (action === "explain-question") { state.questionHelpOpen = !state.questionHelpOpen; render(); }
      if (action === "revise-answer") { state.answer = null; render(); toast("可以重新回答；原建议尚未写入正式数据。"); }
      if (action === "toggle-product-form") openDrawer("new-product");
      if (action === "add-configuration") openDrawer("new-configuration");
      if (action === "edit-product") {
        const selected = { ...({
          hrc: { name: "热轧非合金钢卷", code: "HRC-01" },
          coated: { name: "镀层钢板", code: "CTS-01" },
          section: { name: "型钢", code: "SEC-01" },
          wire: { name: "非合金钢盘条", code: "WRD-01" },
          cold: { name: "冷轧非合金钢板", code: "CRS-02" },
        }[state.selectedProduct] || { name: "热轧非合金钢卷", code: "HRC-01" }), ...(state.productOverrides[state.selectedProduct] || {}) };
        openDrawer("edit-product", { name: selected.name, code: selected.code });
      }
      if (action === "toggle-org-edit") openDrawer("organization-edit");
      if (action === "confirm-fact") { state.factConfirmed = true; render(); toast("提取结果已确认并进入 Run 05。下一步请查看成本与数据路径。"); }
      if (action === "resolve-finding") { state.findingChoiceOpen = true; render(); document.querySelector(".decision-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
      if (action === "close-path-choice") { state.findingChoiceOpen = false; state.dataPathChoice = null; render(); }
      if (action === "confirm-data-path" && state.dataPathChoice) { state.findingResolved = true; state.findingChoiceOpen = false; render(); toast("数据处理路径已记录。下一步请检查合规交付准备度。"); }
      if (action === "document-preview") openDrawer("document-preview");
      if (action === "invite-member") openDrawer("invite-member");
      if (action === "create-year") {
        savePeriodState();
        years["2028"] = { label: "2028 · 变化确认", short: "变化确认中", progress: 8, chip: "warn" };
        state.year = "2028";
        state.yearCreated = true;
        state.page = "programs";
        loadPeriodState();
        render();
        toast("2028 年度已创建：只带入结构建议，未复制年度数值。可从列表进入协调视图确认变化。");
      }
      return;
    }
    const action = event.target.closest("[data-staff-action]");
    if (action) {
      openDrawer("generic-action", {
        eyebrow: `${iconLabel(state.role).toUpperCase()} ACTION`,
        title: action.textContent.trim() || "完成操作",
        description: `${action.dataset.staffAction}。请补充判断或处理依据；对象、操作者和时间会写入审计记录。`,
        submitLabel: action.textContent.trim().includes("通过") ? "确认通过" : "确认并记录",
      });
      return;
    }
    const detailButton = event.target.closest("button");
    const detailMessages = {
      "查找重复": "已扫描产品名称、编码和年度范围，未发现重复项。",
      "责任人 ▾": "责任人筛选包含财务、采购、生产和项目协调人。",
      "查看计算假设": "已打开 Run 05 的证书价格、默认值、benchmark 和汇率假设。",
      "查看完整计算血缘 →": "已打开从业务事实、证据到 Calculation Run 05 的完整血缘。",
      "查看权限矩阵 →": "已打开企业、年度、设施和数据敏感级别权限矩阵。",
    };
    if (detailButton && detailMessages[detailButton.textContent.trim()]) {
      openDrawer(detailButton.textContent.includes("权限") ? "permission-audit" : "record-detail", {
        title: detailButton.textContent.trim().replace(" →", ""),
        description: detailMessages[detailButton.textContent.trim()],
      });
      return;
    }
    if (detailButton && detailButton.closest("#main")) {
      openDrawer("record-detail", {
        title: detailButton.textContent.trim().replace(" ▾", "").replace(" →", "") || "查看详情",
        description: "此入口在原型中展示当前对象、角色权限和下一步。正式产品将根据筛选或所选记录加载对应数据。",
      });
    }
  });

  document.addEventListener("submit", (event) => {
    const activeDrawerForm = event.target.closest("[data-drawer-form]");
    if (activeDrawerForm) {
      event.preventDefault();
      const id = activeDrawerForm.dataset.drawerForm;
      const formData = new FormData(activeDrawerForm);
      const title = $("#drawerTitle").textContent;
      if (id === "upload-evidence") {
        state.uploadAdded = true;
        closeDrawer(); render();
        toast("材料已上传并进入 Agent 提取区。下一步请确认账期、设施和数值。");
        return;
      }
      if (id === "new-product") {
        state.productYears = formData.getAll("productYears");
        state.productCnCodes = String(formData.get("cnCodes") || "").split(/[，,;；\s]+/).map((code) => code.trim()).filter(Boolean);
        state.productOverrides.cold = {
          name: String(formData.get("productName") || "冷轧非合金钢板"),
          code: String(formData.get("internalCode") || "CRS-02"),
          cnCandidates: state.productCnCodes,
          scope: state.productYears,
        };
        state.productAdded = true;
        state.selectedProduct = "cold";
        closeDrawer(); render();
        toast(`产品主档已创建；${state.productYears.length ? `已纳入 ${state.productYears.join("、")} 年度` : "可稍后纳入年度项目"}。下一步请添加生产配置。`);
        return;
      }
      if (id === "new-configuration") {
        state.configurationAdded = true;
        state.configurationDrafts[state.selectedProduct] = {
          facility: String(formData.get("facility") || "设施待确认"),
          process: String(formData.get("process") || "工艺待确认"),
          precursor: String(formData.get("precursor") || "前体待确认"),
          basis: String(formData.get("basis") || ""),
        };
        state.answer = null;
        closeDrawer(); render();
        toast("生产配置草稿已创建。下一步由 Agent 用业务问题确认工艺和前体来源。");
        return;
      }
      if (id === "edit-product") {
        state.productOverrides[state.selectedProduct] = {
          ...(state.productOverrides[state.selectedProduct] || {}),
          name: String(formData.get("productName") || ""),
          code: String(formData.get("internalCode") || ""),
        };
      }
      if (id === "manage-cn") {
        const candidate = String(formData.get("cnCode") || "").trim();
        if (candidate) {
          const existingCandidates = state.productOverrides[state.selectedProduct]?.cnCandidates || (state.selectedProduct === "cold" ? state.productCnCodes : []);
          const candidates = [...new Set([...existingCandidates, candidate])];
          state.productOverrides[state.selectedProduct] = {
            ...(state.productOverrides[state.selectedProduct] || {}),
            cnCandidates: candidates,
            cn: `CN ${candidates.join(" / ")} · 候选待确认`,
          };
          if (state.selectedProduct === "cold") state.productCnCodes = candidates;
        }
      }
      if (id === "manage-years") {
        const selectedYears = formData.getAll("productYears");
        state.productOverrides[state.selectedProduct] = {
          ...(state.productOverrides[state.selectedProduct] || {}),
          scope: selectedYears,
        };
        if (state.selectedProduct === "cold") state.productYears = selectedYears;
      }
      if (id === "new-facility") {
        state.facilities.push({
          name: String(formData.get("facilityName") || "未命名设施"),
          code: String(formData.get("facilityCode") || `FAC-${state.facilities.length + 3}`),
          activity: String(formData.get("activity") || "生产活动待补充"),
          status: String(formData.get("status") || "在建"),
        });
      }
      if (id === "invite-member") {
        state.invitedMembers.push({
          email: String(formData.get("email") || "pending@example.com"),
          role: String(formData.get("role") || "数据贡献者"),
          scope: String(formData.get("scope") || "仅分配给我的任务"),
          expiresAt: String(formData.get("expiresAt") || "未设置"),
        });
      }
      if (id === "organization-edit") {
        state.organization = {
          name: String(formData.get("organizationName") || state.organization.name),
          code: String(formData.get("organizationCode") || state.organization.code),
          address: String(formData.get("organizationAddress") || state.organization.address),
        };
        state.orgEditing = false;
      }
      closeDrawer(); render();
      const completionMessages = {
        "edit-product": "产品主档新版本已保存。下一步检查年度范围和生产配置。",
        "manage-cn": "CN Code 候选已保存。下一步等待关务或专家确认并记录依据。",
        "manage-years": "产品年度范围已更新；锁定年度保持不变。",
        "service-scope": "范围变更申请已提交运营评估。当前服务订单不会被直接覆盖。",
        "shipping-import": "发运台账已进入列映射预览。下一步确认重复批次和进口商范围。",
        "invite-member": "成员邀请已创建。下一步由受邀人接受后生效。",
        "organization-edit": "企业主档版本已保存。新年度将引用生效日对应版本。",
        "new-facility": "设施主档已创建。下一步选择纳入的年度并配置生产活动。",
        "generic-action": `${title}已记录；对象、理由、责任人和时间已写入审计。`,
      };
      toast(completionMessages[id] || `${title}已保存；下一步状态已更新。`);
      return;
    }
  });

  if (state.importedTrial) {
    const notice = $("#importNotice");
    notice.hidden = false;
    notice.innerHTML = `<strong>已保留刚才的试算摘要</strong>${state.importedTrial.year} 年 · CN ${state.importedTrial.cnCode} · ${state.importedTrial.quantity.toLocaleString("zh-CN")} 吨。登录后可核对并建立正式项目。`;
  }
})();
