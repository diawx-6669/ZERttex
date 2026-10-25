import { useEffect, useRef } from 'react';
import { ChatPanel, tourQuestion, useChat } from '../components/Chat';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/Layout';
import { ui } from '../data/i18n';
import { tourById } from '../data/tours';
import { useApp } from '../state';

export default function Ask({ query }: { query: URLSearchParams }) {
  const { t, lang } = useApp();
  const { ask } = useChat();
  const asked = useRef(false);

  // Auto-ask about a tour (or a passed question) when arriving with a query.
  useEffect(() => {
    if (asked.current) return;
    const id = query.get('tour');
    const q = query.get('q');
    if (id && tourById(id)) {
      asked.current = true;
      ask(tourQuestion(id, lang));
    } else if (q) {
      asked.current = true;
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHead loop={2} title={t(ui.ask.title)} sub={t(ui.ask.sub)}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-teal px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-teal">
          <Icon name="info" size={13} /> {t(ui.ask.scripted)}
        </span>
      </PageHead>

      <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <ChatPanel className="card h-[min(72vh,680px)] min-h-[460px]" />

        <aside className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-bold">{t({ en: 'How this concierge behaves', zh: '助手的行为准则' })}</h2>
            <ul className="space-y-2 text-muted">
              {[
                { en: 'Detects English or Chinese from your question and replies in the same language.', zh: '自动识别中文或英文提问，并用同一语言回复。' },
                { en: 'Answers only from tour data and the verified visa source.', zh: '仅依据线路数据和已核实的签证来源回答。' },
                { en: 'Never invents availability, discounts, licences or insurance.', zh: '绝不编造余位、折扣、许可证或保险信息。' },
                { en: 'When unsure, says "I won’t guess" and hands you to a manager.', zh: '不确定时会说"我不会乱猜"，并为您转接人工。' },
                { en: 'Also available from any page: tap the chat button in the corner.', zh: '在任何页面都能使用：点击角落的聊天按钮。' },
              ].map((x, i) => (
                <li key={i} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-0.5 text-teal" />
                  {t(x)}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 text-sm">
            <h2 className="mb-2 font-display text-lg font-bold">{t({ en: 'Try these', zh: '试试这些' })}</h2>
            <div className="flex flex-wrap gap-1.5">
              {['科尔赛湖包含什么？', 'Is Kolsai available on 3 May?', '有中文导游吗？', 'Can I get a discount?', '护照需要吗？'].map((c) => (
                <button key={c} type="button" className="chip !min-h-[32px] text-xs" onClick={() => ask(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
