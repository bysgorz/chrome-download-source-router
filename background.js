const STORAGE_KEY = "downloadSourceRules";
const lastKnownTabUrls = new Map();

function rememberTabUrl(tabId, value) {
  if (!Number.isInteger(tabId) || tabId < 0 || !sourceFromUrl(value)) return;
  lastKnownTabUrls.set(tabId, value);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  rememberTabUrl(tabId, changeInfo.url || tab.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  lastKnownTabUrls.delete(tabId);
});

function sourceFromUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return {
      hostname: url.hostname.toLowerCase().replace(/^\.+|\.+$/g, ""),
      port: url.port
    };
  } catch {
    return null;
  }
}

function findRule(source, rules, distinguishPorts) {
  if (!source?.hostname) return null;

  return rules
    .filter((rule) => {
      const domainMatches = source.hostname === rule.hostname ||
        source.hostname.endsWith(`.${rule.hostname}`);
      const portMatches = !distinguishPorts || source.port === (rule.port || "");
      return domainMatches && portMatches;
    })
    .sort((a, b) => b.hostname.length - a.hostname.length)[0] || null;
}

function basename(filename) {
  return filename.split(/[\\/]/).pop() || "download";
}

async function resolveDownloadSource(item) {
  const referrerSource = sourceFromUrl(item.referrer);
  if (referrerSource) return { ...referrerSource, method: "referrer" };

  if (Number.isInteger(item.tabId) && item.tabId >= 0) {
    try {
      const tab = await chrome.tabs.get(item.tabId);
      rememberTabUrl(item.tabId, tab.url || tab.pendingUrl);
      const tabSource = sourceFromUrl(tab.url || tab.pendingUrl);
      if (tabSource) return { ...tabSource, method: "tab" };
    } catch {
      // 标签页可能在下载事件处理前已经关闭。
    }

    const rememberedSource = sourceFromUrl(lastKnownTabUrls.get(item.tabId));
    if (rememberedSource) return { ...rememberedSource, method: "tab-history" };
  }

  // 某些网站通过隐藏 iframe、Service Worker 或临时页面触发下载，Chrome
  // 会把 tabId 置为 -1。此时以当前活动网页作为最后兜底。
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const activeTab = tabs[0];
    const activeSource = sourceFromUrl(activeTab?.url || activeTab?.pendingUrl);
    if (activeSource) return { ...activeSource, method: "active-tab" };
  } catch {
    // 无可访问的活动标签页时保持原下载路径。
  }

  return null;
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  Promise.all([
    chrome.storage.local.get({ [STORAGE_KEY]: [], distinguishPorts: false }),
    resolveDownloadSource(item)
  ]).then(([result, source]) => {
    const rule = findRule(source, result[STORAGE_KEY], result.distinguishPorts);

    chrome.storage.local.set({
      lastDownloadDecision: {
        time: new Date().toISOString(),
        source: source ? `${source.hostname}${source.port ? `:${source.port}` : ""}` : "",
        method: source?.method || "none",
        matchedRule: rule ? `${rule.hostname}${rule.port ? `:${rule.port}` : ""}` : "",
        path: rule?.path || "",
        rawReferrer: item.referrer || "",
        rawUrl: item.url || "",
        rawFinalUrl: item.finalUrl || "",
        tabId: item.tabId
      }
    });

    if (!rule || !rule.path) {
      suggest();
      return;
    }

    suggest({
      filename: `${rule.path}/${basename(item.filename)}`,
      conflictAction: "uniquify"
    });
  }).catch((error) => {
    chrome.storage.local.set({
      lastDownloadDecision: {
        time: new Date().toISOString(),
        source: "",
        method: "error",
        matchedRule: "",
        path: "",
        error: error?.message || String(error)
      }
    });
    suggest();
  });

  return true;
});
