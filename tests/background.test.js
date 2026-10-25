import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';

const source = readFileSync(new URL('../background.js', import.meta.url), 'utf8');

function background() {
  const listeners = { message: null, removed: null, updated: null, storage: null };
  const chrome = {
    runtime: { onMessage: { addListener: (fn) => (listeners.message = fn) } },
    tabs: {
      onRemoved: { addListener: (fn) => (listeners.removed = fn) },
      onUpdated: { addListener: (fn) => (listeners.updated = fn) },
      query: vi.fn((query, callback) => callback([{ id: 1 }, { id: 2 }, {}])),
    },
    storage: { onChanged: { addListener: (fn) => (listeners.storage = fn) } },
    action: { setBadgeText: vi.fn(), setBadgeBackgroundColor: vi.fn() },
  };
  new Function('chrome', source)(chrome);
  return { chrome, listeners };
}

describe('background service worker', () => {
  let state;
  beforeEach(() => {
    state = background();
  });

  it('updates only a valid sender tab with a non-negative integer count', () => {
    const { chrome, listeners } = state;
    listeners.message({ action: 'updateBadge', count: 12 }, { tab: { id: 7 } });
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '12', tabId: 7 });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: '#4CAF50',
      tabId: 7,
    });
    for (const [message, sender] of [
      [{ action: 'updateBadge', count: 1 }, {}],
      [{ action: 'updateBadge', count: -1 }, { tab: { id: 8 } }],
      [{ action: 'updateBadge', count: '2' }, { tab: { id: 8 } }],
      [null, { tab: { id: 8 } }],
    ])
      listeners.message(message, sender);
    expect(chrome.action.setBadgeText).toHaveBeenCalledTimes(1);
  });

  it('clears the correct badge on navigation and removes closed tab counts', () => {
    const { chrome, listeners } = state;
    listeners.message({ action: 'updateBadge', count: 3 }, { tab: { id: 4 } });
    listeners.updated(4, { status: 'loading' });
    listeners.removed(4);
    expect(chrome.action.setBadgeText).toHaveBeenLastCalledWith({ text: '', tabId: 4 });
  });

  it('clears badges across open tabs when the shared setting is disabled', () => {
    const { chrome, listeners } = state;
    listeners.storage({ enabled: { newValue: false } }, 'sync');
    expect(chrome.tabs.query).toHaveBeenCalledWith({}, expect.any(Function));
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 2 });
  });

  it('ignores an old disable query after re-enable and a fresh badge update', () => {
    const { chrome, listeners } = state;
    let finishOldQuery;
    chrome.tabs.query.mockImplementation((_query, callback) => {
      finishOldQuery = callback;
    });

    listeners.storage({ enabled: { newValue: false } }, 'sync');
    listeners.storage({ enabled: { newValue: true } }, 'sync');
    listeners.message({ action: 'updateBadge', count: 9 }, { tab: { id: 1 } });
    finishOldQuery([{ id: 1 }, { id: 2 }]);

    expect(chrome.action.setBadgeText).toHaveBeenLastCalledWith({ text: '9', tabId: 1 });
    expect(chrome.action.setBadgeText).not.toHaveBeenCalledWith({ text: '', tabId: 1 });
  });
});
