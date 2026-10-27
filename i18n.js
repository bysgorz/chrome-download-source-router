const UI_MESSAGES = {
  zh_CN: {
    optionsTitle: "下载来源路径设置", subtitle: "网址只用于提取域名；路径相对于 Chrome 的默认下载目录。子域名配置优先于主域名。",
    addRule: "＋ 添加规则", language: "界面语言", languageHelp: "选择设置页和插件弹窗使用的语言。", chinese: "中文", english: "English",
    distinguishPorts: "区分端口", portsHelp: "开启后，localhost:3000 与 localhost:8080 可以分别配置不同目录。",
    backup: "备份与恢复", backupHelp: "将规则导出为 JSON 文件，或从备份文件合并导入。来源相同但路径或 Tag 不同时，可逐项选择需要保留的值。",
    importConfig: "导入配置", exportConfig: "导出配置", source: "来源网页网址或域名", path: "相对存放路径", tag: "Tag",
    empty: "尚未配置规则。所有下载均使用浏览器原本的路径。", save: "保存设置", remove: "删除", removeTitle: "删除此规则",
    sourcePlaceholder: "例如：example.com 或 localhost:3000", pathPlaceholder: "例如：工作/Example（留空则保持原路径）",
    popupTitle: "按来源网页归档下载", popupDescription: "根据发起下载网页的域名，保存到默认下载目录下的指定子目录。", openOptions: "打开路径设置",
    sourceRequired: "请填写来源网址或域名", sourceInvalid: "网址或域名格式无效", hostnameInvalid: "请填写有效域名、localhost 或 IP 地址",
    pathPartsInvalid: "路径不能包含空目录、. 或 ..", pathCharsInvalid: "路径含有 Windows 文件名不允许的字符",
    tagTooLong: "Tag 不能超过 50 个字符", tagControl: "Tag 不能包含控制字符", ruleCount: "{count} 条规则",
    conflictTitle: "{field}存在冲突，请选择：", currentConfig: "当前配置", importedConfig: "导入配置", emptyValue: "（空）",
    conflictHeading: "导入配置与当前配置存在差异，需要逐项选择后才能保存此规则。", pathField: "存放路径",
    duplicate: "该域名与端口已配置，请勿重复添加", fixRules: "请修正规则后再继续", invalidConfig: "配置文件内容无效",
    unsupportedVersion: "不支持的配置版本：{version}", missingConfig: "配置文件缺少有效的规则或端口设置", invalidRule: "第 {index} 条规则格式无效",
    invalidRuleSource: "第 {index} 条规则的域名或端口无效", duplicateImported: "第 {index} 条规则与前面的规则重复",
    exported: "已导出 {count} 条规则", fileTooLarge: "配置文件不能超过 1 MB", importedSummary: "已新增 {imported} 条规则（黄色标记），发现 {conflicts} 条冲突规则（红色标记），保留本地 {retained} 条；请处理冲突后保存",
    importFailed: "导入失败：{message}", invalidJson: "配置文件不是有效的 JSON", fixBeforeSave: "请修正规则后再保存",
    partialSaved: "已成功保存 {saved} 条无冲突配置，剩余 {remaining} 条冲突配置未解决", saved: "已保存 {count} 条规则"
  },
  en: {
    optionsTitle: "Download Source Routing", subtitle: "URLs are used only to extract hostnames. Paths are relative to Chrome's default download folder. More specific subdomains take priority.",
    addRule: "+ Add rule", language: "Interface language", languageHelp: "Choose the language used by the options page and extension popup.", chinese: "中文", english: "English",
    distinguishPorts: "Distinguish ports", portsHelp: "When enabled, localhost:3000 and localhost:8080 can use different folders.",
    backup: "Backup and restore", backupHelp: "Export rules to JSON or merge a backup. When the same source has a different path or Tag, choose each value individually.",
    importConfig: "Import", exportConfig: "Export", source: "Source URL or hostname", path: "Relative destination path", tag: "Tag",
    empty: "No rules configured. Downloads will use the browser's original path.", save: "Save settings", remove: "Delete", removeTitle: "Delete this rule",
    sourcePlaceholder: "e.g. example.com or localhost:3000", pathPlaceholder: "e.g. Work/Example (leave blank to keep original path)",
    popupTitle: "Route Downloads by Source", popupDescription: "Save downloads to subfolders based on the hostname of the page that started them.", openOptions: "Open path settings",
    sourceRequired: "Enter a source URL or hostname", sourceInvalid: "Invalid URL or hostname", hostnameInvalid: "Enter a valid domain, localhost, or IP address",
    pathPartsInvalid: "The path cannot contain empty folders, . or ..", pathCharsInvalid: "The path contains characters not allowed in Windows filenames",
    tagTooLong: "Tag cannot exceed 50 characters", tagControl: "Tag cannot contain control characters", ruleCount: "{count} rules",
    conflictTitle: "{field} conflict — choose one:", currentConfig: "Current", importedConfig: "Imported", emptyValue: "(empty)",
    conflictHeading: "The imported and current configurations differ. Resolve each field before saving this rule.", pathField: "Destination path",
    duplicate: "This hostname and port are already configured", fixRules: "Fix the rules before continuing", invalidConfig: "Invalid configuration file",
    unsupportedVersion: "Unsupported configuration version: {version}", missingConfig: "The configuration is missing valid rules or port settings", invalidRule: "Rule {index} has an invalid format",
    invalidRuleSource: "Rule {index} has an invalid hostname or port", duplicateImported: "Rule {index} duplicates an earlier rule",
    exported: "Exported {count} rules", fileTooLarge: "The configuration file cannot exceed 1 MB", importedSummary: "Added {imported} rules (yellow), found {conflicts} conflicts (red), and retained {retained} local rules. Resolve conflicts, then save.",
    importFailed: "Import failed: {message}", invalidJson: "The configuration file is not valid JSON", fixBeforeSave: "Fix the rules before saving",
    partialSaved: "Saved {saved} conflict-free rules; {remaining} conflicts remain unresolved", saved: "Saved {count} rules"
  }
};

let currentLanguage = "zh_CN";
function uiText(key, values = {}) {
  const template = UI_MESSAGES[currentLanguage]?.[key] ?? UI_MESSAGES.zh_CN[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}
function applyPageLanguage(language) {
  currentLanguage = language === "en" ? "en" : "zh_CN";
  document.documentElement.lang = currentLanguage === "en" ? "en" : "zh-CN";
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = uiText(element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = uiText(element.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const value = uiText(element.dataset.i18nTitle);
    element.title = value;
    element.setAttribute("aria-label", value);
  });
  document.title = uiText(document.body.classList.contains("popup") ? "popupTitle" : "optionsTitle");
}
async function initializeLanguage() {
  const result = await chrome.storage.local.get({ interfaceLanguage: "" });
  const browserLanguage = chrome.i18n.getUILanguage().toLowerCase().startsWith("zh") ? "zh_CN" : "en";
  applyPageLanguage(result.interfaceLanguage || browserLanguage);
  return currentLanguage;
}
