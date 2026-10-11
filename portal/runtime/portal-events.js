"use strict";

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
  document.querySelector(".company-switch").addEventListener("click", () => {
    if (canManageOrganization()) { state.page = "org-settings"; render(); return; }
    openDrawer("record-detail", { title: isCustomer() ? "当前企业" : "当前工作区", object: isCustomer() ? state.organization.name : roleConfig[state.role].company, status: "由账号与授权决定", description: "正式产品会在这里切换你有权访问的企业或工作区；当前原型固定展示一个上下文。" });
  });
  $("#roleSelect").addEventListener("change", (event) => {
    state.role = event.target.value;
    if (customerRoles.has(state.role)) { state.year = "2026"; state.quarter = "Q3"; }
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
    state.quarter = annualProfile().defaultQuarter;
    loadPeriodState(); syncUiFromWorkflow();
    render();
    toast(`已切换到 ${state.year} 年度，页面数据与版本已整体切换。`);
  });
  $("#quarterSelect").addEventListener("change", (event) => {
    savePeriodState();
    state.quarter = event.target.value;
    loadPeriodState(); syncUiFromWorkflow();
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
        flow: drawerTrigger.dataset.flow,
      });
      return;
    }
    const nav = event.target.closest("[data-page]");
    if (nav) { state.page = nav.dataset.page; render(); $("#sidebar").classList.remove("open"); $("#mobileMenu").setAttribute("aria-expanded", "false"); $("#mobileMenu").setAttribute("aria-label", "打开导航"); $("#main").focus({ preventScroll: true }); return; }
    const answer = event.target.closest("[data-answer]");
    if (answer) {
      if (isLockedYear()) { toast("锁定年度不能原位修改；请先创建更正申请。"); return; }
      state.answer = answer.dataset.answer; state.questionHelpOpen = false; persistPortalState(); render(); toast(state.answer === "delegate" ? "任务已转交给生产负责人，并保留当前上下文。下一步可以继续核对产品。" : "回答已保存为待确认建议。下一步请核对产品与生产配置。"); return;
    }
    const pathChoice = event.target.closest("[data-path-choice]");
    if (pathChoice) { state.dataPathChoice = pathChoice.dataset.pathChoice; persistPortalState(); render(); return; }
    const delivery = event.target.closest("[data-delivery]");
    if (delivery) { state.deliveryExpanded = state.deliveryExpanded === delivery.dataset.delivery ? null : delivery.dataset.delivery; render(); return; }
    const product = event.target.closest("[data-product]");
    if (product) { state.selectedProduct = product.dataset.product; state.configurationAdded = false; render(); return; }
    const quarter = event.target.closest("[data-quarter]");
    if (quarter) { savePeriodState(); state.quarter = quarter.dataset.quarter; loadPeriodState(); syncUiFromWorkflow(); render(); toast(`正在查看 ${state.year} ${state.quarter} 数据包。`); return; }
    const workflowTransition = event.target.closest("[data-workflow-transition]");
    if (workflowTransition) {
      try {
        const target = workflowTransition.dataset.workflowTransition;
        const objectId = workflowTransition.dataset.objectId;
        workflowEngine.transition(objectId, target, { ...workflowActor(), reason: target === "APPROVED" ? "内部审批人同意默认值并行路径" : "退回项目协调人补充判断依据" });
        render();
        toast(`AP-2026-014 已更新为“${workflowStateLabel(target)}”，审计事件已记录。`);
      } catch (error) { toast(error.message); }
      return;
    }
    const customerAction = event.target.closest("[data-action]");
    if (customerAction) {
      const action = customerAction.dataset.action;
      if (action === "dismiss-onboarding") { state.onboardingDismissed = true; window.localStorage.setItem("lumino-portal-onboarding", "dismissed"); render(); toast("快速引导已收起；可随时从“操作指南”查看完整流程。"); }
      if (action === "start-onboarding") { state.onboardingDismissed = true; window.localStorage.setItem("lumino-portal-onboarding", "dismissed"); render(); document.querySelector(".agent-task")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
      if (action === "replay-onboarding") { state.onboardingDismissed = false; window.localStorage.removeItem("lumino-portal-onboarding"); state.page = "work"; render(); document.querySelector(".onboarding-guide")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
      if (isLockedYear() && ["mock-upload", "toggle-product-form", "add-configuration", "edit-product", "confirm-fact", "resolve-finding"].includes(action)) { toast("锁定年度为不可变快照；请通过更正申请创建新修订版。"); return; }
      if (action === "open-year-setup") { state.page = "annual-setup"; render(); }
      if (action === "enter-program") {
        savePeriodState();
        state.year = customerAction.dataset.year || "2026";
        state.quarter = annualProfile().defaultQuarter;
        state.page = "work";
        loadPeriodState(); syncUiFromWorkflow();
        render();
        toast(`已进入 ${state.year} 年度项目协调视图。`);
      }
      if (action === "review-trial") { state.page = "products"; render(); toast("试算信息已作为待核对线索带入，不会直接写入正式数据。"); }
      if (action === "mock-upload") openDrawer("upload-evidence");
      if (action === "explain-question") { state.questionHelpOpen = !state.questionHelpOpen; render(); }
      if (action === "revise-answer") { state.answer = null; persistPortalState(); render(); toast("可以重新回答；原建议尚未写入正式数据。"); }
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
      if (action === "confirm-fact") {
        try {
          const evidenceId = `EVD-${state.year}-${state.quarter}-GAS`;
          const factId = `FACT-${state.year}-${state.quarter}-GAS`;
          ensureWorkflowObject({ id: evidenceId, type: "evidence", status: "PARSED", owner: roleConfig[state.role].name, year: state.year, quarter: state.quarter, scope: "天然气账单" });
          moveWorkflow(evidenceId, ["CLASSIFIED", "LINKED", "REVIEWED", "ACCEPTED"], "项目协调人确认证据的账期、设施与提取值");
          ensureWorkflowObject({ id: factId, type: "fact", status: "MISSING", owner: roleConfig[state.role].name, year: state.year, quarter: state.quarter, scope: "天然气用量" });
          moveWorkflow(factId, ["PROPOSED", "NEEDS_CONFIRMATION", "CONFIRMED"], "已将通过复核的证据确认为本期业务事实", { evidenceId });
          workflowEngine.invalidateDependents(factId, { ...workflowActor(), reason: `事实 ${factId} 已确认，原当前计算版本失效` });
          const runId = `RUN-05-${state.year}-${state.quarter}`;
          ensureWorkflowObject({ id: runId, type: "calculationRun", status: "QUEUED", owner: "王晨", year: state.year, quarter: state.quarter, dependsOn: [factId], metadata: { rulepack: `EU-CBAM-${state.year}.1` } });
          moveWorkflow(runId, ["RUNNING", "SUCCEEDED", "CURRENT"], "以已确认事实创建新计算版本");
          state.factConfirmed = true; persistPortalState(); render(); toast("提取结果已确认；旧计算版本已失效，Run 05 成为当前版本。");
        } catch (error) { toast(error.message); }
      }
      if (action === "resolve-finding") { state.findingChoiceOpen = true; render(); document.querySelector(".decision-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
      if (action === "close-path-choice") { state.findingChoiceOpen = false; state.dataPathChoice = null; persistPortalState(); render(); }
      if (action === "confirm-data-path" && state.dataPathChoice) {
        try {
          moveWorkflow("FND-PRE-004", ["TRIAGED", "ASSIGNED", "RESPONSE_SUBMITTED", "VALIDATING"], `客户已选择数据处理路径：${state.dataPathChoice}`, { path: state.dataPathChoice });
          const packageId = `PKG-${state.year}-${state.quarter}-NORDWERK`;
          if (workflowEngine.get(packageId)?.status === "COLLECTING") moveWorkflow(packageId, ["READY_FOR_REVIEW"], "本季度关键事实和数据路径已确认");
          state.findingResolved = true; state.findingChoiceOpen = false; persistPortalState(); render(); toast("处理路径已提交并进入专家验证；Finding 尚未关闭。");
        } catch (error) { toast(error.message); }
      }
      if (action === "advance-workflow") {
        const flow = workflowView(customerAction.dataset.flow);
        const target = customerAction.dataset.target;
        if (["ACKNOWLEDGED", "LOCKED", "CLOSED"].includes(target)) { toast("该关键状态需要回执、快照或解决依据，不能快速推进。"); return; }
        try {
          workflowEngine.transition(flow.object.id, target, { ...workflowActor(), reason: `从状态中心执行下一步：${workflowStateLabel(target)}` });
          closeDrawer(); render(); toast(`${flow.object.id} 已推进至“${workflowStateLabel(target)}”。`);
        } catch (error) { toast(error.message); }
      }
      if (action === "document-preview") openDrawer("document-preview");
      if (action === "invite-member") openDrawer("invite-member");
      if (action === "create-year") {
        savePeriodState();
        years["2028"] = { label: "2028 · 变化确认", short: "变化确认中", progress: 8, chip: "warn" };
        state.year = "2028";
        state.yearCreated = true;
        state.page = "programs";
        loadPeriodState(); syncUiFromWorkflow(); persistPortalState();
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
      if (state.actionBusy) return;
      state.actionBusy = true;
      const submitButton = activeDrawerForm.querySelector('[type="submit"]');
      if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalLabel = submitButton.textContent; submitButton.textContent = "正在保存…"; }
      const id = activeDrawerForm.dataset.drawerForm;
      const formData = new FormData(activeDrawerForm);
      const title = $("#drawerTitle").textContent;
      if (id === "upload-evidence") {
        const file = formData.get("file");
        if (file && file.size > 30 * 1024 * 1024) {
          state.actionBusy = false;
          if (submitButton) { submitButton.disabled = false; submitButton.textContent = submitButton.dataset.originalLabel; }
          toast("文件超过 30 MB。请压缩或拆分后重试；已填写内容不会丢失。");
          return;
        }
        const evidenceId = `EVD-${state.year}-${state.quarter}-GAS`;
        ensureWorkflowObject({ id: evidenceId, type: "evidence", status: "UPLOADED", owner: roleConfig[state.role].name, year: state.year, quarter: state.quarter, scope: String(formData.get("facility") || "设施待确认"), metadata: { filename: file?.name || "demo-evidence.pdf", materialType: String(formData.get("type") || "能源账单") } });
        moveWorkflow(evidenceId, ["SECURITY_SCANNED", "PARSED"], "文件已通过安全扫描并完成 Agent 提取", { filename: file?.name || "demo-evidence.pdf" });
        state.uploadAdded = true;
        persistPortalState();
        state.actionBusy = false;
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
        persistPortalState();
        state.actionBusy = false;
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
        persistPortalState();
        state.actionBusy = false;
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
      persistPortalState();
      closeDrawer(); render();
      state.actionBusy = false;
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
