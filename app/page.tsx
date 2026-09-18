import type { Metadata } from 'next';
import { jetbrainsMono, plusJakarta } from '@/lib/fonts';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { SocialProof } from '@/components/landing/social-proof';
import { Comparison } from '@/components/landing/comparison';
import { Features } from '@/components/landing/features';
import { Calculator } from '@/components/landing/calculator';
import { Testimonials } from '@/components/landing/testimonials';
import { Pricing } from '@/components/landing/pricing';
import { Faq } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Tumbuh POS & Backoffice - Solusi POS & HPP Terpadu F&B Indonesia',
  description:
    'Platform all-in-one POS Kasir, kalkulasi HPP & Resep BOM otomatis real-time, laporan keuangan terpadu, serta manajemen multi-cabang untuk bisnis kuliner modern.',
};

export default function LandingPage() {
  return (
    <div
      className={`landing font-lp-sans bg-lp-background text-lp-on-surface antialiased selection:bg-lp-primary/20 selection:text-lp-primary ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Comparison />
        <Features />
        <Calculator />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
