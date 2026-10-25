import { Footer, Header, Toasts } from './components/Layout';
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
      page = <TourDetail id={second} />;
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
    default:
      page = (
        <div className="container-x py-24 text-center">
          <h1 className="text-3xl font-extrabold">{t(ui.common.notFound)}</h1>
          <a className="btn-primary mt-6" href="#/">{t(ui.common.home)}</a>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-night focus:px-3 focus:py-2 focus:text-nightInk" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Header current={first} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none" key={route.raw.split('?')[0]}>
        {page}
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}
