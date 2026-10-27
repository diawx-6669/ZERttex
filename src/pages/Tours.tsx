import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { RouteMap } from '../components/RouteMap';
import { Tag } from '../components/Tag';
import { TourCard } from '../components/TourParts';
import { interestText, ui } from '../data/i18n';
import { hubName, tours } from '../data/tours';
import type { Hub, Interest } from '../data/types';
import { useApp } from '../state';

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'short';

export default function Tours() {
  const { t } = useApp();
  const [hub, setHub] = useState<Hub | 'all'>('all');
  const [interest, setInterest] = useState<Interest | 'all'>('all');
  const [len, setLen] = useState<'all' | 'short' | 'long'>('all');
  const [sort, setSort] = useState<Sort>('recommended');

  const list = useMemo(() => {
    const out = tours.filter(
      (x) =>
        (hub === 'all' || x.hub === hub) &&
        (interest === 'all' || x.bestFor.includes(interest)) &&
        (len === 'all' || (len === 'short' ? x.days <= 2 : x.days >= 3)),
    );
    if (sort === 'price-asc') out.sort((a, b) => a.priceKzt - b.priceKzt);
    if (sort === 'price-desc') out.sort((a, b) => b.priceKzt - a.priceKzt);
    if (sort === 'short') out.sort((a, b) => a.days - b.days);
    return out;
  }, [hub, interest, len, sort]);

  const reset = () => {
    setHub('all');
    setInterest('all');
    setLen('all');
    setSort('recommended');
  };
  const filtered = hub !== 'all' || interest !== 'all' || len !== 'all';

  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip shrink-0 ${on ? '!border-teal !bg-teal !text-tealInk' : ''}`}>
      {children}
    </button>
  );

  return (
    <>
      <PageHead loop={0} scope="mvp" title={t(ui.tour.toursTitle)} sub={t(ui.tour.toursLead)}>
        <Tag kind="demo" extra={t({ en: 'prices and details', zh: '价格与详情' })} />
      </PageHead>

      <div className="container-x mt-6">
        <div className="card space-y-3 p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={t(ui.tour.starts)}>
            <span className="shrink-0 text-xs text-muted">{t(ui.tour.starts)}</span>
            <Chip on={hub === 'all'} onClick={() => setHub('all')}>{t({ en: 'Anywhere', zh: '全部' })}</Chip>
            {(['almaty', 'astana', 'turkestan'] as Hub[]).map((h) => (
              <Chip key={h} on={hub === h} onClick={() => setHub(h)}>{t(hubName[h])}</Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={t({ en: 'Interest', zh: '兴趣' })}>
            <span className="shrink-0 text-xs text-muted">{t({ en: 'Interest', zh: '兴趣' })}</span>
            <Chip on={interest === 'all'} onClick={() => setInterest('all')}>{t({ en: 'All', zh: '全部' })}</Chip>
            {(Object.keys(interestText) as Interest[]).map((i) => (
              <Chip key={i} on={interest === i} onClick={() => setInterest(i)}>{t(interestText[i])}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={t({ en: 'Length', zh: '天数' })}>
              <span className="shrink-0 text-xs text-muted">{t({ en: 'Length', zh: '天数' })}</span>
              <Chip on={len === 'all'} onClick={() => setLen('all')}>{t({ en: 'Any', zh: '不限' })}</Chip>
              <Chip on={len === 'short'} onClick={() => setLen('short')}>{t({ en: '2 days', zh: '2天' })}</Chip>
              <Chip on={len === 'long'} onClick={() => setLen('long')}>{t({ en: '3+ days', zh: '3天以上' })}</Chip>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t({ en: 'Sort', zh: '排序' })}</span>
              <select className="input !w-auto !py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recommended">{t({ en: 'Recommended', zh: '推荐' })}</option>
                <option value="price-asc">{t({ en: 'Price: low to high', zh: '价格从低到高' })}</option>
                <option value="price-desc">{t({ en: 'Price: high to low', zh: '价格从高到低' })}</option>
                <option value="short">{t({ en: 'Shortest first', zh: '天数最短' })}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-muted" aria-live="polite">
          <span>
            <span className="num font-semibold text-ink">{list.length}</span> {t({ en: list.length === 1 ? 'tour' : 'tours', zh: '条线路' })}
          </span>
          {filtered && (
            <button type="button" className="font-semibold text-teal hover:underline" onClick={reset}>
              {t({ en: 'Clear filters', zh: '清除筛选' })}
            </button>
          )}
        </div>
      </div>

      <div className="container-x mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-5 sm:grid-cols-2">
          {list.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
          {list.length === 0 && (
            <div className="card col-span-full grid place-items-center gap-3 p-10 text-center">
              <Icon name="compass" size={36} className="text-teal" />
              <p className="font-semibold">{t({ en: 'No tour matches all filters.', zh: '没有符合全部条件的线路。' })}</p>
              <button type="button" className="btn-primary btn-sm" onClick={reset}>
                {t({ en: 'Clear filters', zh: '清除筛选' })}
              </button>
            </div>
          )}
        </div>
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <RouteMap highlight={list.map((x) => x.id)} />
        </aside>
      </div>
    </>
  );
}
