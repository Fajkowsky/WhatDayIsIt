// WhatDayIsIt - Background Service Worker
// Manages per-tab badge counts on the extension icon

const tabCounts = new Map();
let settingsRevision = 0;

chrome.runtime.onMessage.addListener((message, sender) => {
  if (
    message?.action === 'updateBadge' &&
    Number.isInteger(sender?.tab?.id) &&
    Number.isInteger(message.count) &&
    message.count >= 0
  ) {
    const tabId = sender.tab.id;
    const count = message.count;
    tabCounts.set(tabId, count);
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabCounts.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabCounts.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' || !changes.enabled) return;
  const revision = ++settingsRevision;
  if (changes.enabled.newValue !== false) return;
  chrome.tabs.query({}, (tabs) => {
    if (revision !== settingsRevision) return;
    for (const tab of tabs || []) {
      if (!Number.isInteger(tab.id)) continue;
      tabCounts.delete(tab.id);
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  });
});
