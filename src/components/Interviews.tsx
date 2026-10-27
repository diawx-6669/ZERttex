import { interviews } from '../data/interviews';
import { useApp } from '../state';
import { Section } from './Layout';
import { Tag } from './Tag';

/** "What travelers told us": real interview quotes only. Renders nothing while src/data/interviews.ts is empty. */
export function TravelerVoices() {
  const { t } = useApp();
  const shown = interviews.filter((i) => i.consent);
  if (shown.length === 0) return null;
  return (
    <Section
      id="voices"
      title={t({ en: 'What travelers told us', zh: '旅客怎么说' })}
      sub={t({ en: `${shown.length} interviews with independent travelers. Quotes shown with permission; no names.`, zh: `${shown.length} 位自由行旅客访谈。引用已获同意，不显示姓名。` })}
    >
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <li key={i.id} className="card flex flex-col gap-3 p-5">
            <p className="font-display text-lg font-semibold leading-snug">“{t(i.quote)}”</p>
            <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{t(i.who)}</span>
              <span>· {i.date}</span>
              <span>· {i.method}</span>
              <Tag kind="verified" extra={t({ en: 'team interview', zh: '团队访谈' })} />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
