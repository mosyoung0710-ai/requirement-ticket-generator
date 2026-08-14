(function (globalScope) {
  "use strict";

  const STORAGE_KEY = "ticket-queue-r001-state";
  const ACTIVE_STATUSES = new Set(["排队中", "评估中", "处理中"]);
  const SHORT_TEXT_LIMIT = 40;
  const WAIT_TEXT_LIMIT = 200;
  const DYNAMIC_TEXT_LIMIT = 200;
  const DEFAULT_TEMPLATE_ID = "classic";
  const BACKUP_SCHEMA_VERSION = 1;
  const PRINT_SIZE_PRESETS = {
    "80x180": { width: 80, height: 180 },
    "80x130": { width: 80, height: 130 }
  };
  const A4 = { width: 210, height: 297 };
  const A4_COPY_OPTIONS = [1, 2, 4, 6];
  const MIXED_COPY_OPTIONS = [1, 2, 3, 4, 5, 6];
  const MIXED_SIZE_MODES = ["follow", "preset", "custom"];
  const PRIORITIES = [
    { id: "p0", level: "P0", name: "老板站我后面", color: "#d9473f" },
    { id: "p1", level: "P1", name: "真挺急", color: "#c57922" },
    { id: "p2", level: "P2", name: "有点急", color: "#486f9c" },
    { id: "p3", level: "P3", name: "普通", color: "#557e5b" }
  ];

  const TEMPLATES = [
    {
      id: "classic",
      name: "经典取号单",
      className: "template-classic",
      defaults: {
        title: "需求取号单",
        emoji: "🎫",
        center: "产品经理关怀中心",
        requirementName: "",
        roast: "别急，前面也都很急。",
        footer: "取号成功，请保持情绪稳定。"
      },
      styles: {
        title: { fontSize: 24, weight: "900", align: "center", color: "#211f1b" },
        emoji: { fontSize: 34, weight: "700", align: "center", color: "#211f1b" },
        center: { fontSize: 16, weight: "700", align: "center", color: "#6f685f" },
        departments: { fontSize: 17, weight: "700", align: "center", color: "#211f1b" },
        requirementName: { fontSize: 16, weight: "900", align: "center", color: "#211f1b" },
        roast: { fontSize: 20, weight: "900", align: "center", color: "#b73535" },
        type: { fontSize: 16, weight: "700", align: "center", color: "#211f1b" },
        priority: { fontSize: 16, weight: "700", align: "center", color: "#211f1b" },
        number: { fontSize: 38, weight: "900", align: "center", color: "#b73535" },
        ahead: { fontSize: 18, weight: "900", align: "center", color: "#211f1b" },
        waiting: { fontSize: 15, weight: "700", align: "center", color: "#496d91" },
        footer: { fontSize: 14, weight: "400", align: "center", color: "#6f685f" },
        cycle: { fontSize: 13, weight: "400", align: "center", color: "#6f685f" }
      }
    },
    {
      id: "rage",
      name: "暴躁打工人",
      className: "template-rage",
      defaults: {
        title: "打工人取号单",
        emoji: "🔥",
        center: "别催了服务台",
        requirementName: "",
        roast: "你急我也急，排队先排明白。",
        footer: "催也没用，插队请手动调整队列。"
      },
      styles: {
        title: { fontSize: 26, weight: "900", align: "center", color: "#9d2727" },
        emoji: { fontSize: 38, weight: "900", align: "center", color: "#9d2727" },
        center: { fontSize: 15, weight: "700", align: "center", color: "#6c4a00" },
        departments: { fontSize: 18, weight: "900", align: "center", color: "#211f1b" },
        requirementName: { fontSize: 16, weight: "900", align: "center", color: "#9d2727" },
        roast: { fontSize: 24, weight: "900", align: "center", color: "#9d2727" },
        type: { fontSize: 16, weight: "900", align: "center", color: "#211f1b" },
        priority: { fontSize: 17, weight: "900", align: "center", color: "#9d2727" },
        number: { fontSize: 42, weight: "900", align: "center", color: "#9d2727" },
        ahead: { fontSize: 22, weight: "900", align: "center", color: "#211f1b" },
        waiting: { fontSize: 16, weight: "700", align: "center", color: "#6c4a00" },
        footer: { fontSize: 14, weight: "700", align: "center", color: "#6f685f" },
        cycle: { fontSize: 13, weight: "700", align: "center", color: "#6f685f" }
      }
    },
    {
      id: "cute",
      name: "可爱敷衍版",
      className: "template-cute",
      defaults: {
        title: "软乎乎取号单",
        emoji: "🌷",
        center: "产品经理安抚小站",
        requirementName: "",
        roast: "收到啦，先排队，慢慢来但可控。",
        footer: "请拿好小票，快乐等待。"
      },
      styles: {
        title: { fontSize: 24, weight: "900", align: "center", color: "#b04478" },
        emoji: { fontSize: 38, weight: "900", align: "center", color: "#b04478" },
        center: { fontSize: 16, weight: "700", align: "center", color: "#557e5b" },
        departments: { fontSize: 17, weight: "700", align: "center", color: "#496d91" },
        requirementName: { fontSize: 16, weight: "900", align: "center", color: "#b04478" },
        roast: { fontSize: 20, weight: "900", align: "center", color: "#b04478" },
        type: { fontSize: 16, weight: "700", align: "center", color: "#496d91" },
        priority: { fontSize: 16, weight: "700", align: "center", color: "#b04478" },
        number: { fontSize: 38, weight: "900", align: "center", color: "#b04478" },
        ahead: { fontSize: 18, weight: "900", align: "center", color: "#557e5b" },
        waiting: { fontSize: 15, weight: "700", align: "center", color: "#496d91" },
        footer: { fontSize: 14, weight: "400", align: "center", color: "#6f685f" },
        cycle: { fontSize: 13, weight: "400", align: "center", color: "#6f685f" }
      }
    }
  ];

  const MODULE_DEFS = [
    { id: "title", label: "顶部标题", defaultVisible: true, dynamic: false },
    { id: "emoji", label: "Emoji/图标", defaultVisible: true, dynamic: false },
    { id: "center", label: "中心名称", defaultVisible: true, dynamic: false },
    { id: "departments", label: "涉及部门", defaultVisible: true, dynamic: true },
    { id: "requirementName", label: "需求名称", defaultVisible: true, dynamic: true },
    { id: "roast", label: "核心吐槽文案", defaultVisible: true, dynamic: false },
    { id: "type", label: "需求初判", defaultVisible: true, dynamic: true },
    { id: "priority", label: "优先级", defaultVisible: true, dynamic: true },
    { id: "number", label: "排队编号", defaultVisible: true, dynamic: true },
    { id: "ahead", label: "前方需求数", defaultVisible: true, dynamic: true },
    { id: "waiting", label: "等待参考", defaultVisible: false, dynamic: true },
    { id: "footer", label: "底部提示", defaultVisible: true, dynamic: false },
    { id: "cycle", label: "编号轮次", defaultVisible: false, dynamic: true }
  ];

  const MODULE_IDS = MODULE_DEFS.map((module) => module.id);

  const defaultState = () => ({
    departments: [
      { id: uid("dep"), name: "设计部", color: "#6f685f", active: true },
      { id: uid("dep"), name: "品牌部", color: "#6f685f", active: true },
      { id: uid("dep"), name: "宣传部", color: "#6f685f", active: true },
      { id: uid("dep"), name: "研发部", color: "#6f685f", active: true }
    ],
    types: [
      { id: uid("type"), prefix: "A", name: "小改", color: "#b73535", active: true, cycle: 1, next: 1 },
      { id: uid("type"), prefix: "B", name: "中等改动", color: "#496d91", active: true, cycle: 1, next: 1 },
      { id: uid("type"), prefix: "C", name: "大改", color: "#a66d20", active: true, cycle: 1, next: 1 },
      { id: uid("type"), prefix: "D", name: "待评估", color: "#6f685f", active: true, cycle: 1, next: 1 }
    ],
    priorities: PRIORITIES.map((priority) => ({ ...priority })),
    requirements: [],
    ticketDefault: null,
    printPreferences: defaultPrintPreferences()
  });

  const defaultPrintPreferences = () => ({
    requirementId: "",
    snapshotId: "",
    mode: "single",
    sizePreset: "80x180",
    customWidth: 80,
    customHeight: 180,
    a4Copies: 2,
    a4Margin: 10,
    a4Gap: 5,
    cutLines: true,
    a4ContentMode: "same",
    mixedItems: []
  });

  let state = loadState();
  let filters = {
    search: "",
    departments: [],
    type: "",
    priority: "",
    status: ""
  };
  let currentTicketId = "";
  let selectedTicketModuleId = "roast";
  let pendingRestoreState = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindNavigation();
    bindForm();
    bindFilters();
    bindSettings();
    bindTicketEditor();
    bindPrint();
    bindBackupRestore();
    renderAll();
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaultState();
      const parsed = JSON.parse(saved);
      return normalizeState(parsed);
    } catch (error) {
      console.warn("读取本地数据失败，已使用默认数据", error);
      return defaultState();
    }
  }

  function normalizeState(raw) {
    const fresh = defaultState();
    const priorities = Array.isArray(raw?.priorities) ? raw.priorities : fresh.priorities;
    return {
      departments: (Array.isArray(raw?.departments) ? raw.departments : fresh.departments).map((item) => ({
        color: "#6f685f",
        active: true,
        ...item
      })),
      types: (Array.isArray(raw?.types) ? raw.types : fresh.types).map((item) => ({
        color: "#6f685f",
        active: true,
        cycle: 1,
        next: 1,
        ...item
      })),
      priorities: PRIORITIES.map((fixed) => {
        const saved = priorities.find((item) => item.id === fixed.id || item.level === fixed.level);
        return { ...fixed, ...(saved || {}), id: fixed.id, level: fixed.level };
      }),
      requirements: (Array.isArray(raw?.requirements) ? raw.requirements : []).map(normalizeRequirement),
      ticketDefault: normalizeTicketDefault(raw?.ticketDefault),
      printPreferences: normalizePrintPreferences(raw?.printPreferences)
    };
  }

  function normalizePrintPreferences(raw) {
    const defaults = defaultPrintPreferences();
    const item = raw && typeof raw === "object" ? raw : {};
    return {
      requirementId: typeof item.requirementId === "string" ? item.requirementId : defaults.requirementId,
      snapshotId: typeof item.snapshotId === "string" ? item.snapshotId : defaults.snapshotId,
      mode: item.mode === "a4" ? "a4" : "single",
      sizePreset: Object.hasOwn(PRINT_SIZE_PRESETS, item.sizePreset) || item.sizePreset === "custom" ? item.sizePreset : defaults.sizePreset,
      customWidth: Object.hasOwn(item, "customWidth") ? item.customWidth : defaults.customWidth,
      customHeight: Object.hasOwn(item, "customHeight") ? item.customHeight : defaults.customHeight,
      a4Copies: A4_COPY_OPTIONS.includes(Number(item.a4Copies)) ? Number(item.a4Copies) : defaults.a4Copies,
      a4Margin: Object.hasOwn(item, "a4Margin") ? item.a4Margin : defaults.a4Margin,
      a4Gap: Object.hasOwn(item, "a4Gap") ? item.a4Gap : defaults.a4Gap,
      cutLines: typeof item.cutLines === "boolean" ? item.cutLines : defaults.cutLines,
      a4ContentMode: item.a4ContentMode === "mixed" ? "mixed" : defaults.a4ContentMode,
      mixedItems: Array.isArray(item.mixedItems) ? item.mixedItems.map(normalizeMixedPrintItem).filter(Boolean) : defaults.mixedItems
    };
  }

  function normalizeMixedPrintItem(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const sizeMode = MIXED_SIZE_MODES.includes(raw.sizeMode) ? raw.sizeMode : "follow";
    const sizePreset = Object.hasOwn(PRINT_SIZE_PRESETS, raw.sizePreset) ? raw.sizePreset : "80x180";
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid("mix"),
      requirementId: typeof raw.requirementId === "string" ? raw.requirementId : "",
      snapshotId: typeof raw.snapshotId === "string" ? raw.snapshotId : "",
      copies: MIXED_COPY_OPTIONS.includes(Number(raw.copies)) ? Number(raw.copies) : 1,
      sizeMode,
      sizePreset,
      customWidth: Object.hasOwn(raw, "customWidth") ? raw.customWidth : 80,
      customHeight: Object.hasOwn(raw, "customHeight") ? raw.customHeight : 180
    };
  }

  function normalizeRequirement(raw) {
    const item = raw && typeof raw === "object" ? raw : {};
    return {
      id: item.id || uid("req"),
      title: typeof item.title === "string" ? item.title : "",
      departmentIds: Array.isArray(item.departmentIds) ? item.departmentIds : [],
      typeId: item.typeId || "",
      priorityId: item.priorityId || "p3",
      status: item.status || "排队中",
      estimate: normalizeEstimate(item.estimate),
      schedule: normalizeSchedule(item.schedule),
      waitingReference: normalizeWaitingReference(item.waitingReference),
      note: typeof item.note === "string" ? item.note : "",
      numberHistory: Array.isArray(item.numberHistory) ? item.numberHistory : [],
      ticketNo: item.ticketNo || "",
      ticketNumber: item.ticketNumber || null,
      ticketPrefix: item.ticketPrefix || "",
      ticketCycle: Number(item.ticketCycle || 1),
      ticketConfig: normalizeTicketConfig(item.ticketConfig),
      ticketSnapshots: Array.isArray(item.ticketSnapshots) ? item.ticketSnapshots.map(normalizeTicketSnapshot).filter(Boolean) : [],
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      wasInactive: Boolean(item.wasInactive)
    };
  }

  function normalizeEstimate(estimate) {
    if (!estimate || typeof estimate !== "object") return null;
    if (estimate.mode === "single" && validWorkday(Number(estimate.value))) {
      return { mode: "single", value: Number(estimate.value) };
    }
    if (estimate.mode === "range" && validWorkday(Number(estimate.min)) && validWorkday(Number(estimate.max)) && Number(estimate.min) <= Number(estimate.max)) {
      return { mode: "range", min: Number(estimate.min), max: Number(estimate.max) };
    }
    return null;
  }

  function normalizeSchedule(schedule) {
    const item = schedule && typeof schedule === "object" ? schedule : {};
    return {
      startDate: typeof item.startDate === "string" ? item.startDate : "",
      endDate: typeof item.endDate === "string" ? item.endDate : "",
      note: typeof item.note === "string" ? item.note : ""
    };
  }

  function normalizeWaitingReference(waitingReference) {
    const item = waitingReference && typeof waitingReference === "object" ? waitingReference : {};
    const mode = ["hidden", "manual", "suggested"].includes(item.mode) ? item.mode : "hidden";
    return {
      mode,
      text: typeof item.text === "string" ? item.text : "",
      updatedAt: item.updatedAt || ""
    };
  }

  function normalizeTicketConfig(config) {
    if (!config || typeof config !== "object") return null;
    const templateId = getTemplate(config.templateId)?.id || DEFAULT_TEMPLATE_ID;
    const modules = Array.isArray(config.modules)
      ? config.modules.filter((module) => MODULE_IDS.includes(module?.id)).map((module) => normalizeModuleConfig(module, templateId))
      : [];
    return {
      templateId,
      modules,
      updatedAt: config.updatedAt || ""
    };
  }

  function normalizeTicketDefault(config) {
    if (!config || typeof config !== "object") return null;
    return normalizeTicketConfig(config);
  }

  function normalizeModuleConfig(rawModule, templateId) {
    const def = getModuleDef(rawModule.id);
    const style = getTemplateStyle(templateId, def.id);
    return {
      id: def.id,
      label: def.label,
      visible: typeof rawModule.visible === "boolean" ? rawModule.visible : def.defaultVisible,
      text: typeof rawModule.text === "string" ? rawModule.text : "",
      fontSize: clampNumber(rawModule.fontSize, 12, 48, style.fontSize),
      weight: ["400", "700", "900"].includes(String(rawModule.weight)) ? String(rawModule.weight) : style.weight,
      align: ["left", "center", "right"].includes(rawModule.align) ? rawModule.align : style.align,
      color: isHexColor(rawModule.color) ? rawModule.color : style.color,
      customText: Boolean(rawModule.customText),
      sourceText: typeof rawModule.sourceText === "string" ? rawModule.sourceText : "",
      manualVisibility: Boolean(rawModule.manualVisibility)
    };
  }

  function normalizeTicketSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    return {
      ...snapshot,
      id: snapshot.id || uid("snap"),
      generatedAt: snapshot.generatedAt || new Date().toISOString(),
      modules: Array.isArray(snapshot.modules) ? snapshot.modules : [],
      sourceMeta: snapshot.sourceMeta || null
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const saveStatus = $("#saveStatus");
    if (!saveStatus) return;
    saveStatus.textContent = "已保存";
    window.setTimeout(() => {
      saveStatus.textContent = "本机浏览器";
    }, 900);
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function bindNavigation() {
    $$(".nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        switchView(button.dataset.view);
        if (button.dataset.view === "ticket") renderTicketEditor();
        if (button.dataset.view === "print") renderPrintView();
      });
    });
    $("#newRequirementBtn").addEventListener("click", () => {
      resetForm();
      switchView("form");
    });
    $("#cancelEditBtn").addEventListener("click", () => switchView("dashboard"));
    $("#backToDashboardBtn").addEventListener("click", () => switchView("dashboard"));
  }

  function switchView(view) {
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    $$("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  }

  function bindForm() {
    $("#requirementForm").addEventListener("submit", handleRequirementSubmit);
    $("#resetFormBtn").addEventListener("click", resetForm);
    $("#estimateMode").addEventListener("change", renderEstimateFields);
    $("#waitModeInput").addEventListener("change", renderWaitFields);
    $("#waitTextInput").addEventListener("input", renderWaitFields);
    $("#generateWaitSuggestionBtn").addEventListener("click", () => {
      $("#waitModeInput").value = "suggested";
      $("#waitTextInput").value = buildWaitSuggestionForForm();
      renderWaitFields();
    });
  }

  function bindFilters() {
    $("#searchInput").addEventListener("input", (event) => {
      filters.search = event.target.value.trim();
      renderDashboard();
    });
    $("#filterDepartment").addEventListener("change", (event) => {
      filters.departments = Array.from(event.target.selectedOptions).map((option) => option.value);
      renderDashboard();
    });
    $("#filterType").addEventListener("change", (event) => {
      filters.type = event.target.value;
      renderDashboard();
    });
    $("#filterPriority").addEventListener("change", (event) => {
      filters.priority = event.target.value;
      renderDashboard();
    });
    $("#filterStatus").addEventListener("change", (event) => {
      filters.status = event.target.value;
      renderDashboard();
    });
    $("#clearFiltersBtn").addEventListener("click", () => {
      filters = { search: "", departments: [], type: "", priority: "", status: "" };
      $("#searchInput").value = "";
      $("#filterType").value = "";
      $("#filterPriority").value = "";
      $("#filterStatus").value = "";
      Array.from($("#filterDepartment").options).forEach((option) => {
        option.selected = false;
      });
      renderDashboard();
    });
  }

  function bindSettings() {
    $("#departmentForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("#departmentName").value.trim();
      if (!name) return;
      state.departments.push({ id: uid("dep"), name, color: $("#departmentColor").value, active: true });
      $("#departmentName").value = "";
      $("#departmentColor").value = "#6f685f";
      persistAndRender();
    });

    $("#typeForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const prefix = $("#typePrefix").value.trim().toUpperCase();
      const name = $("#typeName").value.trim();
      if (!prefix || !name) return alert("请填写前缀和名称。");
      if (state.types.some((type) => type.active && type.prefix.toUpperCase() === prefix)) {
        return alert("这个前缀已经被启用的初判占用了。");
      }
      state.types.push({ id: uid("type"), prefix, name, color: $("#typeColor").value, active: true, cycle: 1, next: 1 });
      $("#typePrefix").value = "";
      $("#typeName").value = "";
      $("#typeColor").value = "#6f685f";
      persistAndRender();
    });

    $("#resetDemoBtn").disabled = false;
    $("#resetDemoBtn").textContent = "清空全部数据";
    $("#resetDemoBtn").title = "需要两次确认；建议先导出备份。";
  }

  function bindTicketEditor() {
    $("#ticketTemplateSelect").addEventListener("change", (event) => applyTicketTemplate(event.target.value));
    $("#ticketModuleSelect").addEventListener("change", (event) => {
      selectedTicketModuleId = event.target.value;
      renderTicketEditor();
    });
    $("#ticketModuleText").addEventListener("input", (event) => updateSelectedModule({ text: event.target.value }, true));
    $("#ticketFontSize").addEventListener("input", (event) => updateSelectedModule({ fontSize: Number(event.target.value) }));
    $("#ticketFontWeight").addEventListener("change", (event) => updateSelectedModule({ weight: event.target.value }));
    $("#ticketTextAlign").addEventListener("change", (event) => updateSelectedModule({ align: event.target.value }));
    $("#ticketAccentColor").addEventListener("input", (event) => updateSelectedModule({ color: event.target.value }));
    $("#resetModuleBtn").addEventListener("click", resetSelectedModuleContent);
    $("#saveDefaultTicketBtn").addEventListener("click", saveCurrentTicketAsDefault);
    $("#confirmTicketBtn").addEventListener("click", confirmTicketSnapshot);
  }

  function bindPrint() {
    $("#printRequirementSelect").addEventListener("change", (event) => {
      state.printPreferences.requirementId = event.target.value;
      state.printPreferences.snapshotId = "";
      saveState();
      renderPrintView();
    });
    $("#printSnapshotSelect").addEventListener("change", (event) => {
      state.printPreferences.snapshotId = event.target.value;
      saveState();
      renderPrintView();
    });
    $$("input[name='printMode']").forEach((input) => {
      input.addEventListener("change", (event) => {
        state.printPreferences.mode = event.target.value;
        saveState();
        renderPrintView();
      });
    });
    $$("input[name='a4ContentMode']").forEach((input) => {
      input.addEventListener("change", (event) => {
        state.printPreferences.a4ContentMode = event.target.value === "mixed" ? "mixed" : "same";
        saveState();
        renderPrintView();
      });
    });
    $("#printSizePreset").addEventListener("change", (event) => {
      state.printPreferences.sizePreset = event.target.value;
      saveState();
      renderPrintView();
    });
    $("#customPrintWidth").addEventListener("input", (event) => updatePrintPreference("customWidth", event.target.value));
    $("#customPrintHeight").addEventListener("input", (event) => updatePrintPreference("customHeight", event.target.value));
    $("#a4CopiesSelect").addEventListener("change", (event) => updatePrintPreference("a4Copies", Number(event.target.value)));
    $("#a4MarginInput").addEventListener("input", (event) => updatePrintPreference("a4Margin", event.target.value));
    $("#a4GapInput").addEventListener("input", (event) => updatePrintPreference("a4Gap", event.target.value));
    $("#cutLinesInput").addEventListener("change", (event) => updatePrintPreference("cutLines", event.target.checked));
    $("#addMixedItemBtn").addEventListener("click", addMixedPrintItem);
    $("#openPrintBtn").addEventListener("click", openBrowserPrint);
    window.addEventListener("afterprint", () => document.body.classList.remove("printing"));
  }

  function bindBackupRestore() {
    $("#exportBackupBtn").addEventListener("click", exportBackup);
    $("#importBackupInput").addEventListener("change", handleBackupFileSelected);
    $("#confirmRestoreBtn").addEventListener("click", confirmRestoreBackup);
    $("#resetDemoBtn").addEventListener("click", clearAllDataWithDoubleConfirm);
  }

  function updatePrintPreference(key, value) {
    state.printPreferences[key] = value;
    saveState();
    renderPrintView();
  }

  function handleRequirementSubmit(event) {
    event.preventDefault();
    const error = $("#formError");
    error.textContent = "";

    const editingId = $("#editingId").value;
    const existing = editingId ? findRequirement(editingId) : null;
    const selectedDepartments = $$("input[name='departmentChoice']:checked").map((input) => input.value);
    const typeId = $("#typeInput").value;
    const priorityId = $("#priorityInput").value;
    const title = $("#titleInput").value.trim();
    const status = $("#statusInput").value;
    const estimate = collectEstimate();
    const schedule = collectSchedule();
    const waiting = collectWaitingReference();

    if (!title) return showFormError("需求名称不能为空。");
    if (selectedDepartments.length === 0) return showFormError("至少选择一个涉及部门。");
    if (!typeId) return showFormError("请至少保留一个可用需求初判。");
    if (!priorityId) return showFormError("请选择优先级。");
    if (!estimate.ok) return showFormError(estimate.message);
    if (!schedule.ok) return showFormError(schedule.message);
    if (!waiting.ok) return showFormError(waiting.message);

    if (existing) {
      const oldTypeId = existing.typeId;
      const wasInactiveBefore = !ACTIVE_STATUSES.has(existing.status);
      const nextData = {
        title,
        departmentIds: selectedDepartments,
        typeId,
        priorityId,
        status,
        estimate: estimate.value,
        schedule: schedule.value,
        waitingReference: waiting.value,
        note: $("#noteInput").value.trim(),
        updatedAt: new Date().toISOString()
      };
      Object.assign(existing, nextData);
      if (oldTypeId !== typeId) {
        const shouldRenumber = confirm("需求初判变了，要按新类型重新编号吗？选择“取消”会保留原编号。");
        if (shouldRenumber) {
          existing.numberHistory = existing.numberHistory || [];
          existing.numberHistory.push(existing.ticketNo);
          assignNumber(existing, typeId);
        }
      }
      if (wasInactiveBefore && ACTIVE_STATUSES.has(status)) moveToEnd(existing.id);
      if (existing.ticketConfig) refreshDynamicModuleTexts(existing, ensureTicketConfig(existing));
    } else {
      const requirement = {
        id: uid("req"),
        title,
        departmentIds: selectedDepartments,
        typeId,
        priorityId,
        status,
        estimate: estimate.value,
        schedule: schedule.value,
        waitingReference: waiting.value,
        note: $("#noteInput").value.trim(),
        numberHistory: [],
        ticketConfig: null,
        ticketSnapshots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      assignNumber(requirement, typeId);
      insertRequirement(requirement, $("#insertBeforeId").value);
    }

    resetForm();
    persistAndRender();
    switchView("dashboard");
  }

  function insertRequirement(requirement, beforeId) {
    if (!beforeId) {
      state.requirements.push(requirement);
      return;
    }
    const index = state.requirements.findIndex((item) => item.id === beforeId);
    if (index === -1) {
      state.requirements.push(requirement);
      return;
    }
    state.requirements.splice(index, 0, requirement);
  }

  function assignNumber(requirement, typeId) {
    const type = state.types.find((item) => item.id === typeId);
    if (!type) return;
    let next = Number(type.next || 1);
    while (activeTicketExists(type.prefix, next, type.cycle, requirement.id)) {
      next += 1;
    }
    requirement.ticketNo = `${type.prefix}${String(next).padStart(2, "0")}`;
    requirement.ticketNumber = next;
    requirement.ticketPrefix = type.prefix;
    requirement.ticketCycle = type.cycle || 1;
    type.next = next + 1;
  }

  function activeTicketExists(prefix, number, cycle, exceptId) {
    const ticketNo = `${prefix}${String(number).padStart(2, "0")}`;
    return state.requirements.some((item) => {
      if (item.id === exceptId || !ACTIVE_STATUSES.has(item.status)) return false;
      return item.ticketNo === ticketNo;
    });
  }

  function collectEstimate() {
    const mode = $("#estimateMode").value;
    if (mode === "none") return { ok: true, value: null };
    if (mode === "single") {
      const value = Number($("#estimateSingle").value);
      if (!validWorkday(value)) return { ok: false, message: "工作日单值必须是 0.5～999 之间、按 0.5 递增的数字。" };
      return { ok: true, value: { mode, value } };
    }
    const min = Number($("#estimateMin").value);
    const max = Number($("#estimateMax").value);
    if (!validWorkday(min) || !validWorkday(max)) return { ok: false, message: "工作日区间必须是 0.5～999 之间、按 0.5 递增的数字。" };
    if (min > max) return { ok: false, message: "工作日起始值不能大于结束值。" };
    return { ok: true, value: { mode, min, max } };
  }

  function validWorkday(value) {
    return Number.isFinite(value) && value >= 0.5 && value <= 999 && Math.round(value * 2) === value * 2;
  }

  function collectSchedule() {
    const startDate = $("#startDateInput").value;
    const endDate = $("#endDateInput").value;
    const note = $("#scheduleNoteInput").value.trim();
    if (startDate && endDate && endDate < startDate) {
      return { ok: false, message: "预计完成日期不能早于预计开始日期。" };
    }
    return { ok: true, value: { startDate, endDate, note } };
  }

  function collectWaitingReference() {
    const mode = $("#waitModeInput").value;
    const text = $("#waitTextInput").value.trim();
    if (mode === "hidden") return { ok: true, value: { mode, text: "", updatedAt: new Date().toISOString() } };
    if (mode === "manual" && !text) return { ok: false, message: "选择自己填写时，等待参考文案不能为空。" };
    if (mode === "suggested" && !text) return { ok: false, message: "选择系统建议时，请先生成或填写一段可采用的等待参考。" };
    return { ok: true, value: { mode, text, updatedAt: new Date().toISOString() } };
  }

  function showFormError(message) {
    $("#formError").textContent = message;
  }

  function resetForm() {
    $("#requirementForm").reset();
    $("#editingId").value = "";
    $("#insertBeforeId").value = "";
    $("#formMode").textContent = "新增需求";
    $("#formError").textContent = "";
    $("#startDateInput").value = "";
    $("#endDateInput").value = "";
    $("#scheduleNoteInput").value = "";
    setWaitingReference({ mode: "hidden", text: "" });
    renderFormTypeOptions();
    applyNewFormDefaults();
    renderEstimateFields();
    renderWaitFields();
    renderFormChoices();
  }

  function editRequirement(id) {
    const item = findRequirement(id);
    if (!item) return;
    $("#editingId").value = item.id;
    $("#insertBeforeId").value = "";
    $("#formMode").textContent = `编辑 ${item.ticketNo}`;
    $("#titleInput").value = item.title;
    renderFormTypeOptions(item.typeId);
    $("#typeInput").value = item.typeId;
    $("#priorityInput").value = item.priorityId;
    $("#statusInput").value = item.status;
    $("#noteInput").value = item.note || "";
    $("#startDateInput").value = item.schedule?.startDate || "";
    $("#endDateInput").value = item.schedule?.endDate || "";
    $("#scheduleNoteInput").value = item.schedule?.note || "";
    setEstimate(item.estimate);
    setWaitingReference(item.waitingReference);
    renderFormChoices(item.departmentIds);
    switchView("form");
  }

  function prepareInsertBefore(id) {
    resetForm();
    $("#insertBeforeId").value = id;
    $("#formMode").textContent = "在此需求前插入";
    switchView("form");
  }

  function setEstimate(estimate) {
    $("#estimateSingle").value = "";
    $("#estimateMin").value = "";
    $("#estimateMax").value = "";
    if (!estimate) {
      $("#estimateMode").value = "none";
    } else if (estimate.mode === "single") {
      $("#estimateMode").value = "single";
      $("#estimateSingle").value = estimate.value;
    } else if (estimate.mode === "range") {
      $("#estimateMode").value = "range";
      $("#estimateMin").value = estimate.min;
      $("#estimateMax").value = estimate.max;
    }
    renderEstimateFields();
  }

  function setWaitingReference(waitingReference) {
    const waiting = normalizeWaitingReference(waitingReference);
    $("#waitModeInput").value = waiting.mode;
    $("#waitTextInput").value = waiting.text;
    renderWaitFields();
  }

  function renderEstimateFields() {
    const mode = $("#estimateMode").value;
    $$(".estimate-field").forEach((field) => {
      field.classList.toggle("active", field.dataset.estimate === mode);
    });
  }

  function renderWaitFields() {
    const mode = $("#waitModeInput").value;
    const textLength = Array.from($("#waitTextInput").value).length;
    $(".wait-fieldset").dataset.mode = mode;
    $("#waitTextInput").disabled = mode === "hidden";
    $("#waitTextInput").maxLength = WAIT_TEXT_LIMIT;
    $("#generateWaitSuggestionBtn").hidden = mode !== "suggested";
    $("#waitCharCounter").textContent = `还可输入 ${Math.max(0, WAIT_TEXT_LIMIT - textLength)} 字`;
    if (mode === "hidden") {
      $("#waitHelper").textContent = "当前不在取号单展示等待参考，也不保留空白占位。";
    } else if (mode === "manual") {
      $("#waitHelper").textContent = "自己填写的内容保存后不会被系统自动覆盖。";
    } else {
      $("#waitHelper").textContent = "系统建议只使用前方数量、状态、估时、完成日期和未完成排期数量；生成后可继续编辑。";
    }
  }

  function buildWaitSuggestionForForm() {
    return buildWaitSuggestion(getAheadRequirementsForForm());
  }

  function getAheadRequirementsForForm() {
    const editingId = $("#editingId").value;
    const beforeId = $("#insertBeforeId").value;
    const ahead = [];
    for (const item of state.requirements) {
      if (item.id === editingId || item.id === beforeId) return ahead;
      if (ACTIVE_STATUSES.has(item.status)) ahead.push(item);
    }
    return ahead;
  }

  function buildWaitSuggestion(aheadRequirements) {
    const count = aheadRequirements.length;
    if (count === 0) return "当前前方暂无其他需求，具体开始时间以实际安排为准。";
    if (aheadRequirements.every((item) => item.schedule?.endDate)) {
      const latestDate = aheadRequirements.map((item) => item.schedule.endDate).sort().at(-1);
      return `前方还有 ${count} 个需求，按当前排期预计可于 ${latestDate} 后开始处理，仅供参考。`;
    }
    const estimated = aheadRequirements.filter((item) => item.estimate);
    if (estimated.length > 0) {
      const total = estimated.reduce((sum, item) => {
        if (item.estimate.mode === "single") {
          sum.min += Number(item.estimate.value);
          sum.max += Number(item.estimate.value);
        } else if (item.estimate.mode === "range") {
          sum.min += Number(item.estimate.min);
          sum.max += Number(item.estimate.max);
        }
        return sum;
      }, { min: 0, max: 0 });
      const unknown = aheadRequirements.length - estimated.length;
      const workdays = total.min === total.max ? `${formatNumber(total.min)}` : `${formatNumber(total.min)}～${formatNumber(total.max)}`;
      const unknownText = unknown > 0 ? `，另有 ${unknown} 个待评估` : "";
      return `前方还有 ${count} 个需求，当前已评估的工作量合计约 ${workdays} 个工作日${unknownText}，仅供参考。`;
    }
    return `前方还有 ${count} 个需求，其中 ${count} 个尚未完成排期，暂时无法准确估算等待时间。`;
  }

  function findRequirement(id) {
    return state.requirements.find((item) => item.id === id);
  }

  function persistAndRender() {
    pruneInvalidFilters();
    saveState();
    renderAll();
  }

  function pruneInvalidFilters() {
    const activeDepartmentIds = new Set(state.departments.filter((item) => item.active).map((item) => item.id));
    const activeTypeIds = new Set(state.types.filter((item) => item.active).map((item) => item.id));
    filters.departments = filters.departments.filter((id) => activeDepartmentIds.has(id));
    if (filters.type && !activeTypeIds.has(filters.type)) filters.type = "";
  }

  function renderAll() {
    renderControls();
    renderDashboard();
    renderSettings();
    if (!$("#editingId").value) {
      renderFormChoices();
      renderFormTypeOptions();
      if (!$("#titleInput").value.trim()) applyNewFormDefaults();
    }
    renderEstimateFields();
    renderWaitFields();
    renderTicketEditor();
    renderPrintView();
  }

  function applyNewFormDefaults() {
    const defaultType = state.types.find((type) => type.active && type.name === "待评估") || state.types.find((type) => type.active);
    if (defaultType) $("#typeInput").value = defaultType.id;
    $("#priorityInput").value = "p3";
  }

  function renderControls() {
    renderSelect($("#filterDepartment"), state.departments.filter((item) => item.active), "name", true);
    renderSelect($("#filterType"), state.types.filter((item) => item.active), "name");
    renderSelect($("#filterPriority"), state.priorities, "label");
    renderSelect($("#priorityInput"), state.priorities, "label");
    applyFilterControlValues();
  }

  function applyFilterControlValues() {
    Array.from($("#filterDepartment").options).forEach((option) => {
      option.selected = filters.departments.includes(option.value);
    });
    $("#filterType").value = filters.type;
    $("#filterPriority").value = filters.priority;
    $("#filterStatus").value = filters.status;
  }

  function renderSelect(select, items, labelKey, keepFirstOption) {
    const first = keepFirstOption ? "" : select.querySelector("option[value='']")?.outerHTML || "";
    const selected = Array.from(select.selectedOptions).map((option) => option.value);
    const options = items.map((item) => {
      const label = labelKey === "label" ? priorityLabel(item) : item[labelKey];
      return `<option value="${escapeAttr(item.id)}">${escapeHtml(label)}</option>`;
    });
    if (select.multiple) {
      select.innerHTML = options.join("");
    } else {
      select.innerHTML = first + options.join("");
    }
    selected.forEach((value) => {
      const option = Array.from(select.options).find((item) => item.value === value);
      if (option) option.selected = true;
    });
  }

  function renderFormChoices(selected = []) {
    const visibleDepartments = includeHistoricalSelections(state.departments, selected);
    $("#departmentChoices").innerHTML = visibleDepartments.map((department) => `
      <label class="${department.active ? "" : "inactive-choice"}">
        <input type="checkbox" name="departmentChoice" value="${escapeAttr(department.id)}" ${selected.includes(department.id) ? "checked" : ""}>
        ${escapeHtml(departmentLabel(department))}
      </label>
    `).join("");
  }

  function renderFormTypeOptions(selectedTypeId = "") {
    const visibleTypes = includeHistoricalSelections(state.types, selectedTypeId ? [selectedTypeId] : []);
    $("#typeInput").innerHTML = visibleTypes.map((type) => `
      <option value="${escapeAttr(type.id)}">${escapeHtml(typeLabel(type))}</option>
    `).join("");
  }

  function includeHistoricalSelections(items, selectedIds) {
    const selectedSet = new Set(selectedIds);
    return items.filter((item) => item.active || selectedSet.has(item.id));
  }

  function renderDashboard() {
    const active = state.requirements.filter((item) => ACTIVE_STATUSES.has(item.status));
    const paused = state.requirements.filter((item) => item.status === "暂不做");
    const done = state.requirements.filter((item) => item.status === "已完成");
    $("#statActive").textContent = active.length;
    $("#statDoing").textContent = active.filter((item) => item.status === "处理中").length;
    $("#statEvaluating").textContent = active.filter((item) => item.status === "评估中").length;
    $("#statPaused").textContent = paused.length;
    $("#statDone").textContent = done.length;
    renderRequirementList($("#activeList"), active.filter(matchesFilters), true);
    renderRequirementList($("#pausedList"), paused.filter(matchesFilters), false);
    renderRequirementList($("#doneList"), done.filter(matchesFilters), false);
  }

  function matchesFilters(item) {
    const search = filters.search.toLowerCase();
    if (search && !`${item.title} ${item.ticketNo}`.toLowerCase().includes(search)) return false;
    if (filters.departments.length && !item.departmentIds.some((id) => filters.departments.includes(id))) return false;
    if (filters.type && item.typeId !== filters.type) return false;
    if (filters.priority && item.priorityId !== filters.priority) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  }

  function renderRequirementList(container, items, activeList) {
    container.innerHTML = "";
    const template = $("#queueItemTemplate");
    items.forEach((item) => {
      const clone = template.content.firstElementChild.cloneNode(true);
      clone.dataset.id = item.id;
      clone.querySelector(".ticket-no").textContent = item.ticketNo || "--";
      clone.querySelector("h4").textContent = item.title;
      clone.querySelector(".meta").innerHTML = buildMeta(item);
      clone.querySelector(".note").textContent = item.note || "";
      clone.querySelector(".ahead").textContent = ACTIVE_STATUSES.has(item.status) ? `前方 ${aheadCount(item.id)} 个` : "不计入队列";
      clone.querySelector(".actions").append(...buildActions(item, activeList));
      container.appendChild(clone);
    });
  }

  function buildMeta(item) {
    const type = state.types.find((entry) => entry.id === item.typeId);
    const priority = state.priorities.find((entry) => entry.id === item.priorityId);
    const departmentChips = item.departmentIds.map((id) => {
      const department = state.departments.find((entry) => entry.id === id);
      if (!department) return chip("已停用部门", "inactive");
      return chip(departmentLabel(department), department.active ? "" : "inactive", department.color);
    }).join("");
    const estimate = estimateLabel(item.estimate);
    const schedule = scheduleLabel(item.schedule);
    const waiting = waitingLabel(item.waitingReference);
    const changed = hasTicketChanged(item) ? chip("取号单信息已变化", "change-chip") : "";
    return [
      departmentChips || chip("未选部门", "inactive"),
      chip(type ? typeLabel(type) : "初判已停用", type && !type.active ? "inactive" : "", type?.color),
      chip(priority ? priorityLabel(priority) : "优先级缺失", priority ? `priority-${priority.id}` : "", priority?.color),
      chip(item.status),
      estimate ? chip(estimate) : "",
      schedule ? chip(schedule) : "",
      waiting ? chip(waiting) : "",
      changed
    ].join("");
  }

  function chip(text, extraClass = "", color = "") {
    const style = color ? ` style="--chip-color:${escapeAttr(color)}"` : "";
    return `<span class="chip ${extraClass}"${style}>${escapeHtml(text)}</span>`;
  }

  function estimateLabel(estimate) {
    if (!estimate) return "";
    if (estimate.mode === "single") return `${estimate.value} 个工作日`;
    if (estimate.mode === "range") return `${estimate.min}～${estimate.max} 个工作日`;
    return "";
  }

  function scheduleLabel(schedule) {
    if (!schedule) return "";
    if (schedule.startDate && schedule.endDate) return `排期 ${schedule.startDate} → ${schedule.endDate}`;
    if (schedule.startDate) return `预计 ${schedule.startDate} 开始`;
    if (schedule.endDate) return `预计 ${schedule.endDate} 完成`;
    if (schedule.note) return `排期备注：${schedule.note}`;
    return "";
  }

  function waitingLabel(waitingReference) {
    const text = waitingDisplayText(waitingReference);
    if (!text) return "";
    return `等待参考：${text}`;
  }

  function waitingDisplayText(waitingReference) {
    if (!waitingReference || waitingReference.mode === "hidden") return "";
    return waitingReference.text || "";
  }

  function buildActions(item, activeList) {
    const actions = [];
    actions.push(actionButton("生成/查看取号单", () => openTicketEditor(item.id)));
    if (activeList) {
      actions.push(actionButton("上移", () => moveRequirement(item.id, -1)));
      actions.push(actionButton("下移", () => moveRequirement(item.id, 1)));
      actions.push(actionButton("在此需求前插入", () => prepareInsertBefore(item.id)));
      actions.push(actionButton("评估中", () => setStatus(item.id, "评估中")));
      actions.push(actionButton("处理中", () => setStatus(item.id, "处理中")));
      actions.push(actionButton("完成", () => setStatus(item.id, "已完成"), "danger"));
      actions.push(actionButton("暂不做", () => setStatus(item.id, "暂不做"), "danger"));
    } else if (item.status === "暂不做") {
      actions.push(actionButton("恢复到队尾", () => restoreRequirement(item.id)));
    }
    actions.push(actionButton("编辑", () => editRequirement(item.id)));
    return actions;
  }

  function actionButton(label, handler, variant = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `small-btn ${variant}`;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function moveRequirement(id, direction) {
    const activeItems = state.requirements.filter((item) => ACTIVE_STATUSES.has(item.status));
    const activeIndex = activeItems.findIndex((item) => item.id === id);
    const targetActive = activeItems[activeIndex + direction];
    if (!targetActive) return;
    const index = state.requirements.findIndex((item) => item.id === id);
    const targetIndex = state.requirements.findIndex((item) => item.id === targetActive.id);
    const [item] = state.requirements.splice(index, 1);
    state.requirements.splice(targetIndex, 0, item);
    persistAndRender();
  }

  function moveToEnd(id) {
    const index = state.requirements.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [item] = state.requirements.splice(index, 1);
    state.requirements.push(item);
  }

  function setStatus(id, status) {
    const item = findRequirement(id);
    if (!item) return;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    item.wasInactive = !ACTIVE_STATUSES.has(status);
    persistAndRender();
  }

  function restoreRequirement(id) {
    const item = findRequirement(id);
    if (!item) return;
    item.status = "排队中";
    item.wasInactive = false;
    moveToEnd(id);
    persistAndRender();
  }

  function aheadCount(id) {
    let count = 0;
    for (const item of state.requirements) {
      if (item.id === id) return count;
      if (ACTIVE_STATUSES.has(item.status)) count += 1;
    }
    return 0;
  }

  function renderSettings() {
    replaceChildren($("#departmentList"), state.departments.map((item) => configRow(
      item.name,
      item.active ? "启用中" : "已停用",
      [
        actionButton("上移", () => moveConfig(state.departments, item.id, -1)),
        actionButton("下移", () => moveConfig(state.departments, item.id, 1)),
        actionButton(item.active ? "停用" : "启用", () => toggleDepartment(item.id)),
        actionButton("改名", () => renameDepartment(item.id)),
        actionButton("改色", () => recolorDepartment(item.id))
      ],
      item.color
    )));

    replaceChildren($("#typeList"), state.types.map((item) => configRow(
      `${item.prefix} ${item.name}`,
      `第 ${item.cycle || 1} 轮，下个号 ${String(item.next || 1).padStart(2, "0")}；${item.active ? "启用中" : "已停用"}`,
      [
        actionButton("上移", () => moveConfig(state.types, item.id, -1)),
        actionButton("下移", () => moveConfig(state.types, item.id, 1)),
        actionButton(item.active ? "停用" : "启用", () => toggleType(item.id)),
        actionButton("改名", () => renameType(item.id)),
        actionButton("改色", () => recolorType(item.id))
      ],
      item.color
    )));

    replaceChildren($("#priorityList"), state.priorities.map((item) => configRow(
      priorityLabel(item),
      "固定档位，不参与自动排序",
      [
        actionButton("改名", () => renamePriority(item.id)),
        actionButton("改色", () => recolorPriority(item.id))
      ],
      item.color
    )));

    replaceChildren($("#cycleList"), state.types.map((item) => configRow(
      `${item.prefix} ${item.name}`,
      `当前第 ${item.cycle || 1} 轮`,
      [
        actionButton("开启新一轮", () => startNewCycle(item.id))
      ]
    )));
  }

  function replaceChildren(container, children) {
    container.innerHTML = "";
    children.forEach((child) => container.appendChild(child));
  }

  function configRow(title, sub, actions, color = "") {
    const row = document.createElement("div");
    row.className = "config-row";
    const text = document.createElement("div");
    const titleWrap = document.createElement("div");
    const dot = document.createElement("span");
    const strong = document.createElement("strong");
    const small = document.createElement("small");
    const actionWrap = document.createElement("div");
    actionWrap.className = "actions";
    titleWrap.className = "config-title";
    dot.className = "color-dot";
    if (color) dot.style.setProperty("--dot-color", color);
    strong.textContent = title;
    small.textContent = sub;
    titleWrap.append(dot, strong);
    text.append(titleWrap, small);
    actionWrap.append(...actions);
    row.append(text, actionWrap);
    return row;
  }

  function renderPrintView() {
    const prefs = state.printPreferences || (state.printPreferences = defaultPrintPreferences());
    const printable = printableRequirements();
    const empty = $("#printEmptyState");
    const workbench = $("#printWorkbench");
    if (printable.length === 0) {
      empty.hidden = false;
      workbench.hidden = true;
      $("#openPrintBtn").disabled = true;
      $("#printRoot").replaceChildren();
      return;
    }
    empty.hidden = true;
    workbench.hidden = false;

    if (!printable.some((item) => item.id === prefs.requirementId)) prefs.requirementId = printable[0].id;
    renderPrintRequirementOptions(printable, prefs.requirementId);

    const requirement = findRequirement(prefs.requirementId) || printable[0];
    const snapshots = sortedSnapshots(requirement);
    if (!snapshots.some((snapshot) => snapshot.id === prefs.snapshotId)) prefs.snapshotId = snapshots[0]?.id || "";
    renderPrintSnapshotOptions(snapshots, prefs.snapshotId);

    $$("input[name='printMode']").forEach((input) => {
      input.checked = input.value === prefs.mode;
    });
    $("#printSizePreset").value = prefs.sizePreset;
    $("#customSizeFields").hidden = prefs.sizePreset !== "custom";
    $("#customPrintWidth").value = prefs.customWidth ?? "";
    $("#customPrintHeight").value = prefs.customHeight ?? "";
    $("#a4Controls").hidden = prefs.mode !== "a4";
    $("#singlePrintTargetControls").hidden = prefs.mode === "a4" && prefs.a4ContentMode === "mixed";
    const mixedMode = prefs.mode === "a4" && prefs.a4ContentMode === "mixed";
    $("#printSizeLabel").textContent = mixedMode ? "混排默认尺寸" : "单张尺寸";
    $("#printSizeHint").textContent = mixedMode
      ? "打印篮子中选择“跟随默认”的项目使用此尺寸。"
      : "单张和同款多份使用此尺寸。";
    $$("input[name='a4ContentMode']").forEach((input) => {
      input.checked = input.value === (prefs.a4ContentMode || "same");
    });
    $("#sameCopiesControl").hidden = prefs.mode !== "a4" || prefs.a4ContentMode === "mixed";
    $("#mixedBasketControls").hidden = prefs.mode !== "a4" || prefs.a4ContentMode !== "mixed";
    $("#a4MarginInput").value = prefs.a4Margin ?? "";
    $("#a4GapInput").value = prefs.a4Gap ?? "";
    $("#cutLinesInput").checked = prefs.cutLines;

    const ticketSize = currentTicketSize();
    updateA4CopyOptions(ticketSize);
    renderMixedPrintItems(printable);
    const selectedSnapshot = snapshots.find((snapshot) => snapshot.id === prefs.snapshotId);
    const result = buildPrintRenderResult(selectedSnapshot, ticketSize);
    $("#printSnapshotInfo").textContent = selectedSnapshot
      ? `编号 ${selectedSnapshot.ticketNo || "--"}；生成于 ${formatDateTime(selectedSnapshot.generatedAt)}；来自已确认快照。`
      : "请选择已确认快照。";
    if (!result.sheet) $("#printPreviewStage").replaceChildren();
    $("#printLayoutInfo").textContent = result.info;
    $("#printError").textContent = result.errors.join("；");
    $("#openPrintBtn").disabled = result.errors.length > 0 || !result.sheet;
  }

  function printableRequirements() {
    return state.requirements.filter((item) => Array.isArray(item.ticketSnapshots) && item.ticketSnapshots.length > 0);
  }

  function sortedSnapshots(requirement) {
    return [...(requirement?.ticketSnapshots || [])].sort((a, b) => String(b.generatedAt).localeCompare(String(a.generatedAt)));
  }

  function renderPrintRequirementOptions(items, selectedId) {
    $("#printRequirementSelect").innerHTML = items.map((item) => `
      <option value="${escapeAttr(item.id)}" ${item.id === selectedId ? "selected" : ""}>
        ${escapeHtml(`${item.ticketNo || "--"} ${item.title}（${item.ticketSnapshots.length} 条快照）`)}
      </option>
    `).join("");
  }

  function renderPrintSnapshotOptions(snapshots, selectedId) {
    $("#printSnapshotSelect").innerHTML = snapshots.map((snapshot) => `
      <option value="${escapeAttr(snapshot.id)}" ${snapshot.id === selectedId ? "selected" : ""}>
        ${escapeHtml(`${snapshot.ticketNo || "--"} · ${formatDateTime(snapshot.generatedAt)}`)}
      </option>
    `).join("");
  }

  function renderMixedPrintItems(printable) {
    const prefs = state.printPreferences;
    const list = $("#mixedItemsList");
    const items = Array.isArray(prefs.mixedItems) ? prefs.mixedItems : (prefs.mixedItems = []);
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<p class="field-tip">打印篮子为空，请添加已有快照的需求。</p>`;
      $("#mixedBasketSummary").textContent = "已选 0 张；多需求拼版仅用于 A4，同一张 A4 最多 6 张票。";
      return;
    }
    list.innerHTML = items.map((item, index) => mixedPrintItemHtml(item, index, printable)).join("");
    list.querySelectorAll("[data-mixed-field]").forEach((field) => {
      field.addEventListener("change", handleMixedPrintFieldChange);
    });
    list.querySelectorAll("[data-mixed-action]").forEach((button) => {
      button.addEventListener("click", handleMixedPrintAction);
    });
    const total = mixedPrintItemsTotal(items);
    $("#mixedBasketSummary").textContent = `已选 ${total} 张；展开后总票数需为 1～6 张。`;
  }

  function mixedPrintItemHtml(item, index, printable) {
    const requirement = findRequirement(item.requirementId);
    const snapshots = sortedSnapshots(requirement);
    const selectedSnapshot = snapshots.find((snapshot) => snapshot.id === item.snapshotId);
    const title = requirement
      ? `${requirement.ticketNo || "--"} ${requirement.title}`
      : "引用的需求不存在";
    const requirementOptions = [
      `<option value="">请选择需求</option>`,
      ...printable.map((requirementItem) => `
        <option value="${escapeAttr(requirementItem.id)}" ${requirementItem.id === item.requirementId ? "selected" : ""}>
          ${escapeHtml(`${requirementItem.ticketNo || "--"} ${requirementItem.title}`)}
        </option>
      `)
    ].join("");
    const snapshotOptions = [
      `<option value="">请选择快照</option>`,
      ...snapshots.map((snapshot) => `
        <option value="${escapeAttr(snapshot.id)}" ${snapshot.id === item.snapshotId ? "selected" : ""}>
          ${escapeHtml(`${snapshot.ticketNo || "--"} · ${formatDateTime(snapshot.generatedAt)}`)}
        </option>
      `)
    ].join("");
    const copyOptions = MIXED_COPY_OPTIONS.map((copies) => `
      <option value="${copies}" ${copies === Number(item.copies) ? "selected" : ""}>${copies} 份</option>
    `).join("");
    const sizeMode = MIXED_SIZE_MODES.includes(item.sizeMode) ? item.sizeMode : "follow";
    const sizePreset = Object.hasOwn(PRINT_SIZE_PRESETS, item.sizePreset) ? item.sizePreset : "80x180";
    const sizeOptions = [
      `<option value="follow" ${sizeMode === "follow" ? "selected" : ""}>跟随默认尺寸</option>`,
      `<option value="80x180" ${sizeMode === "preset" && sizePreset === "80x180" ? "selected" : ""}>80×180 mm</option>`,
      `<option value="80x130" ${sizeMode === "preset" && sizePreset === "80x130" ? "selected" : ""}>80×130 mm</option>`,
      `<option value="custom" ${sizeMode === "custom" ? "selected" : ""}>自定义</option>`
    ].join("");
    const snapshotText = selectedSnapshot ? `快照 ${formatDateTime(selectedSnapshot.generatedAt)}` : "未选择有效快照";
    const customSizeHidden = sizeMode !== "custom" ? "hidden" : "";
    return `
      <div class="mixed-item" data-mixed-index="${index}">
        <div class="mixed-item-top">
          <p class="mixed-item-title">${escapeHtml(`${index + 1}. ${title}`)}</p>
          <span class="field-tip">${escapeHtml(snapshotText)}</span>
        </div>
        <div class="mixed-item-grid">
          <label>
            需求
            <select data-mixed-field="requirement" data-mixed-index="${index}">${requirementOptions}</select>
          </label>
          <label>
            快照
            <select data-mixed-field="snapshot" data-mixed-index="${index}">${snapshotOptions}</select>
          </label>
          <label>
            份数
            <select data-mixed-field="copies" data-mixed-index="${index}">${copyOptions}</select>
          </label>
          <label>
            尺寸
            <select data-mixed-field="size" data-mixed-index="${index}">${sizeOptions}</select>
          </label>
        </div>
        <div class="mixed-size-custom" ${customSizeHidden}>
          <label>
            宽 mm
            <input type="number" min="50" max="210" step="1" value="${escapeAttr(item.customWidth ?? 80)}" data-mixed-field="customWidth" data-mixed-index="${index}">
          </label>
          <label>
            高 mm
            <input type="number" min="80" max="297" step="1" value="${escapeAttr(item.customHeight ?? 180)}" data-mixed-field="customHeight" data-mixed-index="${index}">
          </label>
          <span class="field-tip">同一项多份同尺寸；同快照不同尺寸请重复添加。</span>
        </div>
        <div class="mixed-item-actions">
          <button class="secondary" type="button" data-mixed-action="up" data-mixed-index="${index}" ${index === 0 ? "disabled" : ""}>上移</button>
          <button class="secondary" type="button" data-mixed-action="down" data-mixed-index="${index}" ${index === state.printPreferences.mixedItems.length - 1 ? "disabled" : ""}>下移</button>
          <button class="secondary danger" type="button" data-mixed-action="remove" data-mixed-index="${index}">移除</button>
        </div>
      </div>
    `;
  }

  function addMixedPrintItem() {
    const printable = printableRequirements();
    const requirement = printable[0];
    const latestSnapshot = sortedSnapshots(requirement)[0];
    const prefs = state.printPreferences;
    prefs.mixedItems = Array.isArray(prefs.mixedItems) ? prefs.mixedItems : [];
    prefs.mixedItems.push({
      id: uid("mix"),
      requirementId: requirement?.id || "",
      snapshotId: latestSnapshot?.id || "",
      copies: 1
    });
    saveState();
    renderPrintView();
  }

  function handleMixedPrintFieldChange(event) {
    const index = Number(event.target.dataset.mixedIndex);
    const item = state.printPreferences.mixedItems[index];
    if (!item) return;
    const field = event.target.dataset.mixedField;
    if (field === "requirement") {
      item.requirementId = event.target.value;
      item.snapshotId = sortedSnapshots(findRequirement(item.requirementId))[0]?.id || "";
    }
    if (field === "snapshot") item.snapshotId = event.target.value;
    if (field === "copies") item.copies = Number(event.target.value);
    if (field === "size") {
      if (event.target.value === "custom") item.sizeMode = "custom";
      else if (Object.hasOwn(PRINT_SIZE_PRESETS, event.target.value)) {
        item.sizeMode = "preset";
        item.sizePreset = event.target.value;
      } else {
        item.sizeMode = "follow";
      }
    }
    if (field === "customWidth") item.customWidth = event.target.value;
    if (field === "customHeight") item.customHeight = event.target.value;
    saveState();
    renderPrintView();
  }

  function handleMixedPrintAction(event) {
    const index = Number(event.target.dataset.mixedIndex);
    const action = event.target.dataset.mixedAction;
    const items = state.printPreferences.mixedItems;
    if (!items?.[index]) return;
    if (action === "remove") items.splice(index, 1);
    if (action === "up" && index > 0) [items[index - 1], items[index]] = [items[index], items[index - 1]];
    if (action === "down" && index < items.length - 1) [items[index + 1], items[index]] = [items[index], items[index + 1]];
    saveState();
    renderPrintView();
  }

  function mixedPrintItemsTotal(items) {
    return items.reduce((sum, item) => sum + (MIXED_COPY_OPTIONS.includes(Number(item.copies)) ? Number(item.copies) : 0), 0);
  }

  function currentTicketSize() {
    const prefs = state.printPreferences;
    if (prefs.sizePreset === "custom") {
      return { width: Number(prefs.customWidth), height: Number(prefs.customHeight) };
    }
    return { ...PRINT_SIZE_PRESETS[prefs.sizePreset] };
  }

  function updateA4CopyOptions(ticketSize) {
    const prefs = state.printPreferences;
    let firstAvailable = null;
    Array.from($("#a4CopiesSelect").options).forEach((option) => {
      const copies = Number(option.value);
      const layout = calculateA4Layout(ticketSize, copies, prefs.a4Margin, prefs.a4Gap);
      option.disabled = !layout;
      option.textContent = layout ? `${copies} 份` : `${copies} 份（当前尺寸无法排下）`;
      if (layout && firstAvailable === null) firstAvailable = copies;
    });
    if (!calculateA4Layout(ticketSize, prefs.a4Copies, prefs.a4Margin, prefs.a4Gap) && firstAvailable !== null) {
      prefs.a4Copies = firstAvailable;
    }
    $("#a4CopiesSelect").value = String(prefs.a4Copies);
  }

  function buildPrintRenderResult(snapshot, ticketSize) {
    const errors = [];
    if (!snapshot) errors.push("没有可打印快照");
    if (!validPrintSize(ticketSize)) errors.push("自定义尺寸需为宽 50～210 mm、高 80～297 mm 的有效数字");

    const prefs = state.printPreferences;
    if (prefs.mode === "a4" && prefs.a4ContentMode === "mixed") {
      return buildMixedPrintRenderResult(ticketSize, errors);
    }

    let layout = null;
    if (prefs.mode === "a4" && validPrintSize(ticketSize)) {
      if (!validRangeInteger(prefs.a4Margin, 5, 30)) errors.push("A4 页边距需为 5～30 mm 的整数");
      if (!validRangeInteger(prefs.a4Gap, 0, 20)) errors.push("A4 卡片间距需为 0～20 mm 的整数");
      layout = calculateA4Layout(ticketSize, prefs.a4Copies, prefs.a4Margin, prefs.a4Gap);
      if (!layout && errors.length === 0) errors.push("当前尺寸、页边距和间距无法排下所选份数");
    }

    if (errors.length || !snapshot) {
      return { sheet: null, info: "", errors };
    }

    const sheet = prefs.mode === "a4"
      ? buildA4Sheet(snapshot, ticketSize, layout, prefs.cutLines)
      : buildSingleSheet(snapshot, ticketSize);
    $("#printPreviewStage").replaceChildren(sheet);
    const overflowErrors = measurePrintOverflow(sheet);
    errors.push(...overflowErrors);
    const info = prefs.mode === "a4"
      ? `A4 纵向 ${prefs.a4Copies} 份，${layout.cols} 列 × ${layout.rows} 行；边距 ${prefs.a4Margin} mm，间距 ${prefs.a4Gap} mm。`
      : `单张 ${ticketSize.width} × ${ticketSize.height} mm。`;
    if (errors.length) sheet.classList.add("has-print-error");
    $("#printRoot").replaceChildren(sheet.cloneNode(true));
    writeDynamicPrintStyle(prefs.mode === "a4" ? A4 : ticketSize);
    return { sheet, info, errors: [...new Set(errors)] };
  }

  function buildMixedPrintRenderResult(ticketSize, baseErrors) {
    const prefs = state.printPreferences;
    const errors = [...baseErrors.filter((message) => message !== "没有可打印快照")];
    if (!validRangeInteger(prefs.a4Margin, 5, 30)) errors.push("A4 页边距需为 5～30 mm 的整数");
    if (!validRangeInteger(prefs.a4Gap, 0, 20)) errors.push("A4 卡片间距需为 0～20 mm 的整数");
    const expanded = expandMixedPrintSnapshots(ticketSize, errors);
    const total = expanded.length;
    if (total < 1 && errors.length === 0) errors.push("请先添加至少一个取号单快照");
    if (total > 6) errors.push("多需求拼版展开后最多 6 张票");
    const layout = validPrintSize(ticketSize) && total >= 1 && total <= 6
      ? calculateVariableA4Layout(expanded, prefs.a4Margin, prefs.a4Gap)
      : null;
    if (!layout && errors.length === 0) errors.push("当前尺寸、页边距和间距无法排下所选拼版内容，请调整尺寸、份数、顺序、页边距或间距");

    if (errors.length || !layout) {
      return { sheet: null, info: total ? `A4 多需求拼版 ${total} 张。` : "", errors: [...new Set(errors)] };
    }

    const sheet = buildA4MixedSheet(expanded, layout, prefs.cutLines);
    $("#printPreviewStage").replaceChildren(sheet);
    const overflowErrors = measurePrintOverflow(sheet);
    errors.push(...overflowErrors);
    const info = `A4 多需求拼版 ${total} 张，${layout.rows.length} 行；边距 ${prefs.a4Margin} mm，间距 ${prefs.a4Gap} mm。`;
    if (errors.length) sheet.classList.add("has-print-error");
    $("#printRoot").replaceChildren(sheet.cloneNode(true));
    writeDynamicPrintStyle(A4);
    return { sheet, info, errors: [...new Set(errors)] };
  }

  function expandMixedPrintSnapshots(defaultSize, errors) {
    const items = Array.isArray(state.printPreferences.mixedItems) ? state.printPreferences.mixedItems : [];
    const expanded = [];
    items.forEach((item, index) => {
      const requirement = findRequirement(item.requirementId);
      if (!item.requirementId || !requirement) {
        errors.push(`打印篮子第 ${index + 1} 项未选择有效需求`);
        return;
      }
      const snapshots = sortedSnapshots(requirement);
      if (!snapshots.length) {
        errors.push(`打印篮子第 ${index + 1} 项没有可打印快照`);
        return;
      }
      const snapshot = snapshots.find((candidate) => candidate.id === item.snapshotId);
      if (!item.snapshotId || !snapshot) {
        errors.push(`打印篮子第 ${index + 1} 项未选择有效快照`);
        return;
      }
      const copies = Number(item.copies);
      if (!MIXED_COPY_OPTIONS.includes(copies)) {
        errors.push(`打印篮子第 ${index + 1} 项份数需为 1～6`);
        return;
      }
      const size = mixedItemSize(item, defaultSize, index, errors);
      if (!size) return;
      for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) expanded.push(snapshot);
      for (let copyIndex = expanded.length - copies; copyIndex < expanded.length; copyIndex += 1) {
        expanded[copyIndex] = { snapshot, size, itemIndex: index, copyIndex: copyIndex - (expanded.length - copies) };
      }
    });
    return expanded;
  }

  function mixedItemSize(item, defaultSize, index, errors) {
    const mode = MIXED_SIZE_MODES.includes(item.sizeMode) ? item.sizeMode : "follow";
    let size = null;
    if (mode === "follow") size = { ...defaultSize };
    if (mode === "preset") size = { ...(PRINT_SIZE_PRESETS[item.sizePreset] || PRINT_SIZE_PRESETS["80x180"]) };
    if (mode === "custom") size = { width: Number(item.customWidth), height: Number(item.customHeight) };
    size = { width: Number(size?.width), height: Number(size?.height) };
    if (!validPrintSize(size)) {
      errors.push(`打印篮子第 ${index + 1} 项自定义尺寸需为宽 50～210 mm、高 80～297 mm 的整数`);
      return null;
    }
    return size;
  }

  function validPrintSize(size) {
    return validRangeInteger(size.width, 50, 210) && validRangeInteger(size.height, 80, 297);
  }

  function validRangeInteger(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) && Number.isInteger(number) && number >= min && number <= max;
  }

  function calculateA4Layout(size, copies, margin, gap) {
    const availableWidth = A4.width - margin * 2;
    const availableHeight = A4.height - margin * 2;
    const candidates = layoutCandidates(copies);
    return candidates.find(({ cols, rows }) => {
      const neededWidth = cols * size.width + (cols - 1) * gap;
      const neededHeight = rows * size.height + (rows - 1) * gap;
      return neededWidth <= availableWidth + 0.001 && neededHeight <= availableHeight + 0.001;
    }) || null;
  }

  function layoutCandidates(copies) {
    if (copies === 1) return [{ cols: 1, rows: 1 }];
    if (copies === 2) return [{ cols: 2, rows: 1 }, { cols: 1, rows: 2 }];
    if (copies === 3) return [{ cols: 3, rows: 1 }, { cols: 1, rows: 3 }, { cols: 2, rows: 2 }];
    if (copies === 4) return [{ cols: 2, rows: 2 }, { cols: 4, rows: 1 }, { cols: 1, rows: 4 }];
    if (copies === 5) return [{ cols: 3, rows: 2 }, { cols: 2, rows: 3 }, { cols: 5, rows: 1 }, { cols: 1, rows: 5 }];
    if (copies === 6) return [{ cols: 3, rows: 2 }, { cols: 2, rows: 3 }, { cols: 6, rows: 1 }, { cols: 1, rows: 6 }];
    return [];
  }

  function calculateVariableA4Layout(items, margin, gap) {
    margin = Number(margin);
    gap = Number(gap);
    const availableWidth = A4.width - margin * 2;
    const availableHeight = A4.height - margin * 2;
    const count = items.length;
    const candidates = [];
    for (let mask = 0; mask < (1 << Math.max(0, count - 1)); mask += 1) {
      const rows = [];
      let current = [];
      items.forEach((item, index) => {
        current.push(item);
        if (index === count - 1 || (mask & (1 << index))) {
          rows.push(current);
          current = [];
        }
      });
      const rowMetrics = rows.map((row) => ({
        width: row.reduce((sum, item) => sum + item.size.width, 0) + gap * (row.length - 1),
        height: Math.max(...row.map((item) => item.size.height)),
        items: row
      }));
      const maxWidth = Math.max(...rowMetrics.map((row) => row.width));
      const totalHeight = rowMetrics.reduce((sum, row) => sum + row.height, 0) + gap * (rowMetrics.length - 1);
      if (maxWidth > availableWidth + 0.001 || totalHeight > availableHeight + 0.001) continue;
      const cards = [];
      let y = margin + (availableHeight - totalHeight) / 2;
      rowMetrics.forEach((row, rowIndex) => {
        let x = margin + (availableWidth - row.width) / 2;
        row.items.forEach((item) => {
          cards.push({
            ...item,
            x,
            y,
            width: item.size.width,
            height: item.size.height,
            rowIndex
          });
          x += item.size.width + gap;
        });
        y += row.height + gap;
      });
      candidates.push({
        rows: rowMetrics,
        cards,
        totalHeight,
        maxWidth,
        area: maxWidth * totalHeight
      });
    }
    candidates.sort((a, b) => (
      a.totalHeight - b.totalHeight
      || a.area - b.area
      || a.maxWidth - b.maxWidth
      || a.rows.length - b.rows.length
      || layoutSignature(a.cards).localeCompare(layoutSignature(b.cards))
    ));
    return candidates[0] || null;
  }

  function layoutSignature(cards) {
    return cards.map((card) => `${Number(card.x).toFixed(3)},${Number(card.y).toFixed(3)}`).join("|");
  }

  function buildSingleSheet(snapshot, size) {
    const sheet = document.createElement("div");
    sheet.className = "print-sheet single";
    applyPrintVars(sheet, size, size, { cols: 1, rows: 1, gap: 0, margin: 0 });
    sheet.append(buildPrintCard(snapshot, size, false));
    return sheet;
  }

  function buildA4Sheet(snapshot, size, layout, cutLines) {
    const sheet = document.createElement("div");
    sheet.className = "print-sheet a4";
    applyPrintVars(sheet, A4, size, {
      cols: layout.cols,
      rows: layout.rows,
      gap: state.printPreferences.a4Gap,
      margin: state.printPreferences.a4Margin
    });
    for (let index = 0; index < state.printPreferences.a4Copies; index += 1) {
      sheet.append(buildPrintCard(snapshot, size, cutLines));
    }
    if (cutLines) sheet.append(buildCutLineLayer(size, layout, state.printPreferences.a4Copies));
    return sheet;
  }

  function buildA4MixedSheet(items, layout, cutLines) {
    const sheet = document.createElement("div");
    sheet.className = "print-sheet a4 mixed";
    applyPrintVars(sheet, A4, { width: 0, height: 0 }, {
      cols: 1,
      rows: layout.rows.length,
      gap: state.printPreferences.a4Gap,
      margin: state.printPreferences.a4Margin
    });
    layout.cards.forEach((item, index) => {
      const card = buildPrintCard(item.snapshot, item.size, cutLines);
      card.dataset.mixedItemIndex = String(item.itemIndex);
      card.dataset.printItemLabel = `打印篮子第 ${item.itemIndex + 1} 项`;
      card.dataset.layoutIndex = String(index);
      card.style.setProperty("--card-left-mm", item.x);
      card.style.setProperty("--card-top-mm", item.y);
      card.style.width = `${item.size.width}mm`;
      card.style.height = `${item.size.height}mm`;
      card.style.left = `${item.x}mm`;
      card.style.top = `${item.y}mm`;
      sheet.append(card);
    });
    if (cutLines) sheet.append(buildVariableCutLineLayer(layout.cards));
    return sheet;
  }

  function buildCutLineLayer(size, layout, copies) {
    const layer = document.createElement("div");
    layer.className = "cut-line-layer";
    const gap = Number(state.printPreferences.a4Gap);
    const gridWidth = layout.cols * size.width + (layout.cols - 1) * gap;
    const gridHeight = layout.rows * size.height + (layout.rows - 1) * gap;
    const startX = (A4.width - gridWidth) / 2;
    const startY = (A4.height - gridHeight) / 2;
    for (let index = 0; index < copies; index += 1) {
      const col = index % layout.cols;
      const row = Math.floor(index / layout.cols);
      const x = startX + col * (size.width + gap);
      const y = startY + row * (size.height + gap);
      layer.append(...cropMarksForCard(x, y, size));
    }
    return layer;
  }

  function buildVariableCutLineLayer(cards) {
    const layer = document.createElement("div");
    layer.className = "cut-line-layer";
    cards.forEach((card) => {
      layer.append(...cropMarksForCard(card.x, card.y, card.size));
    });
    return layer;
  }

  function cropMarksForCard(x, y, size) {
    const offset = 4;
    const marks = [
      ["top-left", x - offset, y - offset],
      ["top-right", x + size.width, y - offset],
      ["bottom-left", x - offset, y + size.height],
      ["bottom-right", x + size.width, y + size.height]
    ];
    return marks.map(([position, left, top]) => {
      const mark = document.createElement("span");
      mark.className = `crop-mark ${position}`;
      mark.style.left = `${left}mm`;
      mark.style.top = `${top}mm`;
      return mark;
    });
  }

  function applyPrintVars(sheet, sheetSize, ticketSize, layout) {
    sheet.style.setProperty("--sheet-width-mm", sheetSize.width);
    sheet.style.setProperty("--sheet-height-mm", sheetSize.height);
    sheet.style.setProperty("--ticket-width-mm", ticketSize.width);
    sheet.style.setProperty("--ticket-height-mm", ticketSize.height);
    sheet.style.setProperty("--layout-cols", layout.cols);
    sheet.style.setProperty("--layout-rows", layout.rows);
    sheet.style.setProperty("--layout-gap-mm", layout.gap);
    sheet.style.setProperty("--layout-margin-mm", layout.margin);
    sheet.style.setProperty("--preview-scale", "1");
  }

  function buildPrintCard(snapshot, size, cutLines) {
    const template = getTemplate(snapshot.templateId);
    const card = document.createElement("article");
    card.className = `print-card ${template.className}`;
    card.dataset.snapshotId = snapshot.id;
    card.dataset.ticketSize = `${size.width}x${size.height}`;
    card.style.setProperty("--card-width-mm", size.width);
    card.style.setProperty("--card-height-mm", size.height);
    const modules = snapshotModules(snapshot)
      .filter((module) => module.visible && !(module.id === "waiting" && !String(module.text || "").trim()))
      .map(createTicketModuleElement);
    card.replaceChildren(...modules);
    return card;
  }

  function snapshotModules(snapshot) {
    const modules = Array.isArray(snapshot.modules) ? snapshot.modules : [];
    const ordered = Array.isArray(snapshot.moduleOrder) && snapshot.moduleOrder.length
      ? snapshot.moduleOrder.map((id) => modules.find((module) => module.id === id)).filter(Boolean)
      : modules;
    return ordered.map((module) => normalizeModuleConfig(module, snapshot.templateId || DEFAULT_TEMPLATE_ID));
  }

  function measurePrintOverflow(sheet) {
    const errors = [];
    const cards = Array.from(sheet.querySelectorAll(".print-card"));
    cards.forEach((card) => {
      const moduleOverflow = measureOverflowModuleIds(card);
      moduleOverflow.forEach((id) => {
        const label = getModuleDef(id).label;
        errors.push(`${card.dataset.printItemLabel ? `${card.dataset.printItemLabel}：` : ""}${label} 超过 3 行`);
      });
      if (ticketContentOverflows(card)) errors.push(`${card.dataset.printItemLabel ? `${card.dataset.printItemLabel}：` : ""}票面整体高度溢出`);
    });
    return errors;
  }

  function ticketContentOverflows(card) {
    const cardRect = card.getBoundingClientRect();
    const modules = Array.from(card.querySelectorAll(".ticket-module"));
    if (!modules.length) return false;
    const contentBottom = Math.max(...modules.map((module) => module.getBoundingClientRect().bottom));
    const ticketHeight = Number(String(card.dataset.ticketSize || "").split("x")[1]);
    const clippedInTinyTicket = Number.isFinite(ticketHeight) && ticketHeight <= 100 && card.scrollHeight > card.clientHeight + 1;
    return contentBottom > cardRect.bottom - 4 || clippedInTinyTicket;
  }

  function writeDynamicPrintStyle(pageSize) {
    $("#dynamicPrintStyle").textContent = `@page { size: ${pageSize.width}mm ${pageSize.height}mm; margin: 0; }`;
  }

  function openBrowserPrint() {
    renderPrintView();
    if ($("#openPrintBtn").disabled) return;
    document.body.classList.add("printing");
    window.print();
  }

  function exportBackup() {
    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `需求取号单备份_${backupTimestamp(new Date())}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    $("#backupSummary").textContent = `已导出完整备份：需求 ${state.requirements.length} 条，快照 ${countSnapshots(state)} 条。`;
    $("#backupError").textContent = "";
  }

  async function handleBackupFileSelected(event) {
    pendingRestoreState = null;
    $("#confirmRestoreBtn").disabled = true;
    $("#backupSummary").textContent = "正在校验备份文件。";
    $("#backupError").textContent = "";
    const file = event.target.files?.[0];
    if (!file) {
      $("#backupSummary").textContent = "尚未选择备份文件。";
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = validateBackupPayload(parsed);
      pendingRestoreState = normalized;
      $("#confirmRestoreBtn").disabled = false;
      $("#backupSummary").textContent = `校验通过：导出时间 ${parsed.exportedAt || "未记录"}；需求 ${normalized.requirements.length} 条；快照 ${countSnapshots(normalized)} 条。`;
    } catch (error) {
      $("#backupSummary").textContent = "备份未通过校验，当前数据未改变。";
      $("#backupError").textContent = error.message || "备份文件无效。";
      event.target.value = "";
    }
  }

  function validateBackupPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("备份顶层必须是对象。");
    if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) throw new Error("备份格式版本不支持。");
    if (!payload.state || typeof payload.state !== "object" || Array.isArray(payload.state)) throw new Error("缺少完整应用状态。");
    const raw = payload.state;
    if (!Array.isArray(raw.departments)) throw new Error("部门集合缺失或类型错误。");
    if (!Array.isArray(raw.types)) throw new Error("需求初判集合缺失或类型错误。");
    if (!Array.isArray(raw.priorities)) throw new Error("优先级集合缺失或类型错误。");
    if (!Array.isArray(raw.requirements)) throw new Error("需求集合缺失或类型错误。");
    validateRawBackupState(raw);
    const normalized = normalizeState(raw);
    if (!normalized.departments.length || !normalized.types.length || normalized.priorities.length !== 4) {
      throw new Error("核心配置无法形成有效状态。");
    }
    normalized.requirements.forEach((requirement, index) => {
      if (!requirement.id || typeof requirement.title !== "string") throw new Error(`第 ${index + 1} 条需求结构无效。`);
      if (!Array.isArray(requirement.ticketSnapshots)) throw new Error(`第 ${index + 1} 条需求快照集合无效。`);
    });
    return normalized;
  }

  function validateRawBackupState(raw) {
    validateDepartmentArray(raw.departments);
    validateTypeArray(raw.types);
    validatePriorityArray(raw.priorities);
    validateRequirementArray(raw.requirements);
    if (Object.hasOwn(raw, "ticketDefault") && raw.ticketDefault !== null) validateTicketConfigShape(raw.ticketDefault, "默认取号单样式");
    if (Object.hasOwn(raw, "printPreferences") && raw.printPreferences !== null && !isPlainObject(raw.printPreferences)) {
      throw new Error("打印偏好必须是对象。");
    }
    if (Object.hasOwn(raw, "printPreferences") && raw.printPreferences !== null) validatePrintPreferenceShape(raw.printPreferences);
  }

  function validatePrintPreferenceShape(prefs) {
    if (Object.hasOwn(prefs, "requirementId") && typeof prefs.requirementId !== "string") throw new Error("打印偏好 requirementId 类型错误。");
    if (Object.hasOwn(prefs, "snapshotId") && typeof prefs.snapshotId !== "string") throw new Error("打印偏好 snapshotId 类型错误。");
    if (Object.hasOwn(prefs, "mode") && !["single", "a4"].includes(prefs.mode)) throw new Error("打印模式不受支持。");
    if (Object.hasOwn(prefs, "a4ContentMode") && !["same", "mixed"].includes(prefs.a4ContentMode)) throw new Error("A4 拼版方式不受支持。");
    if (Object.hasOwn(prefs, "a4Copies") && !A4_COPY_OPTIONS.includes(Number(prefs.a4Copies))) throw new Error("同款多份数量不受支持。");
    if (Object.hasOwn(prefs, "cutLines") && typeof prefs.cutLines !== "boolean") throw new Error("裁切线偏好类型错误。");
    if (Object.hasOwn(prefs, "mixedItems")) {
      if (!Array.isArray(prefs.mixedItems)) throw new Error("多需求打印篮子必须是数组。");
      prefs.mixedItems.forEach((item, index) => {
        requirePlainObject(item, `打印篮子第 ${index + 1} 项`);
        if (Object.hasOwn(item, "id") && typeof item.id !== "string") throw new Error(`打印篮子第 ${index + 1} 项 ID 类型错误。`);
        if (Object.hasOwn(item, "requirementId") && typeof item.requirementId !== "string") throw new Error(`打印篮子第 ${index + 1} 项需求 ID 类型错误。`);
        if (Object.hasOwn(item, "snapshotId") && typeof item.snapshotId !== "string") throw new Error(`打印篮子第 ${index + 1} 项快照 ID 类型错误。`);
        if (Object.hasOwn(item, "copies") && !MIXED_COPY_OPTIONS.includes(Number(item.copies))) throw new Error(`打印篮子第 ${index + 1} 项份数不受支持。`);
        if (Object.hasOwn(item, "sizeMode") && !MIXED_SIZE_MODES.includes(item.sizeMode)) throw new Error(`打印篮子第 ${index + 1} 项尺寸模式不受支持。`);
        if (Object.hasOwn(item, "sizePreset") && !Object.hasOwn(PRINT_SIZE_PRESETS, item.sizePreset)) throw new Error(`打印篮子第 ${index + 1} 项预设尺寸不受支持。`);
        if (item.sizeMode === "custom") {
          if (!validRangeInteger(item.customWidth, 50, 210)) throw new Error(`打印篮子第 ${index + 1} 项自定义宽度需为 50～210 mm 的整数。`);
          if (!validRangeInteger(item.customHeight, 80, 297)) throw new Error(`打印篮子第 ${index + 1} 项自定义高度需为 80～297 mm 的整数。`);
        }
      });
    }
  }

  function validateDepartmentArray(items) {
    const ids = new Set();
    items.forEach((item, index) => {
      requirePlainObject(item, `第 ${index + 1} 个部门`);
      const id = requireNonEmptyString(item.id, `第 ${index + 1} 个部门 ID`);
      requireNonEmptyString(item.name, `第 ${index + 1} 个部门名称`);
      ensureUniqueId(ids, id, "部门 ID");
      if (Object.hasOwn(item, "active") && typeof item.active !== "boolean") throw new Error(`第 ${index + 1} 个部门 active 类型错误。`);
    });
  }

  function validateTypeArray(items) {
    const ids = new Set();
    items.forEach((item, index) => {
      requirePlainObject(item, `第 ${index + 1} 个初判`);
      const id = requireNonEmptyString(item.id, `第 ${index + 1} 个初判 ID`);
      requireNonEmptyString(item.prefix, `第 ${index + 1} 个初判前缀`);
      requireNonEmptyString(item.name, `第 ${index + 1} 个初判名称`);
      ensureUniqueId(ids, id, "初判 ID");
      if (Object.hasOwn(item, "active") && typeof item.active !== "boolean") throw new Error(`第 ${index + 1} 个初判 active 类型错误。`);
    });
  }

  function validatePriorityArray(items) {
    const ids = new Set();
    items.forEach((item, index) => {
      requirePlainObject(item, `第 ${index + 1} 个优先级`);
      const id = requireNonEmptyString(item.id, `第 ${index + 1} 个优先级 ID`);
      requireNonEmptyString(item.name, `第 ${index + 1} 个优先级名称`);
      ensureUniqueId(ids, id, "优先级 ID");
      if (Object.hasOwn(item, "level")) requireNonEmptyString(item.level, `第 ${index + 1} 个优先级级别`);
    });
  }

  function validateRequirementArray(items) {
    const ids = new Set();
    const snapshotIds = new Set();
    items.forEach((item, index) => {
      requirePlainObject(item, `第 ${index + 1} 条需求`);
      const id = requireNonEmptyString(item.id, `第 ${index + 1} 条需求 ID`);
      requireNonEmptyString(item.title, `第 ${index + 1} 条需求名称`);
      ensureUniqueId(ids, id, "需求 ID");
      if (!Array.isArray(item.departmentIds)) throw new Error(`第 ${index + 1} 条需求 departmentIds 必须是数组。`);
      item.departmentIds.forEach((departmentId, depIndex) => requireNonEmptyString(departmentId, `第 ${index + 1} 条需求第 ${depIndex + 1} 个部门 ID`));
      if (Object.hasOwn(item, "numberHistory")) validateStringArray(item.numberHistory, `第 ${index + 1} 条需求 numberHistory`);
      if (Object.hasOwn(item, "ticketConfig") && item.ticketConfig !== null) validateTicketConfigShape(item.ticketConfig, `第 ${index + 1} 条需求取号单配置`);
      if (Object.hasOwn(item, "ticketSnapshots")) {
        if (!Array.isArray(item.ticketSnapshots)) throw new Error(`第 ${index + 1} 条需求 ticketSnapshots 必须是数组。`);
        item.ticketSnapshots.forEach((snapshot, snapIndex) => validateTicketSnapshotShape(snapshot, `第 ${index + 1} 条需求第 ${snapIndex + 1} 个快照`, snapshotIds));
      }
    });
  }

  function validateTicketConfigShape(config, label) {
    requirePlainObject(config, label);
    if (Object.hasOwn(config, "templateId")) requireNonEmptyString(config.templateId, `${label}模板 ID`);
    if (!Object.hasOwn(config, "modules")) return;
    if (!Array.isArray(config.modules)) throw new Error(`${label} modules 必须是数组。`);
    validateModuleArray(config.modules, `${label}模块`);
  }

  function validateTicketSnapshotShape(snapshot, label, snapshotIds) {
    requirePlainObject(snapshot, label);
    const id = requireNonEmptyString(snapshot.id, `${label} ID`);
    ensureUniqueId(snapshotIds, id, "快照 ID");
    if (Object.hasOwn(snapshot, "requirementId")) requireNonEmptyString(snapshot.requirementId, `${label}需求 ID`);
    if (Object.hasOwn(snapshot, "templateId")) requireNonEmptyString(snapshot.templateId, `${label}模板 ID`);
    if (Object.hasOwn(snapshot, "moduleOrder")) validateStringArray(snapshot.moduleOrder, `${label} moduleOrder`);
    if (!Array.isArray(snapshot.modules)) throw new Error(`${label} modules 必须是数组。`);
    validateModuleArray(snapshot.modules, `${label}模块`);
  }

  function validateModuleArray(modules, label) {
    const ids = new Set();
    modules.forEach((module, index) => {
      requirePlainObject(module, `${label}第 ${index + 1} 项`);
      const id = requireNonEmptyString(module.id, `${label}第 ${index + 1} 项 ID`);
      if (!MODULE_IDS.includes(id)) throw new Error(`${label}第 ${index + 1} 项 ID 不受支持。`);
      ensureUniqueId(ids, id, `${label} ID`);
      if (Object.hasOwn(module, "visible") && typeof module.visible !== "boolean") throw new Error(`${label}第 ${index + 1} 项 visible 类型错误。`);
      if (Object.hasOwn(module, "text") && typeof module.text !== "string") throw new Error(`${label}第 ${index + 1} 项 text 类型错误。`);
      if (Object.hasOwn(module, "sourceText") && typeof module.sourceText !== "string") throw new Error(`${label}第 ${index + 1} 项 sourceText 类型错误。`);
      if (Object.hasOwn(module, "fontSize") && !Number.isFinite(Number(module.fontSize))) throw new Error(`${label}第 ${index + 1} 项 fontSize 类型错误。`);
    });
  }

  function validateStringArray(value, label) {
    if (!Array.isArray(value)) throw new Error(`${label} 必须是数组。`);
    value.forEach((item, index) => requireNonEmptyString(item, `${label} 第 ${index + 1} 项`));
  }

  function requirePlainObject(value, label) {
    if (!isPlainObject(value)) throw new Error(`${label}必须是对象。`);
  }

  function requireNonEmptyString(value, label) {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${label}不能为空。`);
    return value;
  }

  function ensureUniqueId(ids, id, label) {
    if (ids.has(id)) throw new Error(`${label} 重复：${id}`);
    ids.add(id);
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function confirmRestoreBackup() {
    if (!pendingRestoreState) return;
    if (!confirm("当前浏览器中的全部数据将被替换。确认继续覆盖恢复？")) return;
    state = JSON.parse(JSON.stringify(pendingRestoreState));
    filters = { search: "", departments: [], type: "", priority: "", status: "" };
    currentTicketId = "";
    selectedTicketModuleId = "roast";
    pendingRestoreState = null;
    $("#confirmRestoreBtn").disabled = true;
    $("#importBackupInput").value = "";
    saveState();
    renderAll();
    $("#backupSummary").textContent = `恢复成功：需求 ${state.requirements.length} 条，快照 ${countSnapshots(state)} 条。`;
    $("#backupError").textContent = "";
  }

  function clearAllDataWithDoubleConfirm() {
    const first = confirm("将清空全部需求、取号单配置、快照、默认样式、筛选和编辑状态；系统默认部门、初判和 P0～P3 配置会保留。是否继续？");
    if (!first) return;
    const second = confirm("清空后不可恢复，除非已经导出备份。确认清空全部数据？");
    if (!second) return;
    state = defaultState();
    filters = { search: "", departments: [], type: "", priority: "", status: "" };
    currentTicketId = "";
    selectedTicketModuleId = "roast";
    pendingRestoreState = null;
    saveState();
    renderAll();
    $("#backupSummary").textContent = "已清空为初始状态；可通过之前导出的备份恢复。";
    $("#backupError").textContent = "";
  }

  function backupTimestamp(date) {
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function countSnapshots(targetState) {
    return targetState.requirements.reduce((count, requirement) => count + (Array.isArray(requirement.ticketSnapshots) ? requirement.ticketSnapshots.length : 0), 0);
  }

  function moveConfig(collection, id, direction) {
    const index = collection.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= collection.length) return;
    const [item] = collection.splice(index, 1);
    collection.splice(targetIndex, 0, item);
    persistAndRender();
  }

  function toggleDepartment(id) {
    const item = state.departments.find((department) => department.id === id);
    if (!item) return;
    item.active = !item.active;
    persistAndRender();
  }

  function renameDepartment(id) {
    const item = state.departments.find((department) => department.id === id);
    if (!item) return;
    const name = prompt("新的部门名称", item.name);
    if (!name || !name.trim()) return;
    item.name = name.trim();
    persistAndRender();
  }

  function recolorDepartment(id) {
    const item = state.departments.find((department) => department.id === id);
    recolorConfig(item, "新的部门颜色");
  }

  function toggleType(id) {
    const item = state.types.find((type) => type.id === id);
    if (!item) return;
    if (!item.active) {
      const conflict = state.types.find((type) => type.id !== id && type.active && type.prefix.toUpperCase() === item.prefix.toUpperCase());
      if (conflict) {
        alert(`无法启用：前缀 ${item.prefix.toUpperCase()} 已被“${conflict.prefix} ${conflict.name}”使用。`);
        return;
      }
    }
    item.active = !item.active;
    persistAndRender();
  }

  function renameType(id) {
    const item = state.types.find((type) => type.id === id);
    if (!item) return;
    const name = prompt("新的初判名称", item.name);
    if (!name || !name.trim()) return;
    item.name = name.trim();
    persistAndRender();
  }

  function recolorType(id) {
    const item = state.types.find((type) => type.id === id);
    recolorConfig(item, "新的初判颜色");
  }

  function renamePriority(id) {
    const item = state.priorities.find((priority) => priority.id === id);
    if (!item) return;
    const name = prompt(`新的 ${item.level} 展示名称`, item.name);
    if (!name || !name.trim()) return;
    item.name = name.trim();
    persistAndRender();
  }

  function recolorPriority(id) {
    const item = state.priorities.find((priority) => priority.id === id);
    recolorConfig(item, `新的 ${item.level} 颜色`);
  }

  function recolorConfig(item, title) {
    if (!item) return;
    const color = prompt(title, item.color || "#6f685f");
    if (!color) return;
    if (!isHexColor(color.trim())) {
      alert("颜色请使用 #RRGGBB 格式。");
      return;
    }
    item.color = color.trim();
    persistAndRender();
  }

  function startNewCycle(typeId) {
    const type = state.types.find((item) => item.id === typeId);
    if (!type) return;
    if (!confirm(`确认为 ${type.prefix} ${type.name} 开启新一轮？历史编号不会修改。`)) return;
    type.cycle = Number(type.cycle || 1) + 1;
    type.next = 1;
    while (activeTicketExists(type.prefix, type.next, type.cycle)) {
      type.next += 1;
    }
    persistAndRender();
  }

  function openTicketEditor(id) {
    const requirement = findRequirement(id);
    if (!requirement) return;
    currentTicketId = id;
    ensureTicketConfig(requirement);
    selectedTicketModuleId = selectedTicketModuleId && getTicketModule(requirement, selectedTicketModuleId)
      ? selectedTicketModuleId
      : "roast";
    switchView("ticket");
    renderTicketEditor();
  }

  function currentTicketRequirement() {
    return currentTicketId ? findRequirement(currentTicketId) : null;
  }

  function ensureTicketConfig(requirement) {
    const base = requirement.ticketConfig;
    if (!base) {
      requirement.ticketConfig = createInitialTicketConfig(requirement);
    } else {
      const templateId = getTemplate(base.templateId)?.id || DEFAULT_TEMPLATE_ID;
      requirement.ticketConfig = {
        templateId,
        modules: mergeTicketModules(requirement, templateId, base.modules || [], false),
        updatedAt: base.updatedAt || ""
      };
    }
    refreshDynamicModuleTexts(requirement, requirement.ticketConfig);
    return requirement.ticketConfig;
  }

  function createInitialTicketConfig(requirement) {
    const source = state.ticketDefault || { templateId: DEFAULT_TEMPLATE_ID, modules: [] };
    const templateId = getTemplate(source.templateId)?.id || DEFAULT_TEMPLATE_ID;
    return {
      templateId,
      modules: mergeTicketModules(requirement, templateId, source.modules || [], Boolean(state.ticketDefault)),
      updatedAt: new Date().toISOString()
    };
  }

  function mergeTicketModules(requirement, templateId, baseModules, fromDefaultStyle) {
    const knownBase = Array.isArray(baseModules) ? baseModules.filter((module) => MODULE_IDS.includes(module.id)) : [];
    const order = mergedTicketModuleOrder(knownBase);
    return order.map((id) => buildTicketModule(requirement, templateId, id, knownBase.find((module) => module.id === id), fromDefaultStyle));
  }

  function mergedTicketModuleOrder(knownBase) {
    const order = knownBase.map((module) => module.id);
    MODULE_IDS.filter((id) => !order.includes(id)).forEach((id) => {
      if (id === "requirementName") {
        insertRequirementNameModule(order);
      } else {
        order.push(id);
      }
    });
    return order;
  }

  function insertRequirementNameModule(order) {
    const departmentsIndex = order.indexOf("departments");
    if (departmentsIndex >= 0) {
      order.splice(departmentsIndex + 1, 0, "requirementName");
      return;
    }
    const roastIndex = order.indexOf("roast");
    if (roastIndex >= 0) {
      order.splice(roastIndex, 0, "requirementName");
      return;
    }
    order.push("requirementName");
  }

  function buildTicketModule(requirement, templateId, id, baseModule, fromDefaultStyle) {
    const def = getModuleDef(id);
    const style = getTemplateStyle(templateId, id);
    const sourceText = moduleDefaultText(id, requirement, templateId);
    const templateText = templateDefaultText(templateId, id);
    const isDynamicDefault = fromDefaultStyle && def.dynamic;
    const baseHasText = baseModule && typeof baseModule.text === "string";
    const text = isDynamicDefault
      ? sourceText
      : baseHasText
        ? baseModule.text
        : def.dynamic
          ? sourceText
          : templateText;
    const module = {
      id,
      label: def.label,
      visible: typeof baseModule?.visible === "boolean" ? baseModule.visible : def.defaultVisible,
      text,
      fontSize: clampNumber(baseModule?.fontSize, 12, 48, style.fontSize),
      weight: ["400", "700", "900"].includes(String(baseModule?.weight)) ? String(baseModule.weight) : style.weight,
      align: ["left", "center", "right"].includes(baseModule?.align) ? baseModule.align : style.align,
      color: isHexColor(baseModule?.color) ? baseModule.color : style.color,
      customText: Boolean(baseModule?.customText && !isDynamicDefault),
      sourceText,
      manualVisibility: Boolean(baseModule?.manualVisibility)
    };
    if (id === "waiting" && !sourceText && !module.manualVisibility) module.visible = false;
    return module;
  }

  function refreshDynamicModuleTexts(requirement, config) {
    config.modules.forEach((module) => {
      const def = getModuleDef(module.id);
      if (!def.dynamic) return;
      const sourceText = moduleDefaultText(module.id, requirement, config.templateId);
      const canSync = !module.customText || module.text === module.sourceText;
      if (canSync) {
        module.text = sourceText;
        module.customText = false;
      }
      module.sourceText = sourceText;
      if (module.id === "waiting") {
        if (!sourceText) module.visible = false;
        else if (!module.manualVisibility) module.visible = true;
      }
    });
  }

  function renderTicketEditor() {
    const requirement = currentTicketRequirement();
    const editor = $("#ticketEditor");
    const empty = $("#ticketEmptyState");
    if (!requirement) {
      editor.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    editor.hidden = false;

    const config = ensureTicketConfig(requirement);
    if (!getTicketModule(requirement, selectedTicketModuleId)) selectedTicketModuleId = config.modules[0]?.id || "title";

    $("#ticketEditorMode").textContent = `取号单 ${requirement.ticketNo || "--"}`;
    $("#ticketEditorTitle").textContent = requirement.title;
    renderTicketSnapshotSummary(requirement);
    renderTicketTemplateOptions(config);
    renderTicketModuleOptions(config);
    renderSelectedModuleControls(requirement, config);
    renderTicketModuleList(requirement, config);
    renderTicketPreview(requirement, config);
  }

  function renderTicketSnapshotSummary(requirement) {
    const count = requirement.ticketSnapshots.length;
    const latest = latestSnapshot(requirement);
    const timeText = latest ? `最近生成：${formatDateTime(latest.generatedAt)}` : "尚未生成";
    $("#ticketSnapshotSummary").textContent = `${timeText}；已有快照 ${count} 条`;
  }

  function renderTicketTemplateOptions(config) {
    $("#ticketTemplateSelect").innerHTML = TEMPLATES.map((template) => `
      <option value="${template.id}" ${template.id === config.templateId ? "selected" : ""}>${escapeHtml(template.name)}</option>
    `).join("");
  }

  function renderTicketModuleOptions(config) {
    $("#ticketModuleSelect").innerHTML = config.modules.map((module) => `
      <option value="${escapeAttr(module.id)}" ${module.id === selectedTicketModuleId ? "selected" : ""}>${escapeHtml(module.label)}</option>
    `).join("");
  }

  function renderSelectedModuleControls(requirement, config) {
    const module = getTicketModule(requirement, selectedTicketModuleId) || config.modules[0];
    if (!module) return;
    selectedTicketModuleId = module.id;
    $("#ticketModuleText").maxLength = moduleTextLimit(module);
    $("#ticketModuleText").value = module.text;
    $("#ticketFontSize").value = module.fontSize;
    $("#ticketFontWeight").value = module.weight;
    $("#ticketTextAlign").value = module.align;
    $("#ticketAccentColor").value = module.color;
    updateTicketTextCounter(module);
  }

  function renderTicketModuleList(requirement, config) {
    const rows = config.modules.map((module, index) => {
      const row = document.createElement("div");
      row.className = `module-row ${module.id === selectedTicketModuleId ? "selected" : ""} ${module.visible ? "" : "hidden-module"}`;
      const text = document.createElement("div");
      const title = document.createElement("strong");
      const sub = document.createElement("small");
      const actions = document.createElement("div");
      actions.className = "actions";
      title.textContent = module.label;
      sub.textContent = module.visible ? "显示中" : "已隐藏";
      text.append(title, sub);
      actions.append(
        actionButton(module.visible ? "隐藏" : "显示", () => toggleTicketModule(module.id)),
        actionButton("上移", () => moveTicketModule(module.id, -1)),
        actionButton("下移", () => moveTicketModule(module.id, 1))
      );
      actions.querySelectorAll("button")[1].disabled = index === 0;
      actions.querySelectorAll("button")[2].disabled = index === config.modules.length - 1;
      row.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") return;
        selectedTicketModuleId = module.id;
        renderTicketEditor();
      });
      row.append(text, actions);
      return row;
    });
    replaceChildren($("#ticketModuleList"), rows);
  }

  function renderTicketPreview(requirement, config) {
    refreshDynamicModuleTexts(requirement, config);
    const template = getTemplate(config.templateId);
    const preview = $("#ticketPreview");
    preview.className = `ticket-preview-card ${template.className}`;
    const sections = config.modules
      .filter((module) => module.visible && !(module.id === "waiting" && !module.text.trim()))
      .map(createTicketModuleElement);
    preview.replaceChildren(...sections);
    const overflowIds = measureOverflowModuleIds(preview);
    const validation = validateTicketConfig(config, overflowIds);
    sections.forEach((section) => {
      if (!overflowIds.includes(section.dataset.moduleId)) return;
      section.classList.add("overflow");
      const note = document.createElement("div");
      note.className = "ticket-overflow-note";
      note.textContent = "文字超过 3 行，需缩短或调小字号。";
      section.append(note);
    });
    $("#ticketEditorError").textContent = validation.errors.join("；");
    $("#confirmTicketBtn").disabled = validation.errors.length > 0;
    return validation;
  }

  function createTicketModuleElement(module) {
    const section = document.createElement("section");
    section.className = "ticket-module";
    section.dataset.moduleId = module.id;
    section.style.setProperty("--module-size", `${module.fontSize}px`);
    section.style.setProperty("--module-weight", module.weight);
    section.style.setProperty("--module-align", module.align);
    section.style.setProperty("--module-color", module.color);

    const text = document.createElement("span");
    text.className = "ticket-module-text";
    text.textContent = module.text;
    section.append(text);
    return section;
  }

  function measureOverflowModuleIds(preview) {
    return Array.from(preview.querySelectorAll(".ticket-module")).flatMap((section) => {
      const text = section.querySelector(".ticket-module-text");
      if (!text) return [];
      const computed = window.getComputedStyle(section);
      const lineHeight = parseFloat(computed.lineHeight);
      const textHeight = text.getBoundingClientRect().height;
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return [];
      return textHeight > lineHeight * 3 + 1 ? [section.dataset.moduleId] : [];
    });
  }

  function applyTicketTemplate(templateId) {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const template = getTemplate(templateId);
    const config = ensureTicketConfig(requirement);
    config.templateId = template.id;
    config.modules = config.modules.map((module) => {
      const style = getTemplateStyle(template.id, module.id);
      const def = getModuleDef(module.id);
      const nextText = def.dynamic
        ? module.text
        : module.customText
          ? module.text
          : templateDefaultText(template.id, module.id);
      return {
        ...module,
        ...style,
        text: nextText,
        customText: def.dynamic ? module.customText : Boolean(module.customText),
        sourceText: module.sourceText,
        visible: module.visible,
        manualVisibility: module.manualVisibility
      };
    });
    config.updatedAt = new Date().toISOString();
    saveState();
    renderTicketEditor();
  }

  function updateSelectedModule(patch, markCustomText = false) {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    const module = config.modules.find((item) => item.id === selectedTicketModuleId);
    if (!module) return;
    Object.assign(module, patch);
    if (markCustomText) module.customText = true;
    config.updatedAt = new Date().toISOString();
    saveState();
    updateTicketTextCounter(module);
    renderTicketPreview(requirement, config);
    renderTicketModuleList(requirement, config);
  }

  function updateTicketTextCounter(module) {
    const length = Array.from(module?.text || "").length;
    const limit = moduleTextLimit(module);
    const prefix = isShortTextModule(module) ? "" : "动态文案";
    $("#ticketTextCounter").textContent = `${prefix}还可输入 ${Math.max(0, limit - length)} 字`;
  }

  function resetSelectedModuleContent() {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    const module = config.modules.find((item) => item.id === selectedTicketModuleId);
    if (!module) return;
    module.text = moduleDefaultText(module.id, requirement, config.templateId) || templateDefaultText(config.templateId, module.id);
    module.sourceText = moduleDefaultText(module.id, requirement, config.templateId);
    module.customText = false;
    config.updatedAt = new Date().toISOString();
    saveState();
    renderTicketEditor();
  }

  function saveCurrentTicketAsDefault() {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    state.ticketDefault = {
      templateId: config.templateId,
      modules: config.modules.map((module) => ({ ...module })),
      updatedAt: new Date().toISOString()
    };
    saveState();
    $("#ticketSnapshotSummary").textContent = "已保存为默认样式；之后第一次打开取号单的需求会使用该样式。";
  }

  function moveTicketModule(moduleId, direction) {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    const index = config.modules.findIndex((module) => module.id === moduleId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= config.modules.length) return;
    const [module] = config.modules.splice(index, 1);
    config.modules.splice(targetIndex, 0, module);
    selectedTicketModuleId = moduleId;
    config.updatedAt = new Date().toISOString();
    saveState();
    renderTicketEditor();
  }

  function toggleTicketModule(moduleId) {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    const module = config.modules.find((item) => item.id === moduleId);
    if (!module) return;
    module.visible = !module.visible;
    module.manualVisibility = true;
    selectedTicketModuleId = moduleId;
    config.updatedAt = new Date().toISOString();
    saveState();
    renderTicketEditor();
  }

  function confirmTicketSnapshot() {
    const requirement = currentTicketRequirement();
    if (!requirement) return;
    const config = ensureTicketConfig(requirement);
    refreshDynamicModuleTexts(requirement, config);
    const validation = renderTicketPreview(requirement, config);
    if (validation.errors.length) {
      $("#ticketEditorError").textContent = validation.errors.join("；");
      return;
    }
    const now = new Date().toISOString();
    const display = finalTicketDisplay(config);
    requirement.ticketSnapshots.push({
      id: uid("snap"),
      generatedAt: now,
      requirementId: requirement.id,
      ticketNo: requirement.ticketNo,
      ticketCycle: requirement.ticketCycle || 1,
      templateId: config.templateId,
      moduleOrder: config.modules.map((module) => module.id),
      modules: config.modules.map((module) => ({ ...module })),
      display,
      sourceMeta: buildTicketSourceMeta(requirement)
    });
    config.updatedAt = now;
    requirement.updatedAt = now;
    saveState();
    renderDashboard();
    renderTicketEditor();
  }

  function validateTicketConfig(config, overflowIds = []) {
    const errors = [];
    config.modules.forEach((module) => {
      if (!module.visible) return;
      const length = Array.from(module.text || "").length;
      const limit = moduleTextLimit(module);
      if (isShortTextModule(module) && length > limit) errors.push(`${module.label} 超过 ${limit} 字`);
      if (!isShortTextModule(module) && length > limit) errors.push(`${module.label} 超过 ${limit} 字`);
      if (overflowIds.includes(module.id)) errors.push(`${module.label} 超过 3 行`);
    });
    return { errors: [...new Set(errors)], overflowIds: [...new Set(overflowIds)] };
  }

  function isShortTextModule(module) {
    if (!module) return false;
    return !getModuleDef(module.id).dynamic;
  }

  function moduleTextLimit(module) {
    return isShortTextModule(module) ? SHORT_TEXT_LIMIT : DYNAMIC_TEXT_LIMIT;
  }

  function finalTicketDisplay(config) {
    const byId = Object.fromEntries(config.modules.map((module) => [module.id, module.text]));
    return {
      requirementNameDisplay: byId.requirementName || "",
      departmentsDisplay: byId.departments || "",
      typeDisplay: byId.type || "",
      priorityDisplay: byId.priority || "",
      ticketNo: byId.number || "",
      aheadCountDisplay: byId.ahead || "",
      waitingText: byId.waiting || ""
    };
  }

  function hasTicketChanged(requirement) {
    const latest = latestSnapshot(requirement);
    if (!latest) return false;
    const previous = latest.sourceMeta || {};
    const current = buildTicketSourceMeta(requirement);
    return JSON.stringify(previous) !== JSON.stringify(current);
  }

  function latestSnapshot(requirement) {
    return requirement.ticketSnapshots?.[requirement.ticketSnapshots.length - 1] || null;
  }

  function buildTicketSourceMeta(requirement) {
    return {
      requirementName: requirement.title || "",
      departmentsDisplay: departmentDisplay(requirement),
      typeDisplay: sourceTypeLabel(requirement),
      priorityDisplay: sourcePriorityLabel(requirement),
      aheadCount: ACTIVE_STATUSES.has(requirement.status) ? aheadCount(requirement.id) : null,
      waitingText: waitingDisplayText(requirement.waitingReference)
    };
  }

  function moduleDefaultText(id, requirement, templateId) {
    switch (id) {
      case "departments":
        return departmentDisplay(requirement);
      case "requirementName":
        return requirement.title || "";
      case "type":
        return sourceTypeLabel(requirement);
      case "priority":
        return sourcePriorityLabel(requirement);
      case "number":
        return requirement.ticketNo || "--";
      case "ahead":
        return ACTIVE_STATUSES.has(requirement.status) ? `前方还有 ${aheadCount(requirement.id)} 个需求` : "当前不计入有效队列";
      case "waiting":
        return waitingDisplayText(requirement.waitingReference);
      case "cycle":
        return `第 ${requirement.ticketCycle || 1} 轮`;
      default:
        return templateDefaultText(templateId, id);
    }
  }

  function templateDefaultText(templateId, moduleId) {
    const template = getTemplate(templateId);
    return template.defaults[moduleId] || "";
  }

  function departmentDisplay(requirement) {
    return requirement.departmentIds.map((id) => {
      const department = state.departments.find((entry) => entry.id === id);
      return department ? departmentLabel(department) : "已停用部门";
    }).join(" × ");
  }

  function sourceTypeLabel(requirement) {
    const type = state.types.find((entry) => entry.id === requirement.typeId);
    return type ? typeLabel(type) : "初判已停用";
  }

  function sourcePriorityLabel(requirement) {
    const priority = state.priorities.find((entry) => entry.id === requirement.priorityId);
    return priority ? priorityLabel(priority) : "优先级缺失";
  }

  function getTicketModule(requirement, moduleId) {
    return requirement.ticketConfig?.modules?.find((module) => module.id === moduleId);
  }

  function getTemplate(templateId) {
    return TEMPLATES.find((template) => template.id === templateId) || TEMPLATES[0];
  }

  function getModuleDef(moduleId) {
    return MODULE_DEFS.find((module) => module.id === moduleId) || MODULE_DEFS[0];
  }

  function getTemplateStyle(templateId, moduleId) {
    const template = getTemplate(templateId);
    return template.styles[moduleId] || { fontSize: 16, weight: "400", align: "center", color: "#211f1b" };
  }

  function priorityLabel(priority) {
    return `${priority.name}（${priority.level}）`;
  }

  function departmentLabel(department) {
    return `${department.name}${department.active ? "" : "（已停用）"}`;
  }

  function typeLabel(type) {
    return `${type.prefix} ${type.name}${type.active ? "" : "（已停用）"}`;
  }

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim());
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  globalScope.ticketQueueR001 = {
    getState: () => JSON.parse(JSON.stringify(state)),
    getFilters: () => JSON.parse(JSON.stringify(filters)),
    buildWaitSuggestion: (requirementIds) => {
      const ahead = Array.isArray(requirementIds)
        ? requirementIds.map((id) => findRequirement(id)).filter(Boolean)
        : state.requirements.filter((item) => ACTIVE_STATUSES.has(item.status));
      return buildWaitSuggestion(ahead);
    },
    reset: () => {
      state = defaultState();
      filters = { search: "", departments: [], type: "", priority: "", status: "" };
      currentTicketId = "";
      selectedTicketModuleId = "roast";
      persistAndRender();
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
