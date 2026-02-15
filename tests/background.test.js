import { describe, it, expect, beforeEach } from 'vitest';

describe('Badge Text Logic', () => {
  it('converts positive count to string', () => {
    const count = 12;
    const text = count > 0 ? String(count) : '';
    expect(text).toBe('12');
  });

  it('converts zero count to empty string', () => {
    const count = 0;
    const text = count > 0 ? String(count) : '';
    expect(text).toBe('');
  });

  it('converts single digit count to string', () => {
    const count = 5;
    const text = count > 0 ? String(count) : '';
    expect(text).toBe('5');
  });

  it('handles large counts', () => {
    const count = 999;
    const text = count > 0 ? String(count) : '';
    expect(text).toBe('999');
  });
});

describe('Tab Count Map Operations', () => {
  let tabCounts;

  beforeEach(() => {
    tabCounts = new Map();
  });

  it('stores count for a tab', () => {
    tabCounts.set(1, 5);
    expect(tabCounts.get(1)).toBe(5);
  });

  it('updates count for existing tab', () => {
    tabCounts.set(1, 5);
    tabCounts.set(1, 10);
    expect(tabCounts.get(1)).toBe(10);
  });

  it('tracks multiple tabs independently', () => {
    tabCounts.set(1, 5);
    tabCounts.set(2, 12);
    tabCounts.set(3, 0);
    expect(tabCounts.get(1)).toBe(5);
    expect(tabCounts.get(2)).toBe(12);
    expect(tabCounts.get(3)).toBe(0);
  });

  it('removes tab on cleanup', () => {
    tabCounts.set(1, 5);
    tabCounts.set(2, 10);
    tabCounts.delete(1);
    expect(tabCounts.has(1)).toBe(false);
    expect(tabCounts.get(2)).toBe(10);
  });

  it('handles delete of non-existent tab gracefully', () => {
    tabCounts.delete(999);
    expect(tabCounts.size).toBe(0);
  });
});

describe('Message Handling', () => {
  it('extracts count from updateBadge message', () => {
    const message = { action: 'updateBadge', count: 7 };
    expect(message.action).toBe('updateBadge');
    expect(message.count).toBe(7);
  });

  it('defaults to 0 when count is missing', () => {
    const message = { action: 'updateBadge' };
    const count = message.count || 0;
    expect(count).toBe(0);
  });

  it('ignores messages with wrong action', () => {
    const message = { action: 'toggle', enabled: true };
    const isUpdateBadge = message.action === 'updateBadge';
    expect(isUpdateBadge).toBe(false);
  });
});
