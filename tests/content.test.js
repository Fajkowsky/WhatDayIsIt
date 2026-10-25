import { afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { bundleContentScript } from '../scripts/build.js';

const bundled = bundleContentScript({ write: false });
const pages = [];

function page(html, settings = {}, search = '', configureWindow = () => {}) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body>${html}</body></html>`, {
    url: `https://example.test/${search}`,
    runScripts: 'outside-only',
  });
  const messages = [];
  const storageChanged = [];
  dom.window.chrome = {
    runtime: {
      sendMessage: vi.fn((message) => {
        messages.push(message);
        return Promise.resolve();
      }),
      onMessage: { addListener: vi.fn() },
    },
    storage: {
      sync: { get: vi.fn((keys, callback) => callback(settings)) },
      onChanged: { addListener: (fn) => storageChanged.push(fn) },
    },
  };
  dom.window.console = { log: vi.fn(), warn: vi.fn() };
  configureWindow(dom.window);
  dom.window.eval(bundled);
  if (dom.window.document.readyState === 'loading') {
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  }
  pages.push(dom);
  return { dom, messages, storageChanged };
}

afterEach(() => {
  pages.splice(0).forEach((dom) => dom.window.close());
});

describe('production content bundle', () => {
  it('uses DOM text nodes so page text that looks like HTML stays literal', () => {
    const { dom, messages } = page(
      '<p id="copy">Literal &lt;img src=x onerror=alert(1)&gt; 2024-02-29</p>'
    );
    const text = dom.window.document.querySelector('#copy').textContent;
    expect(text).toBe('Literal <img src=x onerror=alert(1)> 2024-02-29🗓Thursday');
    expect(dom.window.document.querySelector('#copy img')).toBeNull();
    expect(dom.window.document.querySelectorAll('.date-hl')).toHaveLength(1);
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 1 });
  });

  it('counts valid leap days once and leaves impossible calendar dates plain', () => {
    const { dom, messages } = page('<p>2024-02-29 2023-02-29 02/31/2024 12/25/2024</p>');
    expect(dom.window.document.querySelectorAll('.date-hl')).toHaveLength(2);
    expect(dom.window.document.querySelectorAll('.date-hl-icon')).toHaveLength(2);
    expect(messages.at(-1).count).toBe(2);
    expect(dom.window.document.body.textContent).toContain('2023-02-29');
    expect(dom.window.document.body.textContent).toContain('02/31/2024');
  });

  it('chooses ambiguous numeric order from page locale while resolving unambiguous components', () => {
    const pl = page('<p>03/04/2026 13/04/2026</p>', {}, '?locale=pl');
    const en = page('<p>03/04/2026 13/04/2026</p>', {}, '?locale=en-US');
    expect(
      [...pl.dom.window.document.querySelectorAll('.date-hl-icon')].map((x) => x.textContent)
    ).toEqual(['🗓Friday', '🗓Monday']);
    expect(
      [...en.dom.window.document.querySelectorAll('.date-hl-icon')].map((x) => x.textContent)
    ).toEqual(['🗓Wednesday', '🗓Monday']);
  });

  it('supports abbreviated English months with periods and Polish month names', () => {
    const en = page('<p>Sept. 1, 2024</p>');
    const pl = page('<p>29 lutego 2024</p>', {}, '?locale=pl');
    expect(en.dom.window.document.querySelectorAll('.date-hl')).toHaveLength(1);
    expect(pl.dom.window.document.querySelectorAll('.date-hl')).toHaveLength(1);
    expect(en.dom.window.document.querySelector('.date-hl-tooltip').textContent).toBe('Sunday');
    expect(pl.dom.window.document.querySelector('.date-hl-tooltip').textContent).toBe('Thursday');
  });

  it('reacts to shared settings while disabled and clears current highlights', () => {
    const { dom, storageChanged } = page('<p>2024-12-25</p>');
    const get = dom.window.chrome.storage.sync.get;
    get.mockImplementation((keys, callback) =>
      callback({ enabled: false, highlightEnabled: false })
    );
    storageChanged[0]({ enabled: { newValue: false } }, 'sync');
    storageChanged[0]({ highlightEnabled: { newValue: false } }, 'sync');
    expect(dom.window.document.querySelectorAll('.date-hl, .date-hl-no-bg')).toHaveLength(0);
    expect(dom.window.document.body.textContent).toBe('2024-12-25');
    expect(dom.window.chrome.runtime.sendMessage).toHaveBeenLastCalledWith({
      action: 'updateBadge',
      count: 0,
    });
  });

  it('ignores older initial and settings reads that resolve out of order', () => {
    const callbacks = [];
    const { dom, storageChanged, messages } = page('<p>2024-12-25</p>', {}, '', (window) => {
      window.chrome.storage.sync.get = vi.fn((_keys, callback) => callbacks.push(callback));
    });
    expect(callbacks).toHaveLength(1);

    storageChanged[0]({ enabled: { newValue: false } }, 'sync');
    storageChanged[0]({ iconPosition: { newValue: 'before' } }, 'sync');
    expect(callbacks).toHaveLength(3);

    callbacks[2]({ enabled: false, highlightEnabled: false, iconPosition: 'before' });
    callbacks[1]({ enabled: true, highlightEnabled: true, iconPosition: 'after' });
    callbacks[0]({ enabled: true, highlightEnabled: true, iconPosition: 'after' });

    expect(dom.window.document.querySelectorAll('.date-hl, .date-hl-no-bg')).toHaveLength(0);
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 0 });
  });

  it('refreshes enabled pages when icon position and highlighting preferences change', async () => {
    const settings = {};
    const { dom, storageChanged, messages } = page('<p>2024-12-25</p>', settings);
    Object.assign(settings, { iconPosition: 'before', highlightEnabled: false });
    storageChanged[0]({ iconPosition: { newValue: 'before' } }, 'sync');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const mark = dom.window.document.querySelector('.date-hl-no-bg');
    expect(mark.textContent).toBe('2024-12-25');
    expect(mark.previousSibling.className).toBe('date-hl-icon');
    expect(dom.window.document.querySelectorAll('.date-hl-icon')).toHaveLength(1);
    expect(dom.window.document.querySelector('.date-hl')).toBeNull();
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 1 });
  });

  it('updates the current date markup and badge after dynamic removal', async () => {
    const { dom, messages } = page('<p id="dates">2024-12-25</p>');
    dom.window.document.querySelector('#dates').textContent = '2024-12-26';
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(dom.window.document.querySelectorAll('.date-hl')).toHaveLength(1);
    expect(dom.window.document.querySelector('.date-hl').textContent).toBe('2024-12-26');
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 1 });
  });

  it('detects a date in a newly inserted page node and refreshes the badge', async () => {
    const { dom, messages } = page('<main id="content"></main>');
    dom.window.document
      .querySelector('#content')
      .insertAdjacentHTML('beforeend', '<p id="added">The appointment is on 2024-12-25.</p>');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(dom.window.document.querySelectorAll('#added .date-hl')).toHaveLength(1);
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 1 });
  });

  it.each(['remove', 'replaceChildren', 'textContent'])(
    'recounts when a page clears highlighted content using %s',
    async (operation) => {
      const { dom, messages } = page('<div id="dates"><p>2024-12-25</p></div>');
      expect(dom.window.document.querySelectorAll('.date-hl')).toHaveLength(1);
      const dates = dom.window.document.querySelector('#dates');
      if (operation === 'remove') dates.remove();
      else if (operation === 'replaceChildren') dates.querySelector('p').replaceChildren();
      else dates.querySelector('p').textContent = '';
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(dom.window.document.querySelectorAll('.date-hl, .date-hl-no-bg')).toHaveLength(0);
      expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 0 });
    }
  );

  it('does not let an obsolete idle scan restore marks after disable', async () => {
    const settings = {};
    const html = Array.from(
      { length: 150 },
      (_, index) => `<p>2024-12-${String((index % 28) + 1).padStart(2, '0')}</p>`
    ).join('');
    const { dom, storageChanged, messages } = page(html, settings);
    settings.enabled = false;
    storageChanged[0]({ enabled: { newValue: false } }, 'sync');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(dom.window.document.querySelectorAll('.date-hl, .date-hl-no-bg')).toHaveLength(0);
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 0 });
  });

  it('skips detached text nodes captured by an async scan', async () => {
    const idleCallbacks = [];
    const removedNodes = Array.from(
      { length: 120 },
      (_, index) => `<p>2024-12-${String((index % 28) + 1).padStart(2, '0')}</p>`
    ).join('');
    const { dom, messages } = page(
      `<div id="discard">${removedNodes}</div><p id="keep">2024-12-31</p>`,
      {},
      '',
      (window) => {
        window.requestIdleCallback = (callback) => {
          idleCallbacks.push(callback);
          return idleCallbacks.length;
        };
        window.cancelIdleCallback = vi.fn();
      }
    );
    const runOneBatch = (callback) => {
      let checks = 0;
      callback({ timeRemaining: () => (checks++ === 0 ? 1 : 0) });
    };

    runOneBatch(idleCallbacks.shift());
    await new Promise((resolve) => setTimeout(resolve, 0));
    dom.window.document.querySelector('#discard').remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    while (idleCallbacks.length) {
      runOneBatch(idleCallbacks.shift());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(dom.window.document.querySelectorAll('.date-hl, .date-hl-no-bg')).toHaveLength(1);
    expect(dom.window.document.querySelector('#keep .date-hl').textContent).toBe('2024-12-31');
    expect(messages.at(-1)).toEqual({ action: 'updateBadge', count: 1 });
  });
});
