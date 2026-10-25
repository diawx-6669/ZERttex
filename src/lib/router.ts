import { useEffect, useState } from 'react';

// Minimal hash router: "#/tour/kolsai?x=1" → { path: ['tour','kolsai'], query }.
export type Route = { path: string[]; query: URLSearchParams; raw: string };

const parse = (): Route => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean), query: new URLSearchParams(q), raw };
};

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (to: string) => {
  window.location.hash = to.startsWith('/') ? to : '/' + to;
};

export const href = (to: string) => '#' + (to.startsWith('/') ? to : '/' + to);
