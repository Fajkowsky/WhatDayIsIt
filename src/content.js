// WhatDayIsIt - Content Script
// Highlights dates on web pages and shows day of week

import { getDatePatterns } from './patterns/index.js';
// ^ This import is resolved at build time
import { parseDate } from './date-parser.js';

// Configuration
const CONFIG = {
  BATCH_SIZE: 50,
  MAX_NODES: 50000,
  IDLE_TIMEOUT: 2000,
  DEBUG: false,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Settings
let iconPosition = 'after'; // 'before' or 'after'
let highlightEnabled = true; // Whether to show yellow background
let isEnabled = true;
let runId = 0;
const pendingIdleWork = new Set();
let settingsReadId = 0;
let settingsInitialized = false;

function getDayName(date) {
  return DAY_NAMES[date.getDay()];
}

function injectStyles() {
  if (document.getElementById('date-highlighter-styles')) return;
  const style = document.createElement('style');
  style.id = 'date-highlighter-styles';
  style.textContent = `
    .date-hl {
      background: #fff3cd;
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
      cursor: default;
    }
    .date-hl-no-bg {
      background: transparent;
      color: inherit;
      padding: 0;
      cursor: default;
    }
    .date-hl-icon {
      display: inline-block;
      margin: 0 2px;
      cursor: help;
      position: relative;
      font-style: normal;
      background: transparent;
    }
    .date-hl-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      z-index: 10000;
      pointer-events: none;
    }
    .date-hl-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #333;
    }
    .date-hl-icon:hover .date-hl-tooltip {
      opacity: 1;
      visibility: visible;
    }
  `;
  document.head.appendChild(style);
}

function removeStyles() {
  const style = document.getElementById('date-highlighter-styles');
  if (style) style.remove();
}

function createCombinedPattern(patterns) {
  return new RegExp(patterns.map((p) => `(${p.source})`).join('|'), 'gi');
}

function getTextNodes() {
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    if (text && text.trim().length > 0) {
      const parent = node.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) {
        nodes.push(node);
      }
    }
  }
  return nodes;
}

function createIcon(dayName) {
  const icon = document.createElement('span');
  icon.className = 'date-hl-icon';
  icon.append(document.createTextNode('🗓'));
  const tooltip = document.createElement('span');
  tooltip.className = 'date-hl-tooltip';
  tooltip.textContent = dayName;
  icon.append(tooltip);
  return icon;
}

function highlightNode(textNode, pattern, locale) {
  const text = textNode.textContent;
  pattern.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let found = 0;
  let match;
  while ((match = pattern.exec(text))) {
    const date = parseDate(match[0], locale);
    if (!date) continue;
    fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
    const mark = document.createElement('mark');
    mark.className = highlightEnabled ? 'date-hl' : 'date-hl-no-bg';
    mark.textContent = match[0];
    const icon = createIcon(getDayName(date));
    if (iconPosition === 'before') fragment.append(icon);
    fragment.append(mark);
    if (iconPosition !== 'before') fragment.append(icon);
    lastIndex = match.index + match[0].length;
    found++;
  }
  if (!found) return 0;
  fragment.append(document.createTextNode(text.slice(lastIndex)));
  textNode.parentNode.replaceChild(fragment, textNode);
  return found;
}

function processBatch(nodes, pattern, locale, currentRun) {
  let count = 0;
  withObserverPaused(() => {
    for (const node of nodes) {
      if (currentRun !== runId) break;
      if (!node.isConnected || !node.parentNode) continue;
      if (node.parentElement?.closest('.date-hl, .date-hl-no-bg')) continue;
      count += highlightNode(node, pattern, locale);
    }
  });
  return count;
}

function scheduleIdleWork(callback) {
  return new Promise((resolve) => {
    let handle;
    let isIdleCallback = false;
    let settled = false;
    const settle = () => {
      pendingIdleWork.delete(cancel);
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    const cancel = () => {
      if (settled) return;
      if (isIdleCallback && window.cancelIdleCallback) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
      settle();
    };
    pendingIdleWork.add(cancel);
    if (window.requestIdleCallback) {
      isIdleCallback = true;
      handle = window.requestIdleCallback(
        (deadline) => {
          if (settled) return;
          try {
            callback(deadline);
          } finally {
            settle();
          }
        },
        { timeout: CONFIG.IDLE_TIMEOUT }
      );
    } else {
      handle = setTimeout(() => {
        if (settled) return;
        try {
          callback({ timeRemaining: () => 50 });
        } finally {
          settle();
        }
      }, 1);
    }
  });
}

function cancelPendingIdleWork() {
  for (const cancel of [...pendingIdleWork]) cancel();
}

async function processNodesInChunks(nodes, pattern, locale, currentRun) {
  let totalCount = 0;
  let index = 0;
  while (index < nodes.length && currentRun === runId) {
    await scheduleIdleWork((deadline) => {
      if (currentRun !== runId) return;
      const startTime = performance.now();
      while (index < nodes.length && deadline.timeRemaining() > 0) {
        const batch = nodes.slice(index, index + CONFIG.BATCH_SIZE);
        totalCount += processBatch(batch, pattern, locale, currentRun);
        index += CONFIG.BATCH_SIZE;
        if (performance.now() - startTime > 50) break;
      }
    });
  }
  return totalCount;
}

/**
 * Removes all date highlights from the page
 */
function removeHighlights(sendCount = true) {
  withObserverPaused(() => {
    // Remove icons first
    const icons = document.querySelectorAll('.date-hl-icon');
    icons.forEach((icon) => icon.remove());

    // Remove highlight marks
    const highlights = document.querySelectorAll('.date-hl, .date-hl-no-bg');
    highlights.forEach((mark) => {
      const textContent = mark.textContent || '';
      const textNode = document.createTextNode(textContent);
      mark.parentNode?.replaceChild(textNode, mark);
    });
  });
  removeStyles();
  if (sendCount) updateBadgeCount(0);
  console.log('Date highlighter: highlights removed');
}

function updateBadgeCount(count) {
  chrome.runtime.sendMessage({ action: 'updateBadge', count }).catch(() => {});
}

async function highlightDates() {
  cancelPendingIdleWork();
  const currentRun = ++runId;
  if (!isEnabled) return;
  const startTime = performance.now();
  injectStyles();
  const patterns = getDatePatterns();
  const combinedPattern = createCombinedPattern(patterns);
  const locale =
    new URLSearchParams(window.location.search).get('locale') ||
    document.documentElement?.lang ||
    navigator.language ||
    'en';
  const textNodes = getTextNodes();

  if (textNodes.length > CONFIG.MAX_NODES) {
    console.warn(
      `Date highlighter: Skipping page with ${textNodes.length} text nodes (max: ${CONFIG.MAX_NODES})`
    );
    if (currentRun === runId) updateBadgeCount(0);
    return;
  }

  let count;
  if (textNodes.length > CONFIG.BATCH_SIZE * 2) {
    count = await processNodesInChunks(textNodes, combinedPattern, locale, currentRun);
  } else {
    count = processBatch(textNodes, combinedPattern, locale, currentRun);
  }

  if (currentRun !== runId || !isEnabled) return;

  const duration = (performance.now() - startTime).toFixed(2);

  const badgeCount = document.querySelectorAll('.date-hl, .date-hl-no-bg').length;
  updateBadgeCount(badgeCount);

  if (CONFIG.DEBUG) {
    console.log(`Date highlighter stats:`, {
      textNodes: textNodes.length,
      matches: count,
      patterns: patterns.length,
      duration: `${duration}ms`,
    });
  } else {
    console.log(`Date highlighter: ${count} dates found in ${duration}ms`);
  }
}

// MutationObserver for SPA support
let observer = null;
let debounceTimer = null;

function withObserverPaused(callback) {
  if (observer) observer.disconnect();
  callback();
  if (observer && document.body) {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

function startObserver() {
  if (observer) return;

  const debouncedHighlight = debounce(() => {
    if (!isEnabled) return;
    runId++;
    cancelPendingIdleWork();
    removeHighlights(false);
    highlightDates();
  }, 300);

  observer = new MutationObserver((mutations) => {
    // Extension writes are paused, so every delivered mutation belongs to the page.
    if (mutations.length) debouncedHighlight();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  console.log('Date highlighter: observing for dynamic content');
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    clearTimeout(debounceTimer);
  }
}

let readyHandler = null;

function startWhenReady() {
  if (readyHandler) document.removeEventListener('DOMContentLoaded', readyHandler);
  const start = () => {
    readyHandler = null;
    if (!isEnabled) return;
    highlightDates();
    startObserver();
  };
  if (document.readyState === 'loading') {
    readyHandler = start;
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

function applySettings(settings, force = false) {
  const enabled = settings.enabled !== false;
  const changed =
    enabled !== isEnabled ||
    (settings.highlightEnabled !== undefined && settings.highlightEnabled !== highlightEnabled) ||
    (settings.iconPosition !== undefined && settings.iconPosition !== iconPosition);
  if (settings.highlightEnabled !== undefined) highlightEnabled = settings.highlightEnabled;
  if (settings.iconPosition === 'before' || settings.iconPosition === 'after')
    iconPosition = settings.iconPosition;
  if (!changed && !force) return;
  isEnabled = enabled;
  runId++;
  cancelPendingIdleWork();
  if (!enabled) {
    if (readyHandler) {
      document.removeEventListener('DOMContentLoaded', readyHandler);
      readyHandler = null;
    }
    stopObserver();
    removeHighlights();
  } else {
    removeHighlights(false);
    startWhenReady();
  }
}

function readSettings() {
  const readId = ++settingsReadId;
  chrome.storage.sync.get(['enabled', 'highlightEnabled', 'iconPosition'], (settings) => {
    if (readId !== settingsReadId) return;
    const forceStartup = !settingsInitialized;
    settingsInitialized = true;
    applySettings(settings, forceStartup);
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  const settings = {};
  for (const key of ['enabled', 'highlightEnabled', 'iconPosition']) {
    if (changes[key]) settings[key] = changes[key].newValue;
  }
  if (Object.keys(settings).length) readSettings();
});

readSettings();
