import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

// Landing-page typefaces. Applied via CSS variables on the landing root so
// the POS/backoffice shell keeps using Geist.
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-landing-sans',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-landing-mono',
  display: 'swap',
});
