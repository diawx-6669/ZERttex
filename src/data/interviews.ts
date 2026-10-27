import type { L } from './types';

// Real traveler interviews ONLY. The team fills this in after talking to people.
// While the array is empty, the "What travelers told us" block renders nothing.
// Never add sample, invented or AI-written answers here.
//
// Example shape (do not copy as data):
//   { id: 'i01', date: '2026-11-03', who: { en: 'Solo traveler, Shanghai', zh: '独自旅行者，上海' },
//     quote: { en: '…', zh: '…' }, original: 'zh', method: 'video call', consent: true }

export type Interview = {
  id: string;
  /** ISO date of the interview. */
  date: string;
  /** Anonymous description, never a full name. */
  who: L;
  quote: L;
  /** Language the person actually spoke; the other one is a translation. */
  original: 'en' | 'zh' | 'ru' | 'kk';
  method: 'in person' | 'video call' | 'chat' | 'survey';
  /** The person agreed that the quote may be shown. Entries without consent are never shown. */
  consent: boolean;
};

export const interviews: Interview[] = [];
