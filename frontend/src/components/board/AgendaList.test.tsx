import { describe, it, expect } from 'vitest';
import { parseAgenda } from './AgendaList';

/**
 * The agenda was rendered as one paragraph because HTML collapses newlines
 * (#395). These pin the parsing rules — especially the two that decide whether
 * the display stays faithful to what the secretary typed.
 */
describe('parseAgenda', () => {
  it('puts each line on its own topic', () => {
    const t = parseAgenda('Budget review\nStrategy 2027\nAny other business');
    expect(t.map(x => x.text)).toEqual(['Budget review', 'Strategy 2027', 'Any other business']);
    expect(t.every(x => x.children.length === 0)).toBe(true);
  });

  it('nests indented lines under the topic above', () => {
    const t = parseAgenda('Budget review\n  Q3 actuals\n  Q4 forecast\nStrategy 2027');
    expect(t).toHaveLength(2);
    expect(t[0].children).toEqual(['Q3 actuals', 'Q4 forecast']);
    expect(t[1].children).toEqual([]);
  });

  it('strips numbering the author typed, so it is not doubled', () => {
    // Otherwise a hand-numbered agenda renders "1. 1. Budget review".
    expect(parseAgenda('1. Budget\n2) Strategy\n- Any other business').map(x => x.text))
      .toEqual(['Budget', 'Strategy', 'Any other business']);
  });

  it('keeps a hyphen that is part of the text', () => {
    // "Mid-year review" must not lose its hyphen to the marker stripper.
    expect(parseAgenda('Mid-year review').map(x => x.text)).toEqual(['Mid-year review']);
  });

  it('ignores blank lines', () => {
    expect(parseAgenda('Budget\n\n\nStrategy').map(x => x.text)).toEqual(['Budget', 'Strategy']);
  });

  it('does not invent structure from a single paragraph', () => {
    // If it was typed as one run of prose, it stays one topic. The display must
    // not guess sentence boundaries and present them as agenda items.
    const one = 'Budget review and strategy discussion. Also any other business.';
    expect(parseAgenda(one)).toEqual([{ text: one, children: [] }]);
  });

  it('treats a leading indent with no topic above it as a topic', () => {
    expect(parseAgenda('   Budget review').map(x => x.text)).toEqual(['Budget review']);
  });

  it('handles Arabic content unchanged', () => {
    const t = parseAgenda('مراجعة الميزانية\n  الربع الثالث\nاستراتيجية 2027');
    expect(t).toHaveLength(2);
    expect(t[0].text).toBe('مراجعة الميزانية');
    expect(t[0].children).toEqual(['الربع الثالث']);
  });

  it('returns nothing for empty or whitespace input', () => {
    expect(parseAgenda('')).toEqual([]);
    expect(parseAgenda('   \n  \n')).toEqual([]);
  });
});
