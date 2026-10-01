'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/icon';
import { formatIDR } from '@/lib/format';
import { useSelfOrderStore } from '@/stores/self-order-store';

export default function OrderStatusPage() {
  const params = useParams();
  const tableParam = (params?.table as string) || 'meja-08';

  const setTable = useSelfOrderStore((s) => s.setTable);
  const tableName = useSelfOrderStore((s) => s.tableName);
  const tableArea = useSelfOrderStore((s) => s.tableArea);
  const lines = useSelfOrderStore((s) => s.lines);
  const paymentStatus = useSelfOrderStore((s) => s.paymentStatus);
  const orderNumber = useSelfOrderStore((s) => s.orderNumber);
  const setPaymentSuccess = useSelfOrderStore((s) => s.setPaymentSuccess);

  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(14 * 60 + 45); // 14m 45s
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  useEffect(() => {
    setTable(tableParam);
  }, [tableParam, setTable]);

  // Countdown timer for QRIS
  useEffect(() => {
    if (paymentStatus === 'paid') return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentStatus]);

  const countdownText = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [countdown]);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const service = Math.round(subtotal * 0.05);
  const grandTotal = subtotal > 0 ? subtotal + tax + service : 151000;

  function handleSimulatePayment() {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setPaymentSuccess(orderNumber || '#ORD-2026-0850');
    }, 1800);
  }

  function handleCallWaiter() {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-lp-sans antialiased flex justify-center py-0 sm:py-6">
      {/* Mobile Smartphone Frame Container */}
      <div className="w-full max-w-[440px] bg-[#F8FAFC] min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[36px] shadow-2xl border sm:border-slate-300/80 overflow-y-auto flex flex-col relative">
        
        {/* Device Top Status Bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 pt-3 pb-2.5 flex items-center justify-between text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-1.5 font-lp-mono">
            <span>12:42</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {tableName} • Dine-in
            </span>
            <div className="flex items-center gap-1 text-slate-600 pl-1">
              <Icon name="wifi" className="text-sm" />
              <Icon name="battery_full" className="text-sm" />
            </div>
          </div>
        </div>

        {/* Cafe Brand Bar */}
        <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lp-primary text-white flex items-center justify-center shadow-xs">
              <Icon name="spa" className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-slate-900 leading-none">
                  TUMBUH Coffee &amp; Eatery
                </h1>
                <Icon name="verified" className="text-emerald-700 text-sm" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Senopati Flagship • {tableArea}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-lp-primary border border-emerald-200 rounded-lg text-xs font-lp-mono font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {tableName}
            </span>
          </div>
        </div>

        {/* Scrollable Content Stack */}
        <div className="p-4 space-y-4 pb-20 flex-1">
          {/* ======================================================== */}
          {/* STATE 1: MODAL PEMBAYARAN QRIS DINAMIS DI MEJA (Q-04)   */}
          {/* ======================================================== */}
          {paymentStatus !== 'paid' ? (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
              {/* Header Pembayaran */}
              <div className="bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-lp-primary flex items-center justify-center font-bold">
                    <Icon name="qr_code_2" className="text-base" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                        Pembayaran {tableName}
                      </span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded font-lp-mono">
                        Q-04
                      </span>
                    </div>
                    <p className="text-[10px] font-lp-mono text-slate-500">
                      No. Pesanan:{' '}
                      <span className="font-bold text-slate-700">
                        {orderNumber || '#ORD-2026-0850'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Amber Countdown Badge */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs">
                  <Icon name="timer" className="text-xs text-amber-700" />
                  <span className="font-lp-mono">{countdownText}</span>
                </div>
              </div>

              {/* Total Tagihan Focus */}
              <div className="px-5 pt-4 pb-2 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Tagihan Dine-In
                </span>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="text-2xl font-black font-lp-mono text-lp-primary tracking-tight">
                    {formatIDR(grandTotal)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sudah termasuk PB1 Resto 10% &amp; Service Charge 5%
                </p>
              </div>

              {/* Official QRIS Card Wrapper */}
              <div className="px-4 py-2">
                <div className="bg-gradient-to-b from-white to-slate-50 p-4 rounded-2xl border-2 border-emerald-600/30 shadow-inner flex flex-col items-center relative">
                  {/* QRIS Brand Top Header */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-red-700 text-white font-black text-[11px] px-1.5 py-0.5 rounded tracking-tighter">
                        QRIS
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold tracking-tight text-slate-800 uppercase leading-none">
                          QR Indonesia Standar
                        </span>
                        <span className="text-[8px] text-slate-500 leading-none">
                          Pembayaran Nasional
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-lp-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Dinamis {tableName}
                    </div>
                  </div>

                  {/* High Contrast QR Code Vector Pattern */}
                  <div className="my-4 relative p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                    {/* Corner Scanner Accents */}
                    <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-lp-primary rounded-tl"></div>
                    <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-lp-primary rounded-tr"></div>
                    <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-lp-primary rounded-bl"></div>
                    <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-lp-primary rounded-br"></div>

                    {/* Vector QR Representation */}
                    <svg
                      className="w-44 h-44 sm:w-48 sm:h-48"
                      viewBox="0 0 200 200"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="200" height="200" fill="white" />
                      {/* Top-Left Finder */}
                      <rect x="15" y="15" width="45" height="45" rx="6" fill="#0F172A" />
                      <rect x="23" y="23" width="29" height="29" rx="3" fill="white" />
                      <rect x="29" y="29" width="17" height="17" rx="2" fill="#006948" />

                      {/* Top-Right Finder */}
                      <rect x="140" y="15" width="45" height="45" rx="6" fill="#0F172A" />
                      <rect x="148" y="23" width="29" height="29" rx="3" fill="white" />
                      <rect x="154" y="29" width="17" height="17" rx="2" fill="#006948" />

                      {/* Bottom-Left Finder */}
                      <rect x="15" y="140" width="45" height="45" rx="6" fill="#0F172A" />
                      <rect x="23" y="148" width="29" height="29" rx="3" fill="white" />
                      <rect x="29" y="154" width="17" height="17" rx="2" fill="#006948" />

                      {/* Data Clusters */}
                      <g fill="#0F172A">
                        <rect x="68" y="22" width="6" height="6" rx="1" />
                        <rect x="78" y="22" width="6" height="6" rx="1" />
                        <rect x="88" y="22" width="6" height="6" rx="1" />
                        <rect x="98" y="22" width="6" height="6" rx="1" />
                        <rect x="108" y="22" width="6" height="6" rx="1" />
                        <rect x="118" y="22" width="6" height="6" rx="1" />
                        <rect x="128" y="22" width="6" height="6" rx="1" />

                        <rect x="22" y="68" width="6" height="6" rx="1" />
                        <rect x="22" y="78" width="6" height="6" rx="1" />
                        <rect x="22" y="88" width="6" height="6" rx="1" />
                        <rect x="22" y="98" width="6" height="6" rx="1" />
                        <rect x="22" y="108" width="6" height="6" rx="1" />
                        <rect x="22" y="118" width="6" height="6" rx="1" />
                        <rect x="22" y="128" width="6" height="6" rx="1" />

                        <rect x="68" y="38" width="14" height="6" rx="1" />
                        <rect x="90" y="38" width="6" height="14" rx="1" />
                        <rect x="104" y="38" width="14" height="6" rx="1" />
                        <rect x="124" y="38" width="8" height="8" rx="1" />

                        <rect x="36" y="68" width="14" height="6" rx="1" />
                        <rect x="58" y="68" width="6" height="14" rx="1" />
                        <rect x="140" y="68" width="14" height="6" rx="1" />
                        <rect x="162" y="68" width="8" height="12" rx="1" />

                        <rect x="68" y="140" width="8" height="14" rx="1" />
                        <rect x="82" y="146" width="14" height="6" rx="1" />
                        <rect x="104" y="140" width="8" height="14" rx="1" />
                        <rect x="118" y="146" width="14" height="6" rx="1" />
                        <rect x="140" y="140" width="6" height="16" rx="1" />
                        <rect x="154" y="146" width="16" height="6" rx="1" />
                      </g>

                      {/* Center Brand Badge */}
                      <rect
                        x="82"
                        y="82"
                        width="36"
                        height="36"
                        rx="8"
                        fill="#006948"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <circle cx="100" cy="100" r="6" fill="white" />
                    </svg>
                  </div>

                  {/* Merchant Details */}
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">
                      NMID: ID1020268819201
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      TUMBUH COFFEE SENOPATI ({tableName.toUpperCase()})
                    </p>
                  </div>

                  {/* Payment Channel Badges */}
                  <div className="w-full mt-3 pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block text-center mb-1.5 uppercase tracking-wider">
                      Menerima Seluruh E-Wallet &amp; M-Banking
                    </span>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-extrabold text-blue-700 shadow-2xs">
                        BCA Mobile
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600 shadow-2xs">
                        GoPay
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-purple-700 shadow-2xs">
                        OVO
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-sky-600 shadow-2xs">
                        DANA
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-orange-600 shadow-2xs">
                        ShopeePay
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-amber-700 shadow-2xs">
                        Livin&apos; Mandiri
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Verification Button */}
              <div className="px-5 pb-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={verifying}
                  className="w-full py-3 px-4 rounded-xl bg-lp-primary hover:bg-lp-primary/90 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
                >
                  {verifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Pembayaran Otomatis...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="verified" className="text-base" />
                      <span>Saya Sudah Bayar (Konfirmasi Lunas)</span>
                    </>
                  )}
                </button>

                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Icon name="sync" className="text-xs" />
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-tight">
                    <span className="font-bold">Otomatis Terverifikasi!</span> Sistem
                    mendeteksi pembayaran dalam 3 detik tanpa perlu upload bukti transfer.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            /* ======================================================== */
            /* STATE 2: LIVE TRACKING STATUS DAPUR & BAR (Q-05)         */
            /* ======================================================== */
            <section className="bg-white rounded-2xl border-2 border-emerald-600/40 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* Success Banner */}
              <div className="bg-lp-primary text-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                      <Icon name="check_circle" className="text-lg" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 font-lp-mono">
                        Q-05 • LIVE ORDER TRACKER
                      </span>
                      <h2 className="text-sm font-extrabold text-white leading-tight">
                        Pembayaran Sukses!
                      </h2>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-400/40 text-[10px] font-bold text-white">
                    Pesanan Diproses
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-emerald-700/50 flex items-center justify-between text-xs text-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Icon name="room" className="text-sm text-emerald-300" />
                    <span>
                      Diantar ke{' '}
                      <strong className="text-white">
                        {tableName} ({tableArea})
                      </strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-lp-mono text-emerald-200 font-medium">
                    12:45 WIB
                  </span>
                </div>
              </div>

              {/* Estimated Waiting Time Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center justify-center text-lp-primary">
                      <Icon name="outdoor_grill" className="text-2xl" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Perkiraan Waktu Penyajian
                      </span>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 font-lp-mono">
                          8 – 10 Menit
                        </h3>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-1 rounded-lg font-lp-mono">
                      Tepat Waktu (98%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Step Vertical Progress Stepper */}
              <div className="p-4 space-y-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Alur Proses Dapur &amp; Bar
                </span>

                <div className="relative pl-7 space-y-5">
                  <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-slate-200" />
                  <div className="absolute left-3 top-2.5 h-16 w-0.5 bg-lp-primary" />

                  {/* Step 1: Done */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-7 mt-0.5 w-6 h-6 rounded-full bg-lp-primary text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs">
                      <Icon name="done" className="text-sm" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          Pesanan Diterima Kasir &amp; Cloud
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Tiket KDS otomatis terdistribusi ke dapur &amp; bar
                        </p>
                      </div>
                      <span className="text-[10px] font-lp-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        12:42 WIB
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Active */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-7 mt-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-100 shadow-xs animate-pulse">
                      <Icon name="skillet" className="text-sm" />
                    </div>
                    <div className="flex-1 bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-950 leading-tight flex items-center gap-1.5">
                          Sedang Dimasak &amp; Diseduh Barista
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-600 text-white rounded">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-800 mt-0.5">
                        Barista &amp; Chef sedang memproses item pesanan Anda
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Pending */}
                  <div className="relative flex items-start gap-3 opacity-60">
                    <div className="absolute -left-7 mt-0.5 w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs ring-4 ring-white">
                      <Icon name="fact_check" className="text-sm" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-slate-700 leading-tight">
                        Pengecekan Kualitas Akhir (Quality Control)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Verifikasi kelengkapan menu &amp; garnishing
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Pending */}
                  <div className="relative flex items-start gap-3 opacity-60">
                    <div className="absolute -left-7 mt-0.5 w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs ring-4 ring-white">
                      <Icon name="room_service" className="text-sm" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-slate-700 leading-tight">
                        Diantar Waiter ke {tableName}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Runner siap menyajikan hangat di meja Anda
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Item Breakdown */}
              <div className="px-4 pb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Status Item per Stasiun KDS
                    </span>
                    <span className="text-[10px] font-lp-mono text-slate-500">
                      {lines.length} Menu Terdaftar
                    </span>
                  </div>

                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                          <Icon
                            name={
                              idx === 0
                                ? 'local_cafe'
                                : idx === 1
                                  ? 'breakfast_dining'
                                  : 'bakery_dining'
                            }
                            className="text-base"
                          />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {line.qty}x {line.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {line.options.cupSizeLabel} • {line.options.milkLabel}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                          idx === 2
                            ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                            : 'text-amber-800 bg-amber-100/80 border-amber-200'
                        }`}
                      >
                        {idx === 2 ? (
                          <>
                            <Icon name="done" className="text-xs text-emerald-700" />
                            <span>Selesai Hangat</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            <span>{idx === 0 ? 'Diracik Barista' : 'Dimasak Chef'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Dining Actions */}
              <div className="p-4 pt-1 border-t border-slate-100 space-y-2.5 bg-white">
                {/* Call Waiter */}
                <button
                  type="button"
                  onClick={handleCallWaiter}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-98"
                >
                  <Icon name="notifications_active" className="text-base" />
                  <span>
                    {waiterCalled
                      ? 'Waiter Segera Menuju ke Meja Anda...'
                      : `Panggil Waiter / Pelayan ${tableName}`}
                  </span>
                </button>

                {/* Digital E-Receipt */}
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-lp-primary font-bold text-xs border border-emerald-200 shadow-2xs transition"
                >
                  <Icon name="receipt_long" className="text-base" />
                  <span>Lihat E-Receipt Struk Digital Resmi</span>
                </button>

                {/* Add More Items Link */}
                <div className="pt-1 text-center">
                  <Link
                    href={`/order/${tableParam}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-lp-primary hover:underline"
                  >
                    <span>+ Tambah Pesanan Lain ke {tableName}</span>
                    <Icon name="arrow_forward" className="text-sm" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Support & WiFi Footer Card */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Butuh bantuan barista atau waiter?</p>
            <p className="text-[11px]">
              Sampaikan kepada tim kami di lantai {tableArea} atau panggil lewat tombol di atas.
            </p>
            <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-lp-mono">
              <span>
                WiFi: <strong className="text-slate-600">TUMBUH_GUEST</strong>
              </span>
              <span>•</span>
              <span>
                Password: <strong className="text-slate-600">kopienak2026</strong>
              </span>
            </div>
          </div>
        </div>

        {/* E-Receipt Modal */}
        {showReceiptModal && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowReceiptModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 font-lp-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center pb-2 border-b border-slate-200">
                <span className="font-extrabold text-sm text-slate-900 block">
                  TUMBUH COFFEE &amp; EATERY
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Senopati Flagship · Jakarta Selatan
                </span>
                <span className="text-[10px] font-lp-mono text-slate-400 mt-1 block">
                  {orderNumber || '#ORD-2026-0850'} • {tableName}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs py-1">
                {lines.map((l) => (
                  <div key={l.id} className="py-1.5 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        {l.qty}x {l.name}
                      </span>
                      {l.options.notes && (
                        <p className="text-[10px] text-slate-400">({l.options.notes})</p>
                      )}
                    </div>
                    <span className="font-lp-mono text-slate-800">
                      {formatIDR(l.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-lp-mono">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PB1 Resto (10%)</span>
                  <span className="font-lp-mono">{formatIDR(tax)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service (5%)</span>
                  <span className="font-lp-mono">{formatIDR(service)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-100">
                  <span>Total Tagihan Lunas</span>
                  <span className="font-lp-mono text-lp-primary">
                    {formatIDR(grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Metode Bayar</span>
                  <span className="font-semibold text-slate-700">QRIS Dinamis (Lunas ✓)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full mt-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
              >
                Tutup E-Receipt
              </button>
            </div>
          </div>
        )}

        {/* Sticky Bottom Navigation Bar */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-slate-600 text-xs">
          <Link
            href={`/order/${tableParam}`}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900"
          >
            <Icon name="restaurant_menu" className="text-xl" />
            <span className="text-[10px] font-medium">Buku Menu</span>
          </Link>
          <Link
            href={`/order/${tableParam}`}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900"
          >
            <Icon name="shopping_cart" className="text-xl" />
            <span className="text-[10px] font-medium">Keranjang</span>
          </Link>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5 text-lp-primary font-bold"
          >
            <Icon name="track_changes" className="text-xl" />
            <span className="text-[10px]">Status Pesanan</span>
          </button>
          <button
            type="button"
            onClick={handleCallWaiter}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900"
          >
            <Icon name="help_outline" className="text-xl" />
            <span className="text-[10px] font-medium">Bantuan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
