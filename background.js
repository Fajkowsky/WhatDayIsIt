// WhatDayIsIt - Background Service Worker
// Manages per-tab badge counts on the extension icon

const tabCounts = new Map();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'updateBadge' && sender.tab) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
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
