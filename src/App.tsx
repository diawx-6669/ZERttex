import { useEffect } from 'react';
import { ChatDrawer } from './components/Chat';
import { JudgeMode } from './components/JudgeMode';
import { FloatingActions, Footer, Header, MobileNav, Toasts } from './components/Layout';
import { useRoute } from './lib/router';
import { useApp } from './state';
import { ui } from './data/i18n';
import Home from './pages/Home';
import Tours from './pages/Tours';
import TourDetail from './pages/TourDetail';
import Plan from './pages/Plan';
import Ask from './pages/Ask';
import Trust from './pages/Trust';
import Book from './pages/Book';
import Trip from './pages/Trip';
import Postcard from './pages/Postcard';
import Impact from './pages/Impact';
import About from './pages/About';
import PrintPostcards from './pages/PrintPostcards';
import Manager from './pages/Manager';

export default function App() {
  const route = useRoute();
  const { t } = useApp();
  const [first = '', second] = route.path;

  let page: JSX.Element;
  switch (first) {
    case '':
      page = <Home query={route.query} />;
      break;
    case 'tours':
      page = <Tours />;
      break;
    case 'tour':
      // Postcard QR codes: #/tour/<id>?ref=<code>, or the hash-safe #/tour/<id>/r/<code>.
      page = <TourDetail id={second} refCode={route.query.get('ref') ?? (route.path[2] === 'r' ? decodeURIComponent(route.path[3] ?? '') || null : null)} />;
      break;
    case 'plan':
      page = <Plan />;
      break;
    case 'ask':
      page = <Ask query={route.query} />;
      break;
    case 'trust':
      page = <Trust />;
      break;
    case 'book':
      page = <Book query={route.query} />;
      break;
    case 'trip':
      page = <Trip />;
      break;
    case 'postcard':
      page = <Postcard />;
      break;
    case 'impact':
      page = <Impact />;
      break;
    case 'about':
      page = <About />;
      break;
    case 'manager':
      page = <Manager />;
      break;
    default:
      page = (
        <div className="container-x py-24 text-center">
          <h1 className="text-3xl font-extrabold">{t(ui.common.notFound)}</h1>
          <a className="btn-primary mt-6" href="#/">{t(ui.common.home)}</a>
        </div>
      );
  }

  // Scroll-reveal for sections marked data-reveal (skipped for reduced motion and automation).
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver;
    if (reduce || !('IntersectionObserver' in window)) {
      root.classList.remove('js-reveal');
      return;
    }
    root.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    const t = window.setTimeout(() => document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el)), 30);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, [route.raw]);

  // Print-only pages render without the app chrome.
  if (first === 'print') return <PrintPostcards />;

  return (
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-night focus:px-3 focus:py-2 focus:text-nightInk" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Header current={first} />
      <main id="main" tabIndex={-1} className="page-in flex-1 outline-none" key={route.raw.split('?')[0]}>
        {page}
      </main>
      <Footer />
      <FloatingActions current={first} />
      <MobileNav current={first} />
      <ChatDrawer />
      <JudgeMode />
      <Toasts />
    </div>
  );
}
