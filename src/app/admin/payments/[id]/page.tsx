"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { formatUsd, formatUzs } from "@/lib/format";

type Payment = {
  id: number;
  type: string;
  amountUsd: string | null;
  amountUzs: string | null;
  exchangeRate: string | null;
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

type PaymentDetail = Payment & {
  booking: {
    id: number;
    status: string;
    tour: { id: number; name: string };
    customer: { id: number; firstName: string; lastName: string | null } | null;
    payments: Payment[];
  };
};

export default function PaymentDetailPage() {
  const { t } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/payments/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPayment);
  }, [params.id]);

  function paymentTypeLabel(s: string) {
    const key = `paymentType${s[0].toUpperCase()}${s.slice(1)}` as keyof typeof t.bookings;
    return (t.bookings[key] as string) ?? s;
  }

  if (!payment) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.bookings.paymentNotFound}</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.push(`/admin/bookings/${payment.booking.id}`)}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <h2 className="text-2xl font-semibold tracking-tight mb-1">
        {t.bookings.paymentDetail} #{payment.id}
      </h2>
      <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
        <Link href={`/admin/bookings/${payment.booking.id}`} className="hover:text-indigo-600">
          {payment.booking.tour.name}
        </Link>
        {payment.booking.customer && (
          <>
            {" · "}
            <Link
              href={`/admin/customers/${payment.booking.customer.id}`}
              className="hover:text-indigo-600"
            >
              {payment.booking.customer.firstName} {payment.booking.customer.lastName ?? ""}
            </Link>
          </>
        )}
      </p>

      <Card className="p-5 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.paymentType}</p>
          <p className="font-medium">{paymentTypeLabel(payment.type)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.paidAt}</p>
          <p className="font-medium">{payment.paidAt || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.reference}</p>
          <p className="font-medium">{payment.reference || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.amountUsd}</p>
          <p className="font-medium tabular-nums">{formatUsd(payment.amountUsd)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.amountUzs}</p>
          <p className="font-medium tabular-nums">{formatUzs(payment.amountUzs)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t.bookings.exchangeRate}</p>
          <p className="font-medium tabular-nums">{payment.exchangeRate || "—"}</p>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {t.bookings.paymentHistory}
        </h3>
        <ul className="divide-y divide-gray-100 dark:divide-white/10">
          {payment.booking.payments.map((p) => (
            <li
              key={p.id}
              className={`py-2.5 flex items-center justify-between text-sm ${
                p.id === payment.id ? "font-semibold" : ""
              }`}
            >
              <Link href={`/admin/payments/${p.id}`} className="hover:text-indigo-600">
                {paymentTypeLabel(p.type)} · {p.paidAt || "—"}
              </Link>
              <span className="tabular-nums">
                {formatUsd(p.amountUsd)} / {formatUzs(p.amountUzs)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
