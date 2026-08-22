/**
 * The invitation pipeline is worked top-down, so its order is the work order.
 *
 * It was sorted alphabetically — the backend query ends `ORDER BY
 * c.company_name ASC` — so an operator inviting companies in the order shown
 * starts with whoever happens to be called "A...", not with whoever has the
 * most open roles. 245 unverified companies currently have vacancies.
 *
 * Owner, 2026-08-22: "I need to sort companies by the number of vacancies so I
 * can start inviting those with the most vacancies first."
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = readFileSync(
  join(__dirname, '..', 'GrowthOperatorDashboard.tsx'), 'utf-8');

describe('invitation pipeline ordering', () => {
  it('defaults to most vacancies first', () => {
    expect(SRC).toContain("useState<'vacancies' | 'name'>('vacancies')");
  });

  it('sorts on the vacancy count, descending', () => {
    expect(SRC).toContain('b.jobsPosted - a.jobsPosted');
  });

  it('breaks ties by name so the order does not shuffle between renders', () => {
    const sort = SRC.split("pipelineSort === 'vacancies'")[1].slice(0, 400);
    expect(sort).toContain('|| a.name.localeCompare(b.name)');
  });

  it('does not mutate the shared companies array while sorting', () => {
    // .sort() is in-place; sorting the state array directly would reorder every
    // other tab reading the same list as a side effect of opening this one.
    const block = SRC.split('const pipelineCompanies = companies')[1].slice(0, 500);
    expect(block).toContain('.slice()');
  });

  it('keeps alphabetical reachable', () => {
    // ~245 companies: losing name order means scrolling to find a known one.
    expect(SRC).toContain("{ key: 'name'");
  });
});
