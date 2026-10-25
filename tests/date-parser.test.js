import { describe, expect, it } from 'vitest';
import { parseDate } from '../src/date-parser.js';

const parts = (date) => date && [date.getFullYear(), date.getMonth() + 1, date.getDate()];

describe('production date parser', () => {
  it('validates ISO calendar dates including leap years', () => {
    expect(parts(parseDate('2024-02-29'))).toEqual([2024, 2, 29]);
    expect(parts(parseDate('0004-02-29'))).toEqual([4, 2, 29]);
    expect(parts(parseDate('0000-02-29'))).toEqual([0, 2, 29]);
    expect(parts(parseDate('0099-12-31'))).toEqual([99, 12, 31]);
    expect(parseDate('2023-02-29')).toBeNull();
    expect(parseDate('2024-13-01')).toBeNull();
  });

  it('applies Polish and English ordering only when numeric components are ambiguous', () => {
    expect(parts(parseDate('03/04/2026', 'pl'))).toEqual([2026, 4, 3]);
    expect(parts(parseDate('03/04/2026', 'en-US'))).toEqual([2026, 3, 4]);
    expect(parts(parseDate('13/04/2026', 'en-US'))).toEqual([2026, 4, 13]);
    expect(parts(parseDate('12/25/2026', 'pl'))).toEqual([2026, 12, 25]);
    expect(parseDate('02/31/2026', 'en')).toBeNull();
  });

  it('parses English abbreviations with optional periods and Polish month names', () => {
    expect(parts(parseDate('Sept. 1, 2024'))).toEqual([2024, 9, 1]);
    expect(parts(parseDate('1st Sept. 2024'))).toEqual([2024, 9, 1]);
    expect(parts(parseDate('29 lutego 2024', 'pl'))).toEqual([2024, 2, 29]);
    expect(parseDate('29 lutego 2023', 'pl')).toBeNull();
  });
});
