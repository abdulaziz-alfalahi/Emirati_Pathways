import React from 'react';

/**
 * A meeting agenda, rendered as numbered topics instead of one paragraph (#395).
 *
 * The agenda is stored as free text and was rendered as `<p>{agenda}</p>`. HTML
 * collapses newlines, so a secretary who typed one topic per line saw them run
 * together — "all topics appearing next to each other", as the report put it.
 * Nothing was lost; it just could not be read.
 *
 * Structure comes from INDENTATION only: a line starting with whitespace is a
 * sub-item of the topic above it. That is the one signal a typist gives
 * deliberately, and it means the display never invents a hierarchy the author
 * did not type. Existing "1." / "-" markers are stripped so the automatic
 * numbering does not double up on someone who numbered their own list.
 */

export type AgendaTopic = { text: string; children: string[] };

/** Strip a leading list marker: "1." "1)" "-" "•" "*" "◦" and any spacing. */
const stripMarker = (line: string) =>
  line.replace(/^\s*(?:\d+\s*[.)]\s*|[-•*◦]\s+|[-•*◦](?=\S))\s*/, '').trim();

export function parseAgenda(raw: string): AgendaTopic[] {
  if (!raw) return [];
  const topics: AgendaTopic[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const isSubItem = /^[ \t]/.test(line) && topics.length > 0;
    const text = stripMarker(line);
    if (!text) continue;
    if (isSubItem) topics[topics.length - 1].children.push(text);
    else topics.push({ text, children: [] });
  }
  return topics;
}

interface Props {
  agenda?: string | null;
  className?: string;
  /** Smaller type for the dense archive list. */
  compact?: boolean;
}

const AgendaList: React.FC<Props> = ({ agenda, className = '', compact = false }) => {
  const topics = parseAgenda(agenda || '');
  if (!topics.length) return null;

  const size = compact ? 'text-xs' : 'text-sm';

  // A single topic is not a list — numbering "1." against one item reads as an
  // outline that was never written.
  if (topics.length === 1 && !topics[0].children.length) {
    return <p dir="auto" className={`${size} text-gray-500 ${className}`}>{topics[0].text}</p>;
  }

  return (
    // dir="auto" so an Arabic agenda numbers and aligns from the right.
    <ol dir="auto" className={`${size} text-gray-500 space-y-1 ${className}`}>
      {topics.map((t, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="shrink-0 tabular-nums text-gray-400">{i + 1}.</span>
          <span className="min-w-0">
            {t.text}
            {t.children.length > 0 && (
              <ul className="mt-0.5 space-y-0.5 ps-3">
                {t.children.map((c, j) => (
                  <li key={j} className="flex gap-1.5">
                    <span className="shrink-0 text-gray-400">–</span>
                    <span className="min-w-0">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
};

export default AgendaList;
