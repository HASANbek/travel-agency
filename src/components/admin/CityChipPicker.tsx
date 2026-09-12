"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";

type City = { id: number; name: string };

export default function CityChipPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useAdminI18n();
  const [cities, setCities] = useState<City[]>([]);
  const [pick, setPick] = useState("");

  useEffect(() => {
    fetch("/api/admin/cities")
      .then((res) => res.json())
      .then(setCities);
  }, []);

  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function addCity(name: string) {
    if (!name || selected.includes(name)) return;
    onChange([...selected, name].join(", "));
    setPick("");
  }

  function removeCity(name: string) {
    onChange(selected.filter((s) => s !== name).join(", "));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
        {selected.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 pl-3 pr-1.5 py-1 text-sm"
          >
            {name}
            <button
              type="button"
              onClick={() => removeCity(name)}
              className="rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-1"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <Select
        value={pick}
        onChange={(e) => addCity(e.target.value)}
        className="w-full"
      >
        <option value="">{t.common.selectCity}</option>
        {cities
          .filter((c) => !selected.includes(c.name))
          .map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
      </Select>
    </div>
  );
}
