import { Logo } from '../components/Layout';
import { Scene } from '../components/Scene';
import { photosFor } from '../data/photos';
import { tours } from '../data/tours';
import { referralUrl } from '../lib/qr';
import { QR } from './Postcard';

// Print-only route (#/print/postcards): one A6 landscape postcard per tour,
// 148 × 105 mm trim + 3 mm bleed on every side = 154 × 111 mm pages.
// scripts/build-postcards.cjs prints it to submission/stage2/postcards.pdf.
// Only photos bundled in the build are used, so the credit line always matches
// what is printed; otherwise the SVG illustration is used and credited as such.

export const POSTCARD_REF = (tour: string) => `PRINT-${tour.toUpperCase()}`;

export default function PrintPostcards() {
  return (
    <div className="print-cards bg-white text-[#12213f]">
      <style>{`
        @page { size: 154mm 111mm; margin: 0; }
        html, body { margin: 0; background: #fff; }
        .print-cards .card6 { width: 154mm; height: 111mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; background: #fbf6ea; }
        .print-cards .card6:last-child { break-after: auto; page-break-after: auto; }
      `}</style>
      {tours.map((tour) => {
        const photo = photosFor(tour.id).find((p) => !/^https?:/.test(p.src));
        const link = referralUrl(tour.id, POSTCARD_REF(tour.id));
        return (
          <section key={tour.id} className="card6" data-card={tour.id}>
            {/* Photo bleeds off the left, top and bottom edges. */}
            <div className="absolute inset-y-0 left-0" style={{ width: '91mm' }}>
              {photo ? <img src={photo.src} alt="" className="h-full w-full object-cover" /> : <Scene id={tour.id} />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent" style={{ padding: '12mm 7mm 8mm 7mm' }}>
                <div className="font-display font-extrabold leading-tight text-white" style={{ fontSize: '15pt' }}>{tour.name.en}</div>
                <div className="font-semibold text-white/90" lang="zh-CN" style={{ fontSize: '10pt' }}>{tour.name.zh}</div>
              </div>
            </div>
            {/* Text side: everything inside the 3 mm bleed + 4 mm safe margin. */}
            <div className="absolute flex flex-col" style={{ left: '97mm', right: '7mm', top: '9mm', bottom: '12.5mm' }}>
              <h1 className="font-display font-extrabold leading-[1.05]" style={{ fontSize: '17pt', fontStretch: '112%' }}>Kazakhstan, booked in three clear steps</h1>
              <p className="mt-1 font-semibold" lang="zh-CN" style={{ fontSize: '9.5pt' }}>哈萨克斯坦，三步轻松预订</p>
              <div className="mt-auto flex items-end gap-2">
                <div className="shrink-0 bg-white" style={{ width: '24mm', height: '24mm' }}>
                  <QR text={link} label={`QR: ${link}`} />
                </div>
                <div className="leading-tight" style={{ fontSize: '6.5pt' }}>
                  <div className="font-semibold">Scan: tour page, EN / 中文</div>
                  <div className="mt-0.5 text-[#5c6270]">扫码查看线路</div>
                </div>
              </div>
              <div className="mt-2 scale-90 origin-left"><Logo /></div>
            </div>
            <p className="absolute text-[#5c6270]" style={{ left: '97mm', right: '7mm', bottom: '7mm', fontSize: '4.8pt', lineHeight: 1.25 }} data-credit>
              {photo
                ? `Photo: ${photo.credit.title ?? photo.file}, ${photo.credit.author}, ${photo.credit.license}, via Wikimedia Commons. Shows the place, not a Saryarqa Routes tour.`
                : 'Illustration: Saryarqa Go. QR opens the prototype (demo data).'}
            </p>
          </section>
        );
      })}
    </div>
  );
}
