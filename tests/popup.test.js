import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');

function popup() {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const listeners = [];
  const settings = { enabled: true, highlightEnabled: true, iconPosition: 'after' };
  dom.window.chrome = {
    storage: {
      sync: {
        get: vi.fn((keys, callback) => callback({ ...settings })),
        set: vi.fn((change) => Object.assign(settings, change)),
      },
      onChanged: { addListener: (fn) => listeners.push(fn) },
    },
  };
  dom.window.eval(script);
  return { dom, listeners, settings };
}

describe('production popup', () => {
  it('persists settings without targeting only the active tab', () => {
    const { dom, settings } = popup();
    const doc = dom.window.document;
    doc.querySelector('label[for="globalToggle"] .toggle-slider').click();
    doc.querySelector('label[for="highlightToggle"] .toggle-slider').click();
    doc.getElementById('iconPosition').value = 'before';
    doc.getElementById('iconPosition').dispatchEvent(new dom.window.Event('change'));
    expect(settings).toEqual({ enabled: false, highlightEnabled: false, iconPosition: 'before' });
    expect(dom.window.chrome.storage.sync.set).toHaveBeenCalledTimes(3);
    expect(doc.getElementById('globalToggle').labels).toHaveLength(1);
    expect(doc.getElementById('iconPosition').labels).toHaveLength(1);
  });

  it('reflects sync settings and keeps presentation controls available when disabled', () => {
    const { dom, listeners, settings } = popup();
    Object.assign(settings, { enabled: false, highlightEnabled: false, iconPosition: 'before' });
    listeners[0]({ enabled: { newValue: false } }, 'sync');
    const doc = dom.window.document;
    expect(doc.getElementById('globalToggle').checked).toBe(false);
    expect(doc.getElementById('highlightToggle').checked).toBe(false);
    expect(doc.getElementById('iconPosition').value).toBe('before');
    expect(doc.getElementById('highlightToggle').disabled).toBe(false);
    expect(doc.getElementById('status').textContent).toBe('Disabled');
  });
});
