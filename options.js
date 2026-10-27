const STORAGE_KEY = "downloadSourceRules";
const rulesElement = document.querySelector("#rules");
const emptyElement = document.querySelector("#empty");
const template = document.querySelector("#rule-template");
const groupTemplate = document.querySelector("#tag-group-template");
const statusElement = document.querySelector("#status");
const distinguishPortsElement = document.querySelector("#distinguish-ports");
const languageElement = document.querySelector("#interface-language");
const importFileElement = document.querySelector("#import-file");
const CONFIG_VERSION = 1;

function normalizeSource(value, distinguishPorts) {
  let input = value.trim();
  if (!input) throw new Error(uiText("sourceRequired"));

  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(uiText("sourceInvalid"));
  }

  const hostname = url.hostname.toLowerCase().replace(/^\.+|\.+$/g, "");
  const isLocalhost = hostname === "localhost";
  const isIpv6 = hostname.startsWith("[") && hostname.endsWith("]");
  if (!hostname || (!hostname.includes(".") && !isLocalhost && !isIpv6) || hostname.includes("..")) {
    throw new Error(uiText("hostnameInvalid"));
  }
  return {
    hostname,
    port: distinguishPorts ? url.port : ""
  };
}

function normalizePath(value) {
  const path = value.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!path) return "";

  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error(uiText("pathPartsInvalid"));
  }
  if (/[<>:"|?*\u0000-\u001f]/.test(path)) {
    throw new Error(uiText("pathCharsInvalid"));
  }
  return parts.join("/");
}

function normalizeTag(value) {
  const tag = String(value ?? "").trim() || "default";
  if (tag.length > 50) throw new Error(uiText("tagTooLong"));
  if (/\p{C}/u.test(tag)) throw new Error(uiText("tagControl"));
  return tag;
}

function updateEmptyState() {
  emptyElement.hidden = Boolean(rulesElement.querySelector(".rule"));
}

function updateGroup(group) {
  const count = group.querySelectorAll(".rule").length;
  if (!count) {
    group.remove();
    return;
  }
  group.querySelector(".tag-count").textContent = uiText("ruleCount", { count });
}

function getOrCreateGroup(tag) {
  const existing = [...rulesElement.querySelectorAll(":scope > .tag-group")]
    .find((group) => group.dataset.tag === tag);
  if (existing) return existing;

  const fragment = groupTemplate.content.cloneNode(true);
  const group = fragment.querySelector(".tag-group");
  group.dataset.tag = tag;
  group.querySelector(".tag-name").textContent = tag;
  rulesElement.append(group);
  return group;
}

function moveRuleToTag(row) {
  const oldGroup = row.closest(".tag-group");
  const tagInput = row.querySelector(".tag");
  const tag = normalizeTag(tagInput.value);
  tagInput.value = tag;
  row.classList.remove("invalid");
  row.querySelector(".error").textContent = "";
  const newGroup = getOrCreateGroup(tag);
  newGroup.querySelector(".tag-rules").append(row);
  updateGroup(newGroup);
  if (oldGroup !== newGroup) updateGroup(oldGroup);
  updateEmptyState();
}

function addRule(rule = { hostname: "", path: "", tag: "default" }) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector(".rule");
  row.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = uiText(element.dataset.i18n); });
  row.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = uiText(element.dataset.i18nPlaceholder); });
  row.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const value = uiText(element.dataset.i18nTitle);
    element.title = value;
    element.setAttribute("aria-label", value);
  });
  const tag = normalizeTag(rule.tag);
  row.querySelector(".source").value = rule.port ? `${rule.hostname}:${rule.port}` : rule.hostname;
  row.querySelector(".path").value = rule.path;
  row.querySelector(".tag").value = tag;
  row.querySelector(".tag").addEventListener("change", () => {
    try {
      moveRuleToTag(row);
    } catch (error) {
      row.classList.add("invalid");
      row.querySelector(".error").textContent = error.message;
    }
  });
  row.querySelector(".remove").addEventListener("click", () => {
    const group = row.closest(".tag-group");
    row.remove();
    updateGroup(group);
    updateEmptyState();
  });
  const group = getOrCreateGroup(tag);
  group.querySelector(".tag-rules").append(row);
  updateGroup(group);
  updateEmptyState();
  return row;
}

function addConflictChoice(container, row, field, label, localValue, importedValue) {
  const item = document.createElement("div");
  item.className = "conflict-item";
  const title = document.createElement("strong");
  title.textContent = uiText("conflictTitle", { field: label });
  item.append(title);

  for (const [source, value] of [["local", localValue], ["imported", importedValue]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conflict-choice";
    button.textContent = `${uiText(source === "local" ? "currentConfig" : "importedConfig")}: ${value || uiText("emptyValue")}`;
    button.addEventListener("click", () => {
      item.querySelectorAll(".conflict-choice").forEach((choice) => choice.classList.remove("selected"));
      button.classList.add("selected");
      item.dataset.resolved = "true";
      const input = row.querySelector(`.${field}`);
      input.value = value;
      input.readOnly = false;
      if ([...container.querySelectorAll(".conflict-item")].every((entry) => entry.dataset.resolved === "true")) {
        row.classList.remove("conflict-rule");
        row.classList.add("imported-rule");
        row.querySelector(".source").readOnly = false;
        container.hidden = true;
        moveRuleToTag(row);
      }
    });
    item.append(button);
  }
  container.append(item);
  row.querySelector(`.${field}`).readOnly = true;
}

function markConflict(row, localRule, importedRule) {
  row.classList.add("conflict-rule");
  row.localRuleBeforeConflict = { ...localRule };
  row.querySelector(".source").readOnly = true;
  const panel = document.createElement("div");
  panel.className = "conflict-panel";
  const heading = document.createElement("div");
  heading.className = "conflict-heading";
  heading.textContent = uiText("conflictHeading");
  panel.append(heading);
  if (localRule.path !== importedRule.path) {
    addConflictChoice(panel, row, "path", uiText("pathField"), localRule.path, importedRule.path);
  }
  if (localRule.tag !== importedRule.tag) {
    addConflictChoice(panel, row, "tag", "Tag", localRule.tag, importedRule.tag);
  }
  row.append(panel);
}

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("status-error", isError);
}

function collectRules(distinguishPorts, { skipUnresolved = false } = {}) {
  const rows = [...rulesElement.querySelectorAll(".rule")];
  const seen = new Set();
  const rules = [];
  let hasError = false;

  for (const row of rows) {
    if (row.classList.contains("conflict-rule")) {
      if (skipUnresolved) continue;
      hasError = true;
      continue;
    }
    const errorElement = row.querySelector(".error");
    errorElement.textContent = "";
    row.classList.remove("invalid");

    try {
      const source = normalizeSource(row.querySelector(".source").value, distinguishPorts);
      const path = normalizePath(row.querySelector(".path").value);
      const tag = normalizeTag(row.querySelector(".tag").value);
      const matchKey = `${source.hostname}:${source.port}`;
      if (seen.has(matchKey)) throw new Error(uiText("duplicate"));
      seen.add(matchKey);
      rules.push({ hostname: source.hostname, port: source.port, path, tag });
      row.querySelector(".source").value = source.port ? `${source.hostname}:${source.port}` : source.hostname;
      row.querySelector(".path").value = path;
      row.querySelector(".tag").value = tag;
      moveRuleToTag(row);
    } catch (error) {
      row.classList.add("invalid");
      errorElement.textContent = error.message;
      hasError = true;
    }
  }

  if (hasError) throw new Error(uiText("fixRules"));
  return rules;
}

function validateImportedConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(uiText("invalidConfig"));
  }
  if (config.version !== CONFIG_VERSION) {
    throw new Error(uiText("unsupportedVersion", { version: String(config.version ?? "-") }));
  }
  if (typeof config.distinguishPorts !== "boolean" || !Array.isArray(config.rules)) {
    throw new Error(uiText("missingConfig"));
  }

  const seen = new Set();
  const rules = config.rules.map((rule, index) => {
    if (!rule || typeof rule !== "object" ||
        typeof rule.hostname !== "string" || typeof rule.port !== "string" || typeof rule.path !== "string" ||
        (rule.tag !== undefined && typeof rule.tag !== "string")) {
      throw new Error(uiText("invalidRule", { index: index + 1 }));
    }
    const sourceText = rule.port ? `${rule.hostname}:${rule.port}` : rule.hostname;
    const source = normalizeSource(sourceText, config.distinguishPorts);
    const expectedHostname = rule.hostname.toLowerCase().replace(/^\.+|\.+$/g, "");
    if (source.hostname !== expectedHostname || (!config.distinguishPorts && rule.port)) {
      throw new Error(uiText("invalidRuleSource", { index: index + 1 }));
    }
    const path = normalizePath(rule.path);
    const matchKey = `${source.hostname}:${source.port}`;
    if (seen.has(matchKey)) throw new Error(uiText("duplicateImported", { index: index + 1 }));
    seen.add(matchKey);
    const tag = normalizeTag(rule.tag);
    return { hostname: source.hostname, port: source.port, path, tag };
  });

  return { distinguishPorts: config.distinguishPorts, rules };
}

function exportConfig() {
  try {
    const distinguishPorts = distinguishPortsElement.checked;
    const rules = collectRules(distinguishPorts);
    const config = { version: CONFIG_VERSION, distinguishPorts, rules };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `download-source-router-${date}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus(uiText("exported", { count: rules.length }));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function importConfig(file) {
  try {
    if (!file) return;
    if (file.size > 1024 * 1024) throw new Error(uiText("fileTooLarge"));
    const config = validateImportedConfig(JSON.parse(await file.text()));
    const stored = await chrome.storage.local.get({
      [STORAGE_KEY]: [],
      distinguishPorts: false
    });
    const localConfig = validateImportedConfig({
      version: CONFIG_VERSION,
      distinguishPorts: stored.distinguishPorts,
      rules: stored[STORAGE_KEY]
    });

    const mergedEntries = [];
    const mergedKeys = new Set();
    let retainedCount = 0;
    let conflictCount = 0;
    let importedCount = 0;

    for (const localRule of localConfig.rules) {
      const sourceText = localRule.port ? `${localRule.hostname}:${localRule.port}` : localRule.hostname;
      const source = normalizeSource(sourceText, config.distinguishPorts);
      const key = `${source.hostname}:${source.port}`;
      if (mergedKeys.has(key)) continue;
      mergedKeys.add(key);
      mergedEntries.push({
        rule: { ...localRule, hostname: source.hostname, port: source.port },
        imported: false,
        key
      });
      retainedCount += 1;
    }

    for (const importedRule of config.rules) {
      const key = `${importedRule.hostname}:${importedRule.port}`;
      if (mergedKeys.has(key)) {
        const entry = mergedEntries.find((item) => item.key === key);
        if (entry && (entry.rule.path !== importedRule.path || entry.rule.tag !== importedRule.tag)) {
          entry.conflict = importedRule;
          conflictCount += 1;
        }
        continue;
      }
      mergedKeys.add(key);
      mergedEntries.push({ rule: importedRule, imported: true, key });
      importedCount += 1;
    }

    rulesElement.replaceChildren();
    distinguishPortsElement.checked = config.distinguishPorts;
    mergedEntries.forEach((entry) => {
      const row = addRule(entry.rule);
      if (entry.imported) row.classList.add("imported-rule");
      if (entry.conflict) markConflict(row, entry.rule, entry.conflict);
    });
    updateEmptyState();
    setStatus(uiText("importedSummary", { imported: importedCount, conflicts: conflictCount, retained: retainedCount }));
  } catch (error) {
    const message = error instanceof SyntaxError ? uiText("invalidJson") : error.message;
    setStatus(uiText("importFailed", { message }), true);
  } finally {
    importFileElement.value = "";
  }
}

async function load() {
  const result = await chrome.storage.local.get({
    [STORAGE_KEY]: [],
    distinguishPorts: false
  });
  distinguishPortsElement.checked = result.distinguishPorts;
  result[STORAGE_KEY].forEach(addRule);
  updateEmptyState();
}

async function save() {
  setStatus("");
  const distinguishPorts = distinguishPortsElement.checked;
  let rules;
  try {
    rules = collectRules(distinguishPorts, { skipUnresolved: true });
  } catch (error) {
    setStatus(uiText("fixBeforeSave"), true);
    return;
  }

  const unresolvedRows = [...rulesElement.querySelectorAll(".conflict-rule")];
  const unresolvedLocalRules = unresolvedRows.map((row) => row.localRuleBeforeConflict);
  await chrome.storage.local.set({
    [STORAGE_KEY]: [...rules, ...unresolvedLocalRules],
    distinguishPorts
  });
  rulesElement.querySelectorAll(".imported-rule").forEach((row) => {
    row.classList.remove("imported-rule");
  });
  const unresolvedCount = unresolvedRows.length;
  if (unresolvedCount) {
    setStatus(uiText("partialSaved", { saved: rules.length, remaining: unresolvedCount }), true);
    return;
  }
  setStatus(uiText("saved", { count: rules.length }));
  setTimeout(() => {
    if (statusElement.textContent === uiText("saved", { count: rules.length })) statusElement.textContent = "";
  }, 2500);
}

document.querySelector("#add").addEventListener("click", () => addRule());
document.querySelector("#save").addEventListener("click", save);
document.querySelector("#export").addEventListener("click", exportConfig);
document.querySelector("#import").addEventListener("click", () => importFileElement.click());
importFileElement.addEventListener("change", () => importConfig(importFileElement.files[0]));
languageElement.addEventListener("change", async () => {
  await chrome.storage.local.set({ interfaceLanguage: languageElement.value });
  applyPageLanguage(languageElement.value);
  document.querySelectorAll(".tag-group").forEach(updateGroup);
  setStatus("");
});

initializeLanguage().then((language) => {
  languageElement.value = language;
  load();
});
