import Image from 'next/image';
import { AVATAR_DIMAS_URL } from './assets';
import { Icon } from '../icon';

function Stars() {
  return (
    <div className="mb-4 flex items-center text-amber-500" role="img" aria-label="Rating 5 dari 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" filled className="text-[20px]" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="kisah-sukses" className="scroll-mt-24 border-t border-lp-surface-container bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-lp-primary">
            Kisah Sukses Mitra
          </span>
          <h2 className="mb-4 mt-2 text-2xl font-bold text-lp-on-surface sm:text-3xl lg:text-4xl">
            Terbukti Membantu Pemilik Usaha Kuliner Nyata
          </h2>
          <p className="text-base text-lp-on-surface-variant">
            Dengar langsung cerita pebisnis F&amp;B yang berhasil merapikan operasional
            kasir dan memangkas biaya bahan terbuang.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <figure className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-lp-surface-low p-8">
            <div>
              <Stars />
              <blockquote className="mb-6 text-sm italic leading-relaxed text-lp-on-surface">
                &ldquo;Sebelum pakai Tumbuh, stok susu segar dan sirup kami sering tekor
                tiap tutup buku mingguan. Begitu resep BOM terkunci di sistem, HPP Kala
                Senja terjaga stabil di angka 29% dan profit bersih naik nyata.&rdquo;
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-3 border-t border-lp-surface-container pt-6">
              <Image
                alt="Foto Dimas Pratama"
                src={AVATAR_DIMAS_URL}
                width={96}
                height={96}
                className="h-12 w-12 rounded-full object-cover shadow-sm"
              />
              <div>
                <h4 className="text-sm font-bold text-lp-on-surface">Dimas Pratama</h4>
                <p className="text-xs text-lp-tertiary">Founder Kala Senja Coffee (3 Cabang)</p>
              </div>
            </figcaption>
          </figure>

          <figure className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-lp-surface-low p-8">
            <div>
              <Stars />
              <blockquote className="mb-6 text-sm italic leading-relaxed text-lp-on-surface">
                &ldquo;Fitur split bill meja dan operasional shift kasirnya sangat
                memanjakan waiter di jam ramai makan malam. Tamu senang tidak antre bayar
                lama, dan closing shift sekarang beres dalam 5 menit.&rdquo;
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-3 border-t border-lp-surface-container pt-6">
              <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-lp-primary/15 text-sm font-bold text-lp-primary">
                NS
              </div>
              <div>
                <h4 className="text-sm font-bold text-lp-on-surface">Nadia Salsabila</h4>
                <p className="text-xs text-lp-tertiary">Owner Dapur Sedap Rasa (Bandung)</p>
              </div>
            </figcaption>
          </figure>

          <figure className="flex flex-col justify-between rounded-2xl border border-lp-surface-container bg-lp-surface-low p-8">
            <div>
              <Stars />
              <blockquote className="mb-6 text-sm italic leading-relaxed text-lp-on-surface">
                &ldquo;Presisi resep gramaturnya luar biasa. Tepung protein tinggi dan
                butter impor kami langsung terpotong akurat setiap batch baking selesai.
                Kebocoran bahan baku mentah berkurang sampai 80%.&rdquo;
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-3 border-t border-lp-surface-container pt-6">
              <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-lp-secondary">
                HW
              </div>
              <div>
                <h4 className="text-sm font-bold text-lp-on-surface">Hendra Wijaya</h4>
                <p className="text-xs text-lp-tertiary">Ops Manager Roti Kencana (Surabaya)</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
