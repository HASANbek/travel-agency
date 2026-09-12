"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLang, useAdminI18n } from "@/lib/admin-i18n";
import { useAuth } from "@/lib/auth-context";
import { canManageUsers } from "@/lib/rbac";

const dashboardItem = {
  href: "/admin",
  navKey: "dashboard" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  ),
};

const expensesItem = {
  href: "/admin/expenses",
  navKey: "expenses" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
    />
  ),
};

const followUpsItem = {
  href: "/admin/follow-ups",
  navKey: "followUps" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

const messagesItem = {
  href: "/admin/messages",
  navKey: "messages" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185A8.959 8.959 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  ),
};

const reportsItem = {
  href: "/admin/reports",
  navKey: "reports" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
    />
  ),
};

const settingsItem = {
  href: "/admin/settings/messages",
  navKey: "settings" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
    />
  ),
};

const usersItem = {
  href: "/admin/users",
  navKey: "users" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  ),
};

const primaryItem = {
  href: "/admin/tours",
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  ),
};

const quotationsItem = {
  href: "/admin/quotations",
  navKey: "quotations" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m3-6h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5"
    />
  ),
};

const bookingsItem = {
  href: "/admin/bookings",
  navKey: "bookings" as const,
  icon: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  ),
};

const crmItems = [
  {
    href: "/admin/customers",
    navKey: "customers" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    ),
  },
  {
    href: "/admin/inquiries",
    navKey: "inquiries" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185A8.959 8.959 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
  },
  {
    href: "/admin/pipeline",
    navKey: "pipeline" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
      />
    ),
  },
];

const dataItems = [
  {
    href: "/admin/cities",
    navKey: "cities" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    ),
  },
  {
    href: "/admin/attractions",
    navKey: "attractions" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h.01M15 11h.01M9 15h.01M15 15h.01"
      />
    ),
  },
  {
    href: "/admin/local-transport",
    navKey: "transport" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h7.5m-7.5 0H4.5m13.5 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5m-16.5 0V9a1.5 1.5 0 011.5-1.5h11.25l3.75 3.75v6.75m-16.5 0V9m16.5 8.25h-16.5"
      />
    ),
  },
  {
    href: "/admin/guides",
    navKey: "guides" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    ),
  },
  {
    href: "/admin/hotels",
    navKey: "hotels" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"
      />
    ),
  },
  {
    href: "/admin/restaurants",
    navKey: "restaurants" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M6.75 4.5h10.5v15H6.75z"
      />
    ),
  },
  {
    href: "/admin/excursions",
    navKey: "excursions" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    ),
  },
  {
    href: "/admin/suppliers",
    navKey: "suppliers" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    ),
  },
  {
    href: "/admin/train-tickets",
    navKey: "trainTickets" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75a3 3 0 003 3h9a3 3 0 003-3v-6a3 3 0 00-3-3h-9a3 3 0 00-3 3v6zM4.5 15.75L3 18m16.5-2.25L21 18M9 8.25h6M8.25 12h.008v.008H8.25V12zm7.5 0h.008v.008h-.008V12z"
      />
    ),
  },
  {
    href: "/admin/flight-tickets",
    navKey: "flightTickets" as const,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.5l-3-1.5v-3l-6.75-4.5V8.25L12 3l9.75 5.25v2.25L15 15v3l-3 1.5z"
      />
    ),
  },
];

const langs: { code: AdminLang; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
    >
      {children}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useAdminI18n();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen border-r border-white/10 bg-blue-900 text-blue-100 flex flex-col overflow-hidden">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-blue-300">{t.nav.appName}</p>
        <p className="text-lg font-semibold text-white mb-3">{t.nav.appSubtitle}</p>
        <div className="flex gap-1">
          {langs.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                lang === l.code
                  ? "bg-white text-blue-900"
                  : "bg-white/10 text-blue-200 hover:bg-white/20"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        <Link
          href={dashboardItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname === dashboardItem.href
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{dashboardItem.icon}</NavIcon>
          {t.nav[dashboardItem.navKey]}
        </Link>

        <p className="mt-3 mb-1 px-3 text-[11px] uppercase tracking-widest text-blue-400">
          {t.nav.crmGroup}
        </p>
        {crmItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon>{item.icon}</NavIcon>
              {t.nav[item.navKey]}
            </Link>
          );
        })}

        <Link
          href={primaryItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            pathname?.startsWith(primaryItem.href)
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
          }`}
        >
          <NavIcon>{primaryItem.icon}</NavIcon>
          {t.nav.createTour}
        </Link>

        <Link
          href={quotationsItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(quotationsItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{quotationsItem.icon}</NavIcon>
          {t.nav[quotationsItem.navKey]}
        </Link>

        <Link
          href={bookingsItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(bookingsItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{bookingsItem.icon}</NavIcon>
          {t.nav[bookingsItem.navKey]}
        </Link>

        <Link
          href={followUpsItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(followUpsItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{followUpsItem.icon}</NavIcon>
          {t.nav[followUpsItem.navKey]}
        </Link>

        <Link
          href={expensesItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(expensesItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{expensesItem.icon}</NavIcon>
          {t.nav[expensesItem.navKey]}
        </Link>

        <Link
          href={reportsItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(reportsItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{reportsItem.icon}</NavIcon>
          {t.nav[reportsItem.navKey]}
        </Link>

        <Link
          href={messagesItem.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname?.startsWith(messagesItem.href)
              ? "bg-white/10 text-white"
              : "text-blue-200 hover:bg-white/5 hover:text-white"
          }`}
        >
          <NavIcon>{messagesItem.icon}</NavIcon>
          {t.nav[messagesItem.navKey]}
        </Link>

        <p className="mt-5 mb-1 px-3 text-[11px] uppercase tracking-widest text-blue-400">
          {t.nav.componentsGroup}
        </p>
        {dataItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon>{item.icon}</NavIcon>
              {t.nav[item.navKey]}
            </Link>
          );
        })}

        {user && canManageUsers(user.role) && (
          <>
            <p className="mt-5 mb-1 px-3 text-[11px] uppercase tracking-widest text-blue-400">
              {t.nav.systemGroup}
            </p>
            <Link
              href={usersItem.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname?.startsWith(usersItem.href)
                  ? "bg-white/10 text-white"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon>{usersItem.icon}</NavIcon>
              {t.nav[usersItem.navKey]}
            </Link>
            <Link
              href={settingsItem.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname?.startsWith("/admin/settings")
                  ? "bg-white/10 text-white"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon>{settingsItem.icon}</NavIcon>
              {t.nav[settingsItem.navKey]}
            </Link>
          </>
        )}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-blue-400 truncate">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue-300 hover:bg-white/10 hover:text-white transition"
            >
              {t.auth.logout}
            </button>
          </div>
        ) : (
          <p className="text-xs text-blue-400">{t.nav.tagline}</p>
        )}
      </div>
    </aside>
  );
}
