"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { useAuth } from "@/lib/auth-context";
import { canManageUsers } from "@/lib/rbac";
import { USER_ROLES } from "@/lib/crm-constants";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "agent",
};

export default function UsersPage() {
  const { t } = useAdminI18n();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function roleLabel(role: string) {
    const key = `role${role
      .split("_")
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join("")}` as keyof typeof t.users;
    return (t.users[key] as string) ?? role;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError(t.users.cantAdd);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function handleToggleActive(u: UserRow) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: u.name, role: u.role, isActive: !u.isActive }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.users.confirmDelete)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  if (!user || !canManageUsers(user.role)) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.users.noAccess}</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader title={t.users.title} description={t.users.description} />
        <Button onClick={() => setShowForm((v) => !v)}>{t.users.addButton}</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <Field label={t.users.name} className="w-44">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label={t.users.email} className="w-56">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label={t.users.password} className="w-40">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </Field>
            <Field label={t.users.role} className="w-44">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : users.length === 0 ? (
          <EmptyState message={t.users.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.users.name}</th>
                <th className="px-5 py-3 font-medium">{t.users.email}</th>
                <th className="px-5 py-3 font-medium">{t.users.role}</th>
                <th className="px-5 py-3 font-medium">{t.users.isActive}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">{u.email}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">{roleLabel(u.role)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60"
                      }`}
                    >
                      {u.isActive ? "✓" : "—"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <IconButton variant="danger" onClick={() => handleDelete(u.id)}>
                      {t.common.delete}
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
