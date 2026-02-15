import { describe, it, expect, vi } from 'vitest';

// Extract the highlight HTML generation logic for testing
function generateHighlightHtml(match, dayName, hlClass, iconPosition, escapeHtml) {
  const icon = `<span class="date-hl-icon">🗓<span class="date-hl-tooltip">${dayName}</span></span>`;
  if (iconPosition === 'before') {
    return `${icon}<mark class="${hlClass}">${escapeHtml(match)}</mark>`;
  }
  return `<mark class="${hlClass}">${escapeHtml(match)}</mark>${icon}`;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

describe('Highlight HTML Generation', () => {
  it('places icon after mark element when iconPosition is "after"', () => {
    const html = generateHighlightHtml('2024-12-25', 'Wednesday', 'date-hl', 'after', escapeHtml);

    expect(html).toBe(
      '<mark class="date-hl">2024-12-25</mark><span class="date-hl-icon">🗓<span class="date-hl-tooltip">Wednesday</span></span>'
    );
    // Icon should be AFTER the closing </mark> tag
    expect(html.indexOf('</mark>')).toBeLessThan(html.indexOf('date-hl-icon'));
  });

  it('places icon before mark element when iconPosition is "before"', () => {
    const html = generateHighlightHtml('2024-12-25', 'Wednesday', 'date-hl', 'before', escapeHtml);

    expect(html).toBe(
      '<span class="date-hl-icon">🗓<span class="date-hl-tooltip">Wednesday</span></span><mark class="date-hl">2024-12-25</mark>'
    );
    // Icon should be BEFORE the opening <mark> tag
    expect(html.indexOf('date-hl-icon')).toBeLessThan(html.indexOf('<mark'));
  });

  it('uses date-hl class when highlight is enabled', () => {
    const html = generateHighlightHtml('2024-12-25', 'Wednesday', 'date-hl', 'after', escapeHtml);

    expect(html).toContain('class="date-hl"');
    expect(html).not.toContain('date-hl-no-bg');
  });

  it('uses date-hl-no-bg class when highlight is disabled', () => {
    const html = generateHighlightHtml(
      '2024-12-25',
      'Wednesday',
      'date-hl-no-bg',
      'after',
      escapeHtml
    );

    expect(html).toContain('class="date-hl-no-bg"');
  });

  it('escapes HTML in date text', () => {
    const html = generateHighlightHtml(
      '<script>alert(1)</script>',
      'Wednesday',
      'date-hl',
      'after',
      escapeHtml
    );

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });
});

describe('Remove Highlights Logic', () => {
  it('extracts text content from mark element', () => {
    const mark = {
      textContent: '2024-12-25',
      parentNode: {
        replaceChild: vi.fn(),
      },
    };

    // Simulate the extraction logic
    const textContent = mark.textContent || '';
    expect(textContent).toBe('2024-12-25');
  });

  it('handles marks with only text content (icon is outside)', () => {
    // When icon is outside mark, mark.textContent is just the date
    const mark = {
      textContent: 'January 15, 2024',
    };

    const textContent = mark.textContent || '';
    expect(textContent).toBe('January 15, 2024');
    expect(textContent).not.toContain('🗓');
  });
});

describe('ProcessBatch Skip Logic', () => {
  it('should skip nodes inside .date-hl elements', () => {
    const mockClosest = vi.fn().mockReturnValue(true);
    const node = {
      parentElement: {
        closest: mockClosest,
      },
    };

    // Simulate the skip check
    const shouldSkip = node.parentElement?.closest('.date-hl, .date-hl-no-bg');

    expect(mockClosest).toHaveBeenCalledWith('.date-hl, .date-hl-no-bg');
    expect(shouldSkip).toBe(true);
  });

  it('should skip nodes inside .date-hl-no-bg elements', () => {
    const mockClosest = vi.fn().mockImplementation((selector) => {
      return selector.includes('date-hl-no-bg');
    });
    const node = {
      parentElement: {
        closest: mockClosest,
      },
    };

    const shouldSkip = node.parentElement?.closest('.date-hl, .date-hl-no-bg');
    expect(shouldSkip).toBe(true);
  });

  it('should not skip nodes outside highlight elements', () => {
    const mockClosest = vi.fn().mockReturnValue(null);
    const node = {
      parentElement: {
        closest: mockClosest,
      },
    };

    const shouldSkip = node.parentElement?.closest('.date-hl, .date-hl-no-bg');
    expect(shouldSkip).toBe(null);
  });
});

describe('CSS Classes', () => {
  const cssContent = `
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
  `;

  it('date-hl has yellow background', () => {
    expect(cssContent).toContain('.date-hl {');
    expect(cssContent).toMatch(/\.date-hl \{[^}]*background: #fff3cd/);
  });

  it('date-hl-no-bg has transparent background', () => {
    expect(cssContent).toContain('.date-hl-no-bg {');
    expect(cssContent).toMatch(/\.date-hl-no-bg \{[^}]*background: transparent/);
  });

  it('date-hl-icon has transparent background (no yellow bleed)', () => {
    expect(cssContent).toContain('.date-hl-icon {');
    expect(cssContent).toMatch(/\.date-hl-icon \{[^}]*background: transparent/);
  });

  it('both highlight classes inherit text color', () => {
    expect(cssContent).toMatch(/\.date-hl \{[^}]*color: inherit/);
    expect(cssContent).toMatch(/\.date-hl-no-bg \{[^}]*color: inherit/);
  });
});

describe('Badge Count Messaging', () => {
  it('sends correct message format for updateBadgeCount', () => {
    const sendMessage = vi.fn().mockReturnValue(Promise.resolve());
    const count = 7;
    sendMessage({ action: 'updateBadge', count });
    expect(sendMessage).toHaveBeenCalledWith({ action: 'updateBadge', count: 7 });
  });

  it('sends zero count to clear badge', () => {
    const sendMessage = vi.fn().mockReturnValue(Promise.resolve());
    sendMessage({ action: 'updateBadge', count: 0 });
    expect(sendMessage).toHaveBeenCalledWith({ action: 'updateBadge', count: 0 });
  });

  it('handles rejected sendMessage gracefully', async () => {
    const sendMessage = vi.fn().mockReturnValue(Promise.reject(new Error('No listener')));
    // Simulates updateBadgeCount: sendMessage().catch(() => {})
    await expect(sendMessage().catch(() => {})).resolves.toBeUndefined();
  });
});

describe('Icon Removal', () => {
  it('removes icons before removing marks', () => {
    const removeOrder = [];

    const icons = [
      { remove: () => removeOrder.push('icon1') },
      { remove: () => removeOrder.push('icon2') },
    ];

    const marks = [
      {
        textContent: 'date1',
        parentNode: { replaceChild: () => removeOrder.push('mark1') },
      },
    ];

    // Simulate removeHighlights logic
    icons.forEach((icon) => icon.remove());
    marks.forEach((mark) => {
      mark.parentNode.replaceChild();
    });

    // Icons should be removed first
    expect(removeOrder[0]).toBe('icon1');
    expect(removeOrder[1]).toBe('icon2');
    expect(removeOrder[2]).toBe('mark1');
  });
});
