export type Lang = 'en' | 'zh';

/** A bilingual string. Every user-facing text in data files uses this shape. */
export type L = { en: string; zh: string };

/** The five honesty labels used across the prototype. */
export type TagKind = 'case' | 'verified' | 'proposal' | 'demo' | 'confirm';

export type TourId = 'charyn' | 'kolsai' | 'turkestan' | 'burabay';
export type Hub = 'almaty' | 'turkestan' | 'astana';
export type Interest = 'nature' | 'photography' | 'culture' | 'adventure' | 'relaxation';

export type InclusionItem = { label: L; priceKzt?: number };

export type Tour = {
  id: TourId;
  name: L;
  tagline: L;
  days: number;
  hub: Hub;
  priceKzt: number;
  region: L;
  difficulty: L;
  bestFor: Interest[];
  highlights: L[];
  inclusions: {
    included: InclusionItem[];
    optional: InclusionItem[];
    notIncluded: InclusionItem[];
    unconfirmed: InclusionItem[];
  };
  itinerary: { title: L; items: L[] }[];
  packing: L[];
  audio: { title: L; text: L }[];
};

export type Guide = {
  id: string;
  name: string;
  initials: string;
  role: L;
  languages: L[];
  specialties: L[];
  base: L;
  tours: TourId[];
  intro: L;
};
