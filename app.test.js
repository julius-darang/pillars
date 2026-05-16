import { describe, it, expect } from 'vitest';
import { dateKey, shiftDate, mondayOf, esc } from './utils.js';

describe('dateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(dateKey(new Date(2024, 11, 31))).toBe('2024-12-31');
  });

  it('zero-pads single-digit month and day', () => {
    expect(dateKey(new Date(2024, 0, 1))).toBe('2024-01-01');
    expect(dateKey(new Date(2024, 8, 9))).toBe('2024-09-09');
  });
});

describe('shiftDate', () => {
  it('advances a date by N days', () => {
    expect(shiftDate('2024-01-01', 1)).toBe('2024-01-02');
    expect(shiftDate('2024-01-31', 1)).toBe('2024-02-01');
  });

  it('goes back N days with a negative offset', () => {
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29'); // 2024 is a leap year
    expect(shiftDate('2024-01-01', -1)).toBe('2023-12-31');
  });

  it('returns the same key for a zero offset', () => {
    expect(shiftDate('2024-06-15', 0)).toBe('2024-06-15');
  });

  it('handles multi-day shifts', () => {
    expect(shiftDate('2024-01-01', 365)).toBe('2024-12-31');
    expect(shiftDate('2024-12-31', -365)).toBe('2024-01-01');
  });
});

describe('mondayOf', () => {
  it('returns the Monday of the week for a mid-week day', () => {
    const mon = mondayOf(new Date(2024, 0, 10)); // Wed 10 Jan 2024
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(8);
  });

  it('returns the same day when given a Monday', () => {
    const mon = mondayOf(new Date(2024, 0, 8)); // Mon 8 Jan 2024
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(8);
  });

  it('returns the previous Monday when given a Sunday', () => {
    const mon = mondayOf(new Date(2024, 0, 14)); // Sun 14 Jan 2024
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(8);
  });

  it('handles Saturday correctly', () => {
    const mon = mondayOf(new Date(2024, 0, 13)); // Sat 13 Jan 2024
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(8);
  });
});

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
    expect(esc('"hello"')).toBe('&quot;hello&quot;');
    expect(esc('a & b')).toBe('a &amp; b');
    expect(esc('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  });

  it('leaves safe strings unchanged', () => {
    expect(esc('Read for 30 minutes')).toBe('Read for 30 minutes');
    expect(esc('📖')).toBe('📖');
    expect(esc('')).toBe('');
  });

  it('escapes ampersands before angle brackets to avoid double-escaping', () => {
    expect(esc('&lt;')).toBe('&amp;lt;');
  });
});
