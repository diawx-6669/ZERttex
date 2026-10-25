import { PageHead } from '../components/Layout';
import { Tag } from '../components/Tag';
import { TourCard } from '../components/TourParts';
import { ui } from '../data/i18n';
import { tours } from '../data/tours';
import { useApp } from '../state';

export default function Tours() {
  const { t } = useApp();
  return (
    <>
      <PageHead loop={0} title={t(ui.tour.toursTitle)} sub={t(ui.tour.toursLead)}>
        <Tag kind="demo" extra={t({ en: 'prices and details', zh: '价格与详情' })} />
      </PageHead>
      <div className="container-x mt-8 grid gap-5 sm:grid-cols-2">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </>
  );
}
