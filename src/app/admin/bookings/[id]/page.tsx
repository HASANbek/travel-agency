"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, IconButton, Input, Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import {
  BOOKING_STATUSES,
  PAYMENT_TYPES,
  VOUCHER_SERVICE_TYPES,
} from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";
import { generateInvoicePdf, generateServiceVoucherPdf, generateVouchersPdf } from "@/lib/finance-pdf";

type Tour = { id: number; name: string };
type Customer = { id: number; firstName: string; lastName: string | null };

type ServiceRow = {
  key: string;
  day: number;
  name: string;
  quantity: number;
  unitUsd: string | null;
  unitUzs: string | null;
};

type TourFull = {
  attractions: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; attraction: { name: string } }[];
  localTransports: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; localTransport: { name: string } }[];
  guides: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; guide: { name: string } }[];
  hotelRates: { day: number; quantity: number; nights: number; unitPriceUsd: string | null; unitPriceUzs: string | null; hotel: { name: string } }[];
  restaurants: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; restaurant: { name: string } }[];
  excursions: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; excursion: { name: string } }[];
  trainTickets: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; trainTicket: { fromCity: { name: string }; toCity: { name: string } } }[];
  flightTickets: { day: number; quantity: number; unitPriceUsd: string | null; unitPriceUzs: string | null; flightTicket: { fromCity: { name: string }; toCity: { name: string } } }[];
};

function buildServiceRows(tour: TourFull): ServiceRow[] {
  const rows: ServiceRow[] = [];
  tour.attractions.forEach((a, i) =>
    rows.push({ key: `a${i}`, day: a.day, name: a.attraction.name, quantity: a.quantity, unitUsd: a.unitPriceUsd, unitUzs: a.unitPriceUzs })
  );
  tour.localTransports.forEach((t, i) =>
    rows.push({ key: `t${i}`, day: t.day, name: t.localTransport.name, quantity: t.quantity, unitUsd: t.unitPriceUsd, unitUzs: t.unitPriceUzs })
  );
  tour.guides.forEach((g, i) =>
    rows.push({ key: `g${i}`, day: g.day, name: g.guide.name, quantity: g.quantity, unitUsd: g.unitPriceUsd, unitUzs: g.unitPriceUzs })
  );
  tour.hotelRates.forEach((h, i) =>
    rows.push({
      key: `h${i}`,
      day: h.day,
      name: `${h.hotel.name} (${h.nights} kecha)`,
      quantity: h.quantity,
      unitUsd: h.unitPriceUsd,
      unitUzs: h.unitPriceUzs,
    })
  );
  tour.restaurants.forEach((r, i) =>
    rows.push({ key: `r${i}`, day: r.day, name: r.restaurant.name, quantity: r.quantity, unitUsd: r.unitPriceUsd, unitUzs: r.unitPriceUzs })
  );
  tour.excursions.forEach((e, i) =>
    rows.push({ key: `e${i}`, day: e.day, name: e.excursion.name, quantity: e.quantity, unitUsd: e.unitPriceUsd, unitUzs: e.unitPriceUzs })
  );
  tour.trainTickets.forEach((tk, i) =>
    rows.push({
      key: `tt${i}`,
      day: tk.day,
      name: `${tk.trainTicket.fromCity.name} → ${tk.trainTicket.toCity.name}`,
      quantity: tk.quantity,
      unitUsd: tk.unitPriceUsd,
      unitUzs: tk.unitPriceUzs,
    })
  );
  tour.flightTickets.forEach((tk, i) =>
    rows.push({
      key: `ft${i}`,
      day: tk.day,
      name: `${tk.flightTicket.fromCity.name} → ${tk.flightTicket.toCity.name}`,
      quantity: tk.quantity,
      unitUsd: tk.unitPriceUsd,
      unitUzs: tk.unitPriceUzs,
    })
  );
  return rows.sort((a, b) => a.day - b.day);
}
type Payment = {
  id: number;
  type: string;
  amountUsd: string | null;
  amountUzs: string | null;
  paidAt: string | null;
  reference: string | null;
};
type Voucher = {
  id: number;
  serviceType: string;
  serviceName: string | null;
  day: number | null;
  notes: string | null;
};
type Invoice = {
  id: number;
  invoiceNumber: string;
  amountUsd: string;
  amountUzs: string;
  discountUsd: string | null;
  discountUzs: string | null;
  taxPercent: string | null;
  status: string;
  issuedAt: string | null;
  dueDate: string | null;
};

type BookingDetail = {
  id: number;
  status: string;
  startDate: string | null;
  notes: string | null;
  totalUsd: string;
  totalUzs: string;
  paidUsd: number;
  paidUzs: number;
  tour: Tour;
  customer: Customer | null;
  payments: Payment[];
  vouchers: Voucher[];
  invoices: Invoice[];
};

const emptyPaymentForm = {
  type: "cash",
  amountUsd: "",
  amountUzs: "",
  exchangeRate: "",
  paidAt: new Date().toISOString().slice(0, 10),
  reference: "",
};

const emptyVoucherForm = {
  serviceType: "hotel",
  serviceName: "",
  day: "",
  notes: "",
};

function computeDateForDay(startDate: string | null, day: number | null): string | null {
  if (!startDate || !day) return null;
  const d = new Date(startDate);
  d.setDate(d.getDate() + (day - 1));
  return d.toISOString().slice(0, 10);
}

export default function BookingDetailPage() {
  const { t, lang } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [status, setStatus] = useState("confirmed");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [generatingVouchers, setGeneratingVouchers] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([]);

  async function load() {
    const res = await fetch(`/api/admin/bookings/${params.id}`);
    if (!res.ok) {
      setBooking(null);
      return;
    }
    const data: BookingDetail = await res.json();
    setBooking(data);
    setStatus(data.status);
    setStartDate(data.startDate ?? "");
    setNotes(data.notes ?? "");

    const tourRes = await fetch(`/api/admin/tours/${data.tour.id}`);
    if (tourRes.ok) {
      const tourData: TourFull = await tourRes.json();
      setServiceRows(buildServiceRows(tourData));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function statusLabel(s: string) {
    const key = `status${s
      .split("_")
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join("")}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? s;
  }

  function serviceTypeLabel(s: string) {
    const key = `serviceType${s[0].toUpperCase()}${s.slice(1)}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? s;
  }

  function invoiceStatusLabel(s: string) {
    const key = `invoiceStatus${s[0].toUpperCase()}${s.slice(1)}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? s;
  }

  function paymentTypeLabel(s: string) {
    const key = `paymentType${s[0].toUpperCase()}${s.slice(1)}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? s;
  }

  async function handleSaveStatus(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/bookings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, startDate: startDate || null, notes: notes || null }),
    });
    setSaving(false);
    load();
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: paymentForm.type,
        amountUsd: paymentForm.amountUsd ? Number(paymentForm.amountUsd) : null,
        amountUzs: paymentForm.amountUzs ? Number(paymentForm.amountUzs) : null,
        exchangeRate: paymentForm.exchangeRate ? Number(paymentForm.exchangeRate) : null,
        paidAt: paymentForm.paidAt || null,
        reference: paymentForm.reference || null,
      }),
    });
    setPaymentForm(emptyPaymentForm);
    setShowPaymentForm(false);
    load();
  }

  async function handleDeletePayment(id: number) {
    await fetch(`/api/admin/payments/${id}`, { method: "DELETE" });
    load();
  }

  async function handleGenerateVouchers() {
    if (!booking) return;
    setGeneratingVouchers(true);
    try {
      await fetch(`/api/admin/bookings/${booking.id}/generate-vouchers`, { method: "POST" });
      load();
    } finally {
      setGeneratingVouchers(false);
    }
  }

  async function handleAddVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        serviceType: voucherForm.serviceType,
        serviceName: voucherForm.serviceName || null,
        day: voucherForm.day ? Number(voucherForm.day) : null,
        notes: voucherForm.notes || null,
      }),
    });
    setVoucherForm(emptyVoucherForm);
    setShowVoucherForm(false);
    load();
  }

  async function handleDeleteVoucher(id: number) {
    await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    load();
  }

  function handleDownloadVoucher(v: Voucher) {
    if (!booking) return;
    const date = computeDateForDay(booking.startDate, v.day) ?? `${t.bookings.day} ${v.day ?? "-"}`;
    generateServiceVoucherPdf(
      {
        bookingId: booking.id,
        tourName: booking.tour.name,
        customerName: booking.customer
          ? `${booking.customer.firstName} ${booking.customer.lastName ?? ""}`
          : null,
        serviceTypeLabel: serviceTypeLabel(v.serviceType),
        serviceName: v.serviceName,
        notes: v.notes,
        date,
        quantity: 1,
      },
      lang
    );
  }

  function handleDownloadVouchers() {
    if (!booking) return;
    generateVouchersPdf(
      {
        bookingId: booking.id,
        tourName: booking.tour.name,
        customerName: booking.customer
          ? `${booking.customer.firstName} ${booking.customer.lastName ?? ""}`
          : null,
        vouchers: booking.vouchers.map((v) => ({
          serviceTypeLabel: serviceTypeLabel(v.serviceType),
          serviceName: v.serviceName,
          day: v.day,
        })),
      },
      lang
    );
  }

  async function handleCreateInvoice() {
    if (!booking) return;
    setCreatingInvoice(true);
    try {
      await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      load();
    } finally {
      setCreatingInvoice(false);
    }
  }

  async function handleInvoiceStatusChange(invoiceId: number, newStatus: string) {
    await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function handleDeleteInvoice(id: number) {
    await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
    load();
  }

  function handleDownloadInvoice(inv: Invoice) {
    if (!booking) return;
    generateInvoicePdf(
      {
        invoiceNumber: inv.invoiceNumber,
        issuedAt: inv.issuedAt,
        dueDate: inv.dueDate,
        statusLabel: invoiceStatusLabel(inv.status),
        amountUsd: inv.amountUsd,
        amountUzs: inv.amountUzs,
        discountUsd: inv.discountUsd,
        discountUzs: inv.discountUzs,
        taxPercent: inv.taxPercent,
        tourName: booking.tour.name,
        customerName: booking.customer
          ? `${booking.customer.firstName} ${booking.customer.lastName ?? ""}`
          : null,
      },
      lang
    );
  }

  if (!booking) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.bookings.notFound}</div>;
  }

  const remainingUsd = Number(booking.totalUsd) - booking.paidUsd;
  const remainingUzs = Number(booking.totalUzs) - booking.paidUzs;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/bookings")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          <Link href={`/admin/tours/${booking.tour.id}`} className="hover:text-indigo-600">
            {booking.tour.name}
          </Link>
        </h2>
        {booking.customer && (
          <Link
            href={`/admin/customers/${booking.customer.id}`}
            className="text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
          >
            {booking.customer.firstName} {booking.customer.lastName ?? ""}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.colTotal}</p>
          <p className="tabular-nums font-semibold">
            {formatUsd(booking.totalUsd)} / {formatUzs(booking.totalUzs)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.totalPaid}</p>
          <p className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
            {formatUsd(booking.paidUsd)} / {formatUzs(booking.paidUzs)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.remaining}</p>
          <p className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">
            {formatUsd(remainingUsd)} / {formatUzs(remainingUzs)}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 p-5 pb-3">
          {t.bookings.servicesHeading}
        </h3>
        {serviceRows.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40 px-5 pb-5">{t.bookings.noServices}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-2.5 font-medium">{t.bookings.colDay}</th>
                <th className="px-5 py-2.5 font-medium">{t.bookings.colService}</th>
                <th className="px-5 py-2.5 font-medium">{t.bookings.colQuantity}</th>
                <th className="px-5 py-2.5 font-medium">{t.bookings.colUnitPrice}</th>
                <th className="px-5 py-2.5 font-medium">{t.bookings.colSubtotal}</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.map((row) => (
                <tr key={row.key} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                  <td className="px-5 py-2.5 tabular-nums text-gray-500 dark:text-white/50">{row.day}</td>
                  <td className="px-5 py-2.5">{row.name}</td>
                  <td className="px-5 py-2.5 tabular-nums">{row.quantity}</td>
                  <td className="px-5 py-2.5 tabular-nums text-gray-500 dark:text-white/50">
                    {formatUsd(row.unitUsd)}
                  </td>
                  <td className="px-5 py-2.5 tabular-nums font-medium">
                    {formatUsd(Number(row.unitUsd ?? 0) * row.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5 mb-6">
        <form onSubmit={handleSaveStatus} className="flex flex-wrap items-end gap-3">
          <Field label={t.bookings.status} className="w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.bookings.startDate} className="w-44">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={t.bookings.notes} className="flex-1 min-w-[200px]">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? t.builder.saving : t.common.save}
          </Button>
        </form>
      </Card>

      {/* Payments */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.bookings.paymentsHeading}
          </h3>
          <Button onClick={() => setShowPaymentForm((v) => !v)} variant="secondary">
            {t.bookings.addPayment}
          </Button>
        </div>

        {showPaymentForm && (
          <form onSubmit={handleAddPayment} className="flex flex-wrap items-end gap-3 mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
            <Field label={t.bookings.paymentType} className="w-40">
              <Select
                value={paymentForm.type}
                onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
              >
                {PAYMENT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {paymentTypeLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.bookings.amountUsd} className="w-32">
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amountUsd}
                onChange={(e) => setPaymentForm({ ...paymentForm, amountUsd: e.target.value })}
              />
            </Field>
            <Field label={t.bookings.amountUzs} className="w-36">
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amountUzs}
                onChange={(e) => setPaymentForm({ ...paymentForm, amountUzs: e.target.value })}
              />
            </Field>
            <Field label={t.bookings.exchangeRate} className="w-32">
              <Input
                type="number"
                step="0.0001"
                placeholder="1 USD = ? UZS"
                value={paymentForm.exchangeRate}
                onChange={(e) => setPaymentForm({ ...paymentForm, exchangeRate: e.target.value })}
              />
            </Field>
            <Field label={t.bookings.paidAt} className="w-40">
              <Input
                type="date"
                value={paymentForm.paidAt}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
              />
            </Field>
            <Field label={t.bookings.reference} className="w-40">
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
        )}

        {booking.payments.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.bookings.noPayments}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {booking.payments.map((p) => (
              <li key={p.id} className="py-2.5 flex items-center justify-between text-sm">
                <Link href={`/admin/payments/${p.id}`} className="hover:text-indigo-600">
                  {paymentTypeLabel(p.type)} · {p.paidAt || "—"}
                  {p.reference && <span className="text-gray-400"> · {p.reference}</span>}
                </Link>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">
                    {formatUsd(p.amountUsd)} / {formatUzs(p.amountUzs)}
                  </span>
                  <IconButton variant="danger" onClick={() => handleDeletePayment(p.id)}>
                    {t.common.delete}
                  </IconButton>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Vouchers */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.bookings.vouchersHeading}
          </h3>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateVouchers} disabled={generatingVouchers} variant="secondary">
              {t.bookings.generateVouchers}
            </Button>
            <Button onClick={() => setShowVoucherForm((v) => !v)} variant="secondary">
              {t.bookings.addVoucherManual}
            </Button>
            {booking.vouchers.length > 0 && (
              <Button onClick={handleDownloadVouchers}>{t.bookings.downloadVouchersPdf}</Button>
            )}
          </div>
        </div>

        {showVoucherForm && (
          <form onSubmit={handleAddVoucher} className="flex flex-wrap items-end gap-3 mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
            <Field label={t.bookings.serviceType} className="w-40">
              <Select
                value={voucherForm.serviceType}
                onChange={(e) => setVoucherForm({ ...voucherForm, serviceType: e.target.value })}
              >
                {VOUCHER_SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {serviceTypeLabel(s)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.bookings.serviceName} className="w-52">
              <Input
                value={voucherForm.serviceName}
                onChange={(e) => setVoucherForm({ ...voucherForm, serviceName: e.target.value })}
              />
            </Field>
            <Field label={t.bookings.day} className="w-24">
              <Input
                type="number"
                min={1}
                value={voucherForm.day}
                onChange={(e) => setVoucherForm({ ...voucherForm, day: e.target.value })}
              />
            </Field>
            <Field label={t.common.notes} className="w-56">
              <Input
                value={voucherForm.notes}
                onChange={(e) => setVoucherForm({ ...voucherForm, notes: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
        )}

        {booking.vouchers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.bookings.noVouchers}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {booking.vouchers.map((v) => (
              <li key={v.id} className="py-2.5 flex items-center justify-between text-sm gap-2">
                <span>
                  {v.day && (
                    <span className="text-gray-400 mr-2">
                      {t.bookings.day} {v.day}
                    </span>
                  )}
                  <span className="font-medium">{serviceTypeLabel(v.serviceType)}</span>
                  {v.serviceName && <span className="text-gray-400"> · {v.serviceName}</span>}
                  {v.notes && <span className="block text-xs text-gray-400 mt-0.5">{v.notes}</span>}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <IconButton onClick={() => handleDownloadVoucher(v)}>
                    {t.bookings.downloadVoucherPdf}
                  </IconButton>
                  <IconButton variant="danger" onClick={() => handleDeleteVoucher(v.id)}>
                    {t.common.delete}
                  </IconButton>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Invoices */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.bookings.invoicesHeading}
          </h3>
          <Button onClick={handleCreateInvoice} disabled={creatingInvoice} variant="secondary">
            {t.bookings.createInvoice}
          </Button>
        </div>

        {booking.invoices.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.bookings.noInvoices}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {booking.invoices.map((inv) => (
              <li key={inv.id} className="py-2.5 flex items-center justify-between text-sm flex-wrap gap-2">
                <span className="font-medium">
                  {inv.invoiceNumber}{" "}
                  <span className="text-gray-400 font-normal tabular-nums">
                    {formatUsd(inv.amountUsd)} / {formatUzs(inv.amountUzs)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Select
                    value={inv.status}
                    onChange={(e) => handleInvoiceStatusChange(inv.id, e.target.value)}
                    className="text-xs py-1"
                  >
                    <option value="unpaid">{t.bookings.invoiceStatusUnpaid}</option>
                    <option value="partial">{t.bookings.invoiceStatusPartial}</option>
                    <option value="paid">{t.bookings.invoiceStatusPaid}</option>
                  </Select>
                  <IconButton onClick={() => handleDownloadInvoice(inv)}>
                    {t.bookings.downloadInvoicePdf}
                  </IconButton>
                  <IconButton variant="danger" onClick={() => handleDeleteInvoice(inv.id)}>
                    {t.common.delete}
                  </IconButton>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
