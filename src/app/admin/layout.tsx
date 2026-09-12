import AdminShell from "@/components/admin/AdminShell";
import { AdminI18nProvider } from "@/lib/admin-i18n";
import { AuthProvider } from "@/lib/auth-context";
import "../globals.css";

export const metadata = {
  title: "Admin — Travel Agency",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="antialiased">
        <AdminI18nProvider>
          <AuthProvider>
            <AdminShell>{children}</AdminShell>
          </AuthProvider>
        </AdminI18nProvider>
      </body>
    </html>
  );
}
