'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Overlay } from '@/components/overlay';
import {
  accountingProvider,
  createExpense,
  createSupplierInvoice,
  deleteExpense,
  listExpenses,
  listOrders,
  listSupplierInvoices,
  listSuppliersPage,
  paySupplierInvoice,
  previewJournals,
  settleCreditOrder,
  syncJournals,
} from '@/lib/api';
import { formatIDR, formatNumber, monthISO, todayISO } from '@/lib/format';
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  type SupplierInvoice,
} from '@/lib/types';
import { ExpenseFormModal, toExpenseInput, type ExpenseFormValues } from './expense-form';
import { InvoiceFormModal, toInvoicePayload, type InvoiceFormValues } from './invoice-form';

type Tab = 'pengeluaran' | 'hutang' | 'piutang' | 'akuntansi';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'pengeluaran', label: 'Pengeluaran' },
  { id: 'hutang', label: 'Hutang Supplier' },
  { id: 'piutang', label: 'Piutang' },
  { id: 'akuntansi', label: 'Akuntansi' },
];

const PANEL = 'rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm';
const inputCls =
  'h-10 rounded-lg border border-lp-outline-variant bg-lp-surface-container-lowest px-3 text-sm font-medium text-lp-on-surface outline-none focus:border-lp-primary';

const INVOICE_STATUS_LABEL: Record<string, string> = {
  unpaid: 'Belum bayar',
  partial: 'Sebagian',
  paid: 'Lunas',
};

export function FinanceView() {
  const [tab, setTab] = useState<Tab>('pengeluaran');

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-lp-on-surface">Keuangan</h1>
          <p className="text-sm text-lp-on-surface-variant">
            Pengeluaran, hutang supplier, piutang, dan sinkron akuntansi.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Bagian keuangan">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-lp-primary text-lp-on-primary'
                  : 'text-lp-on-surface-variant hover:bg-lp-surface-low hover:text-lp-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'pengeluaran' && <ExpensePanel />}
      {tab === 'hutang' && <PayablePanel />}
      {tab === 'piutang' && <ReceivablePanel />}
      {tab === 'akuntansi' && <AccountingPanel />}
    </section>
  );
}

function ExpensePanel() {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState(`${monthISO()}-01`);
  const [dateTo, setDateTo] = useState(todayISO());
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['expenses', dateFrom, dateTo, category, page],
    queryFn: () =>
      listExpenses({
        dateFrom,
        dateTo,
        category: category || undefined,
        page,
        limit: 20,
      }),
  });
  const data = listQ.data;

  const createM = useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      createExpense(toExpenseInput(values)),
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal menghapus.'),
  });

  const total = (data?.items ?? []).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Dari
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <label className="text-xs font-semibold text-lp-on-surface-variant">
          Sampai
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className={`ml-2 ${inputCls}`}
          />
        </label>
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          aria-label="Filter kategori"
          className={inputCls}
        >
          <option value="">Semua kategori</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container"
        >
          <Icon name="add" className="text-[16px]" />
          Catat Pengeluaran
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {listQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-lp-error">
          {listQ.error instanceof Error
            ? listQ.error.message
            : 'Gagal memuat pengeluaran.'}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada pengeluaran pada rentang ini.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Tanggal</th>
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2">Jenis</th>
                  <th className="pb-2">Keterangan</th>
                  <th className="pb-2 text-right">Jumlah</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="border-t border-lp-surface-container">
                    <td className="py-2 font-lp-mono text-lp-on-surface-variant">
                      {row.expenseDate}
                    </td>
                    <td className="py-2 text-lp-on-surface">
                      {expenseCategoryLabel(row.category)}
                    </td>
                    <td className="py-2 text-lp-on-surface-variant">
                      {row.costType === 'fixed' ? 'Tetap' : 'Variabel'}
                    </td>
                    <td className="py-2 text-lp-on-surface-variant">
                      {row.description ?? '—'}
                    </td>
                    <td className="py-2 text-right font-lp-mono font-semibold text-lp-on-surface">
                      {formatIDR(row.amount)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        aria-label="Hapus"
                        onClick={() => setExpenseToDelete(row.id)}
                        className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-lp-surface-container">
                  <td colSpan={4} className="py-2 text-right text-xs font-semibold text-lp-tertiary">
                    Total halaman ini
                  </td>
                  <td className="py-2 text-right font-lp-mono font-bold text-lp-on-surface">
                    {formatIDR(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-lp-on-surface-variant">
              <span>
                {formatNumber(data.total)} catatan · halaman {data.page}/
                {data.totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-lp-outline-variant px-2.5 py-1 font-semibold disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-lp-outline-variant px-2.5 py-1 font-semibold disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ExpenseFormModal
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}

      <ConfirmDialog
        open={expenseToDelete !== null}
        title="Hapus Catatan Pengeluaran?"
        description="Data pencatatan biaya pengeluaran ini akan dihapus dari laporan keuangan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteM.mutate(expenseToDelete, {
              onSettled: () => setExpenseToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}

function PayablePanel() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState<SupplierInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invoicesQ = useQuery({
    queryKey: ['supplier-invoices', status],
    queryFn: () => listSupplierInvoices({ status: status || undefined }),
  });
  const suppliersQ = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => listSuppliersPage({ page: 1, limit: 100 }),
  });
  const invoices = invoicesQ.data ?? [];
  const suppliers = suppliersQ.data?.items ?? [];

  const totalInvoice = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = totalInvoice - totalPaid;

  const createM = useMutation({
    mutationFn: (values: InvoiceFormValues) => {
      const payload = toInvoicePayload(values);
      return createSupplierInvoice(payload.supplierId, {
        invoiceNumber: payload.invoiceNumber,
        totalAmount: payload.totalAmount,
        dueDate: payload.dueDate,
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal mencatat hutang.'),
  });

  return (
    <div className={PANEL}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter status"
          className={inputCls}
        >
          <option value="">Semua status</option>
          <option value="unpaid">Belum bayar</option>
          <option value="partial">Sebagian</option>
          <option value="paid">Lunas</option>
        </select>
        <button
          type="button"
          disabled={suppliers.length === 0}
          onClick={() => {
            setError(null);
            setShowForm(true);
          }}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-lg bg-lp-primary px-3 text-xs font-bold text-lp-on-primary transition hover:bg-lp-primary-container disabled:opacity-60"
        >
          <Icon name="add" className="text-[16px]" />
          Catat Hutang
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {invoicesQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : invoicesQ.isError ? (
        <p className="text-sm text-lp-error">
          {invoicesQ.error instanceof Error
            ? invoicesQ.error.message
            : 'Gagal memuat hutang.'}
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Belum ada hutang supplier.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex flex-col rounded-lg bg-lp-surface-low px-3 py-2">
              <span className="text-[11px] font-semibold text-lp-tertiary">
                Total Tagihan
              </span>
              <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
                {formatIDR(totalInvoice)}
              </span>
            </div>
            <div className="flex flex-col rounded-lg bg-lp-surface-low px-3 py-2">
              <span className="text-[11px] font-semibold text-lp-tertiary">
                Sudah Dibayar
              </span>
              <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
                {formatIDR(totalPaid)}
              </span>
            </div>
            <div className="flex flex-col rounded-lg bg-lp-error-container/40 px-3 py-2">
              <span className="text-[11px] font-semibold text-lp-on-error-container">
                Sisa Hutang{status ? ' (terfilter)' : ''}
              </span>
              <span className="font-lp-mono text-sm font-bold text-lp-error">
                {formatIDR(outstanding)}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Supplier</th>
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Jatuh tempo</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Dibayar</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-lp-surface-container">
                  <td className="py-2.5 text-lp-on-surface">
                    {invoice.supplierName}
                  </td>
                  <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
                    {invoice.invoiceNumber ?? '—'}
                  </td>
                  <td className="py-2.5 font-lp-mono text-lp-on-surface-variant">
                    {invoice.dueDate ? invoice.dueDate.slice(0, 10) : '—'}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono text-lp-on-surface">
                    {formatIDR(invoice.totalAmount)}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono text-lp-on-surface-variant">
                    {formatIDR(invoice.paidAmount)}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
                          : invoice.status === 'partial'
                            ? 'bg-lp-secondary-container/40 text-lp-on-secondary-container'
                            : 'bg-lp-error-container text-lp-on-error-container'
                      }`}
                    >
                      {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {invoice.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => setPaying(invoice)}
                        className="rounded-lg bg-lp-surface-container-high px-2.5 py-1 text-xs font-semibold text-lp-on-surface"
                      >
                        Bayar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {showForm && (
        <InvoiceFormModal
          suppliers={suppliers}
          pending={createM.isPending}
          errorMessage={error}
          onClose={() => setShowForm(false)}
          onSubmit={(values) => createM.mutate(values)}
        />
      )}

      {paying && (
        <PayInvoiceModal
          invoice={paying}
          onClose={() => setPaying(null)}
          onPaid={() => {
            setPaying(null);
            void queryClient.invalidateQueries({
              queryKey: ['supplier-invoices'],
            });
          }}
        />
      )}
    </div>
  );
}

function PayInvoiceModal({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: SupplierInvoice;
  onClose: () => void;
  onPaid: () => void;
}) {
  const outstanding = invoice.totalAmount - invoice.paidAmount;
  const [amount, setAmount] = useState(String(outstanding));
  const [error, setError] = useState<string | null>(null);

  const payM = useMutation({
    mutationFn: () => paySupplierInvoice(invoice.id, Number(amount)),
    onSuccess: () => onPaid(),
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal membayar.'),
  });

  const invalid = !(Number(amount) > 0) || Number(amount) > outstanding;

  return (
    <Overlay
      title="Bayar Hutang"
      subtitle={invoice.supplierName}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-lp-on-surface-variant">Sisa hutang</span>
          <span className="font-lp-mono font-semibold text-lp-on-surface">
            {formatIDR(outstanding)}
          </span>
        </div>
        <div>
          <label
            htmlFor="pay-amount"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-tertiary"
          >
            Jumlah bayar
          </label>
          <input
            id="pay-amount"
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-lg border border-lp-outline-variant px-3 py-2.5 text-sm outline-none focus:border-lp-primary"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-lp-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={payM.isPending || invalid}
            onClick={() => payM.mutate()}
            className="rounded-lg bg-lp-primary px-5 py-2.5 text-sm font-bold text-lp-on-primary disabled:opacity-60"
          >
            {payM.isPending ? 'Memproses…' : 'Bayar'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function ReceivablePanel() {
  const queryClient = useQueryClient();
  const ordersQ = useQuery({
    queryKey: ['orders', 'credit'],
    queryFn: () => listOrders({ paymentStatus: 'credit' }),
  });
  const [error, setError] = useState<string | null>(null);
  const orders = ordersQ.data ?? [];

  const totalReceivable = orders.reduce((s, o) => s + o.total, 0);

  const settleM = useMutation({
    mutationFn: (id: string) => settleCreditOrder(id),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['orders', 'credit'] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal melunasi piutang.'),
  });

  return (
    <div className={PANEL}>
      <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
        Piutang Pelanggan
      </h2>

      {error && (
        <p role="alert" className="mb-2 text-xs font-medium text-lp-error">
          {error}
        </p>
      )}

      {ordersQ.isPending ? (
        <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
      ) : ordersQ.isError ? (
        <p className="text-sm text-lp-error">
          {ordersQ.error instanceof Error
            ? ordersQ.error.message
            : 'Gagal memuat piutang.'}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-lp-on-surface-variant">
          Tidak ada order kredit berjalan.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="flex flex-col rounded-lg bg-lp-surface-low px-3 py-2">
              <span className="text-[11px] font-semibold text-lp-tertiary">
                Total Piutang
              </span>
              <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
                {formatIDR(totalReceivable)}
              </span>
            </div>
            <div className="flex flex-col rounded-lg bg-lp-surface-low px-3 py-2">
              <span className="text-[11px] font-semibold text-lp-tertiary">
                Jumlah Order
              </span>
              <span className="font-lp-mono text-sm font-bold text-lp-on-surface">
                {formatNumber(orders.length)}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                  <th className="pb-2">Order</th>
                <th className="pb-2">Tanggal</th>
                <th className="pb-2 text-right">Nilai</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-lp-surface-container">
                  <td className="py-2.5 font-lp-mono text-lp-on-surface">
                    {order.orderNumber}
                  </td>
                  <td className="py-2.5 text-lp-on-surface-variant">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('id-ID')
                      : '—'}
                  </td>
                  <td className="py-2.5 text-right font-lp-mono font-semibold text-lp-on-surface">
                    {formatIDR(order.total)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      disabled={settleM.isPending}
                      onClick={() => settleM.mutate(order.id)}
                      className="rounded-lg bg-lp-primary px-3 py-1.5 text-xs font-bold text-lp-on-primary disabled:opacity-60"
                    >
                      Tandai lunas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

function AccountingPanel() {
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState<string | null>(null);

  const providerQ = useQuery({
    queryKey: ['accounting', 'provider'],
    queryFn: accountingProvider,
  });
  const previewQ = useQuery({
    queryKey: ['accounting', 'preview', date],
    queryFn: () => previewJournals(date),
  });

  const syncM = useMutation({
    mutationFn: () => syncJournals(date),
    onSuccess: (result) => {
      setError(null);
      setSynced(
        result.synced > 0
          ? `${result.synced} jurnal tersinkron via ${result.provider}.`
          : (result.note ?? 'Tidak ada jurnal untuk disinkronkan.'),
      );
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Gagal sinkron.'),
  });

  const provider = providerQ.data?.provider ?? 'none';
  const entries = previewQ.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className={PANEL}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-lp-on-surface-variant">
            Tanggal
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSynced(null);
              }}
              className={`ml-2 ${inputCls}`}
            />
          </label>
          <span className="rounded-full bg-lp-surface-container-high px-3 py-1 text-[11px] font-semibold text-lp-on-surface-variant">
            Provider: {provider === 'none' ? 'belum dikonfigurasi' : provider}
          </span>
          <button
            type="button"
            disabled={syncM.isPending || provider === 'none'}
            onClick={() => syncM.mutate()}
            className="ml-auto h-10 rounded-lg bg-lp-primary px-4 text-xs font-bold text-lp-on-primary disabled:opacity-60"
          >
            {syncM.isPending ? 'Menyinkron…' : 'Sinkron Jurnal'}
          </button>
        </div>

        {synced && (
          <p className="mt-2 text-xs font-medium text-lp-primary">{synced}</p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-lp-error">
            {error}
          </p>
        )}
      </div>

      <div className={PANEL}>
        <h2 className="mb-3 text-base font-semibold text-lp-on-surface">
          Pratinjau Jurnal
        </h2>
        {previewQ.isPending ? (
          <p className="text-sm text-lp-on-surface-variant">Memuat…</p>
        ) : previewQ.isError ? (
          <p className="text-sm text-lp-error">
            {previewQ.error instanceof Error
              ? previewQ.error.message
              : 'Gagal memuat jurnal.'}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-lp-on-surface-variant">
            Tidak ada jurnal pada tanggal ini.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div
                key={entry.reference}
                className="rounded-lg border border-lp-surface-container p-3"
              >
                <p className="text-sm font-semibold text-lp-on-surface">
                  {entry.description}
                </p>
                <table className="mt-2 w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-lp-tertiary">
                      <th className="pb-1">Akun</th>
                      <th className="pb-1 text-right">Debit</th>
                      <th className="pb-1 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((line) => (
                      <tr key={`${entry.reference}-${line.accountCode}`}>
                        <td className="py-1 font-lp-mono text-lp-on-surface-variant">
                          {line.accountCode}
                        </td>
                        <td className="py-1 text-right font-lp-mono text-lp-on-surface">
                          {line.debit > 0 ? formatIDR(line.debit) : '—'}
                        </td>
                        <td className="py-1 text-right font-lp-mono text-lp-on-surface">
                          {line.credit > 0 ? formatIDR(line.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
