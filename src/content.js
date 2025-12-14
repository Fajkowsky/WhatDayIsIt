// WhatDayIsIt - Content Script
// Highlights dates on web pages and shows day of week

import { getDatePatterns } from './patterns/index.js';
// ^ This import is resolved at build time

// Configuration
const CONFIG = {
  BATCH_SIZE: 50,
  MAX_NODES: 50000,
  IDLE_TIMEOUT: 2000,
  DEBUG: false,
};

// Month name mappings for date parsing
const MONTHS_EN = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const MONTHS_PL = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  września: 8,
  października: 9,
  listopada: 10,
  grudnia: 11,
  styczeń: 0,
  luty: 1,
  marzec: 2,
  kwiecień: 3,
  maj: 4,
  czerwiec: 5,
  lipiec: 6,
  sierpień: 7,
  wrzesień: 8,
  październik: 9,
  listopad: 10,
  grudzień: 11,
  sty: 0,
  lut: 1,
  mar: 2,
  kwi: 3,
  cze: 5,
  lip: 6,
  sie: 7,
  wrz: 8,
  paź: 9,
  lis: 10,
  gru: 11,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Settings
let iconPosition = 'after'; // 'before' or 'after'
let highlightEnabled = true; // Whether to show yellow background

function parseDate(dateStr) {
  const str = dateStr.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (['today', 'dzisiaj', 'dziś'].includes(str)) return today;
  if (['tomorrow', 'jutro'].includes(str)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (['yesterday', 'wczoraj'].includes(str)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  const numericMatch = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (numericMatch) {
    const [, first, second, yearStr] = numericMatch;
    let year = parseInt(yearStr);
    if (year < 100) year += 2000;
    const separator = dateStr.match(/[./-]/)[0];
    let day, month;
    if (parseInt(first) > 12) {
      day = parseInt(first);
      month = parseInt(second) - 1;
    } else if (separator === '.') {
      day = parseInt(first);
      month = parseInt(second) - 1;
    } else {
      month = parseInt(first) - 1;
      day = parseInt(second);
    }
    return new Date(year, month, day);
  }

  for (const [monthName, monthNum] of Object.entries(MONTHS_EN)) {
    const regex1 = new RegExp(`${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, 'i');
    const regex2 = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthName}\\s+(\\d{4})`, 'i');
    const regex3 = new RegExp(`${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)`, 'i');
    let match = dateStr.match(regex1);
    if (match) return new Date(parseInt(match[2]), monthNum, parseInt(match[1]));
    match = dateStr.match(regex2);
    if (match) return new Date(parseInt(match[2]), monthNum, parseInt(match[1]));
    match = dateStr.match(regex3);
    if (match) return new Date(today.getFullYear(), monthNum, parseInt(match[1]));
  }

  for (const [monthName, monthNum] of Object.entries(MONTHS_PL)) {
    const regex1 = new RegExp(`(\\d{1,2})\\s+${monthName}\\.?\\s+(\\d{4})`, 'i');
    const regex2 = new RegExp(`(\\d{1,2})\\s+${monthName}(?!\\w)`, 'i');
    let match = dateStr.match(regex1);
    if (match) return new Date(parseInt(match[2]), monthNum, parseInt(match[1]));
    match = dateStr.match(regex2);
    if (match) return new Date(today.getFullYear(), monthNum, parseInt(match[1]));
  }

  return null;
}

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

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightNode(textNode, pattern) {
  const text = textNode.textContent;
  pattern.lastIndex = 0;
  if (!pattern.test(text)) return false;
  pattern.lastIndex = 0;
  const html = text.replace(pattern, (match) => {
    const date = parseDate(match);
    const dayName = date ? getDayName(date) : null;
    const hlClass = highlightEnabled ? 'date-hl' : 'date-hl-no-bg';
    if (dayName) {
      const icon = `<span class="date-hl-icon">🗓<span class="date-hl-tooltip">${dayName}</span></span>`;
      if (iconPosition === 'before') {
        return `${icon}<mark class="${hlClass}">${escapeHtml(match)}</mark>`;
      }
      return `<mark class="${hlClass}">${escapeHtml(match)}</mark>${icon}`;
    }
    return `<mark class="${hlClass}">${escapeHtml(match)}</mark>`;
  });
  const span = document.createElement('span');
  span.innerHTML = html;
  textNode.parentNode.replaceChild(span, textNode);
  return true;
}

function processBatch(nodes, pattern) {
  let count = 0;
  for (const node of nodes) {
    if (node.parentElement?.closest('.date-hl, .date-hl-no-bg')) continue;
    if (highlightNode(node, pattern)) count++;
  }
  return count;
}

function scheduleIdleWork(callback) {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        (deadline) => {
          callback(deadline);
          resolve();
        },
        { timeout: CONFIG.IDLE_TIMEOUT }
      );
    } else {
      setTimeout(() => {
        callback({ timeRemaining: () => 50 });
        resolve();
      }, 1);
    }
  });
}

async function processNodesInChunks(nodes, pattern) {
  let totalCount = 0;
  let index = 0;
  while (index < nodes.length) {
    await scheduleIdleWork((deadline) => {
      const startTime = performance.now();
      while (index < nodes.length && deadline.timeRemaining() > 0) {
        const batch = nodes.slice(index, index + CONFIG.BATCH_SIZE);
        totalCount += processBatch(batch, pattern);
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
function removeHighlights() {
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
  removeStyles();
  console.log('Date highlighter: highlights removed');
}

async function highlightDates() {
  const startTime = performance.now();
  injectStyles();
  const patterns = getDatePatterns();
  const combinedPattern = createCombinedPattern(patterns);
  const textNodes = getTextNodes();

  if (textNodes.length > CONFIG.MAX_NODES) {
    console.warn(
      `Date highlighter: Skipping page with ${textNodes.length} text nodes (max: ${CONFIG.MAX_NODES})`
    );
    return;
  }

  let count;
  if (textNodes.length > CONFIG.BATCH_SIZE * 2) {
    count = await processNodesInChunks(textNodes, combinedPattern);
  } else {
    count = processBatch(textNodes, combinedPattern);
  }

  const duration = (performance.now() - startTime).toFixed(2);

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

function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

function startObserver() {
  if (observer) return;

  const debouncedHighlight = debounce(() => {
    highlightDates();
  }, 300);

  observer = new MutationObserver((mutations) => {
    // Check if any mutation added new text content
    const hasNewContent = mutations.some(
      (m) => m.addedNodes.length > 0 || m.type === 'characterData'
    );
    if (hasNewContent) {
      debouncedHighlight();
    }
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggle') {
    if (message.enabled) {
      highlightDates();
      startObserver();
    } else {
      stopObserver();
      removeHighlights();
    }
  } else if (message.action === 'updateSettings') {
    let needsRefresh = false;
    if (message.iconPosition !== undefined) {
      iconPosition = message.iconPosition;
      needsRefresh = true;
    }
    if (message.highlightEnabled !== undefined) {
      highlightEnabled = message.highlightEnabled;
      needsRefresh = true;
    }
    if (needsRefresh) {
      removeHighlights();
      highlightDates();
    }
  }
});

// Check enabled state and run
chrome.storage.sync.get(['enabled', 'highlightEnabled', 'iconPosition'], (result) => {
  const enabled = result.enabled !== false; // Default to true
  highlightEnabled = result.highlightEnabled !== false; // Default to true
  iconPosition = result.iconPosition || 'after';

  if (enabled) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        highlightDates();
        startObserver();
      });
    } else {
      highlightDates();
      startObserver();
    }
  }
});
