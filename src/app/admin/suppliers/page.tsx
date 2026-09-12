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
import { SUPPLIER_TYPES } from "@/lib/crm-constants";

type Supplier = {
  id: number;
  name: string;
  type: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
};

type FormState = {
  name: string;
  type: string;
  contactName: string;
  phone: string;
  email: string;
  contractNumber: string;
  paymentTerms: string;
};

const emptyForm: FormState = {
  name: "",
  type: "other",
  contactName: "",
  phone: "",
  email: "",
  contractNumber: "",
  paymentTerms: "",
};

export default function SuppliersPage() {
  const { t } = useAdminI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/suppliers");
    setSuppliers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function typeLabel(type: string) {
    const key = `type${type[0].toUpperCase()}${type.slice(1)}` as keyof typeof t.suppliers;
    return (t.suppliers[key] as string) ?? type;
  }

  function toPayload(f: FormState) {
    return {
      name: f.name,
      type: f.type,
      contactName: f.contactName || null,
      phone: f.phone || null,
      email: f.email || null,
      contractNumber: f.contractNumber || null,
      paymentTerms: f.paymentTerms || null,
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    if (!res.ok) {
      setError(t.suppliers.cantAdd);
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      type: s.type,
      contactName: s.contactName ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      contractNumber: "",
      paymentTerms: "",
    });
  }

  async function handleUpdate(id: number) {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(editForm)),
    });
    if (!res.ok) {
      setError(t.common.cantUpdate);
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(t.suppliers.confirmDelete)) return;
    await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title={t.suppliers.title} description={t.suppliers.description} />

      <Card className="p-5 mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <Field label={t.suppliers.name} className="w-52">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label={t.suppliers.type} className="w-44">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {SUPPLIER_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {typeLabel(ty)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.suppliers.contactName} className="w-44">
            <Input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </Field>
          <Field label={t.common.phone} className="w-40">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t.common.email} className="w-52">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Button type="submit">{t.common.add}</Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : suppliers.length === 0 ? (
          <EmptyState message={t.suppliers.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.suppliers.colName}</th>
                <th className="px-5 py-3 font-medium">{t.suppliers.colType}</th>
                <th className="px-5 py-3 font-medium">{t.suppliers.colContact}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  {editingId === s.id ? (
                    <>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-40"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <Select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-36"
                        >
                          {SUPPLIER_TYPES.map((ty) => (
                            <option key={ty} value={ty}>
                              {typeLabel(ty)}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-5 py-2.5">
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-36"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right space-x-1">
                        <IconButton onClick={() => handleUpdate(s.id)}>{t.common.save}</IconButton>
                        <IconButton onClick={() => setEditingId(null)}>{t.common.cancel}</IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">{typeLabel(s.type)}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                        {s.contactName || s.phone || s.email || "—"}
                      </td>
                      <td className="px-5 py-3 text-right space-x-1">
                        <IconButton onClick={() => startEdit(s)}>{t.common.edit}</IconButton>
                        <IconButton variant="danger" onClick={() => handleDelete(s.id)}>
                          {t.common.delete}
                        </IconButton>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
