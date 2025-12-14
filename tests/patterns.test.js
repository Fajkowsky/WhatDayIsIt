import { describe, it, expect } from 'vitest';
import commonPatterns from '../src/patterns/common.js';
import enPatterns from '../src/patterns/en.js';
import plPatterns from '../src/patterns/pl.js';

// Combine all patterns (simulating English locale)
const ALL_PATTERNS = [...commonPatterns, ...enPatterns, ...plPatterns];
const COMBINED_PATTERN = new RegExp(ALL_PATTERNS.map((p) => `(${p.source})`).join('|'), 'gi');

const testMatch = (text) => {
  COMBINED_PATTERN.lastIndex = 0;
  return COMBINED_PATTERN.test(text);
};

const getMatches = (text) => {
  COMBINED_PATTERN.lastIndex = 0;
  return text.match(COMBINED_PATTERN) || [];
};

describe('ISO Formats', () => {
  it('matches YYYY-MM-DD', () => {
    expect(testMatch('2024-12-25')).toBe(true);
    expect(testMatch('2024-01-01')).toBe(true);
  });

  it('matches ISO with time', () => {
    expect(testMatch('2024-12-25T14:30:00Z')).toBe(true);
    expect(testMatch('2024-12-25T14:30:00.123Z')).toBe(true);
    expect(testMatch('2024-12-25T14:30:00+02:00')).toBe(true);
  });
});

describe('Numeric Formats', () => {
  it('matches slash-separated dates', () => {
    expect(testMatch('12/25/2024')).toBe(true);
    expect(testMatch('25/12/2024')).toBe(true);
  });

  it('matches dot-separated dates', () => {
    expect(testMatch('25.12.2024')).toBe(true);
    expect(testMatch('1.5.24')).toBe(true);
  });

  it('matches dash-separated dates', () => {
    expect(testMatch('25-12-2024')).toBe(true);
  });
});

describe('English Text Dates', () => {
  it('matches Month DD, YYYY', () => {
    expect(testMatch('January 15, 2024')).toBe(true);
    expect(testMatch('December 25, 2024')).toBe(true);
  });

  it('matches with ordinals', () => {
    expect(testMatch('January 1st, 2024')).toBe(true);
    expect(testMatch('January 2nd, 2024')).toBe(true);
    expect(testMatch('January 3rd, 2024')).toBe(true);
    expect(testMatch('January 15th, 2024')).toBe(true);
  });

  it('matches DD Month YYYY', () => {
    expect(testMatch('15 January 2024')).toBe(true);
    expect(testMatch('15th January 2024')).toBe(true);
  });

  it('matches short month names', () => {
    expect(testMatch('Jan 15, 2024')).toBe(true);
    expect(testMatch('Dec 25, 2024')).toBe(true);
    expect(testMatch('Sept 1, 2024')).toBe(true);
  });

  it('matches month + day without year', () => {
    expect(testMatch('January 15')).toBe(true);
    expect(testMatch('December 25th')).toBe(true);
  });
});

describe('Polish Dates', () => {
  it('matches DD miesiąca YYYY (genitive)', () => {
    expect(testMatch('15 stycznia 2024')).toBe(true);
    expect(testMatch('25 grudnia 2024')).toBe(true);
    expect(testMatch('1 lutego 2024')).toBe(true);
  });

  it('matches DD miesiąc YYYY (nominative)', () => {
    expect(testMatch('15 styczeń 2024')).toBe(true);
    expect(testMatch('25 grudzień 2024')).toBe(true);
  });

  it('matches DD miesiąca without year', () => {
    expect(testMatch('15 stycznia')).toBe(true);
    expect(testMatch('25 grudnia')).toBe(true);
  });

  it('matches abbreviated months', () => {
    expect(testMatch('15 sty 2024')).toBe(true);
    expect(testMatch('25 gru. 2024')).toBe(true);
  });
});

describe('Special Words', () => {
  it('matches English special words', () => {
    expect(testMatch('today')).toBe(true);
    expect(testMatch('tomorrow')).toBe(true);
    expect(testMatch('yesterday')).toBe(true);
  });

  it('matches Polish special words', () => {
    expect(testMatch('dzisiaj')).toBe(true);
    expect(testMatch('dziś')).toBe(true);
    expect(testMatch('jutro')).toBe(true);
    expect(testMatch('wczoraj')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(testMatch('TODAY')).toBe(true);
    expect(testMatch('Tomorrow')).toBe(true);
  });
});

describe('Multiple Matches', () => {
  it('finds all dates in text', () => {
    const text = 'Event on January 15, 2024 ends on 2024-01-20';
    const matches = getMatches(text);
    expect(matches.length).toBe(2);
  });
});

describe('Edge Cases', () => {
  it('matches dates in sentences', () => {
    expect(testMatch('The meeting is on 2024-12-25')).toBe(true);
    expect(testMatch('See you tomorrow!')).toBe(true);
  });
});
