"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Field, IconButton, Input, Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { MEAL_PLANS } from "@/lib/crm-constants";
import { formatUsd, formatUzs } from "@/lib/format";

type City = { id: number; name: string };
type Room = { id: number; roomType: string; bedType: string | null; adultCapacity: number; childCapacity: number };
type Rate = {
  id: number;
  roomId: number;
  room: Room;
  season: string | null;
  validFrom: string | null;
  validTo: string | null;
  mealPlan: string;
  netUsd: string | null;
  sellUsd: string | null;
  sellUzs: string | null;
};

type HotelDetail = {
  id: number;
  cityId: number;
  name: string;
  stars: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  checkIn: string | null;
  checkOut: string | null;
  city: City;
  rooms: Room[];
  rates: Rate[];
};

const emptyRoomForm = { roomType: "", bedType: "", adultCapacity: "2", childCapacity: "0" };
const emptyRateForm = {
  roomId: "",
  season: "",
  validFrom: "",
  validTo: "",
  mealPlan: "BB",
  netUsd: "",
  sellUsd: "",
  sellUzs: "",
};

export default function HotelDetailPage() {
  const { t } = useAdminI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState(emptyRateForm);

  async function load() {
    const res = await fetch(`/api/admin/hotels/${params.id}`);
    if (!res.ok) {
      setHotel(null);
      return;
    }
    setHotel(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!hotel) return;
    await fetch("/api/admin/hotel-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: hotel.id,
        roomType: roomForm.roomType,
        bedType: roomForm.bedType || null,
        adultCapacity: Number(roomForm.adultCapacity) || 2,
        childCapacity: Number(roomForm.childCapacity) || 0,
      }),
    });
    setRoomForm(emptyRoomForm);
    setShowRoomForm(false);
    load();
  }

  async function handleDeleteRoom(id: number) {
    await fetch(`/api/admin/hotel-rooms/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault();
    if (!hotel) return;
    await fetch("/api/admin/hotel-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: hotel.id,
        roomId: Number(rateForm.roomId),
        season: rateForm.season || null,
        validFrom: rateForm.validFrom || null,
        validTo: rateForm.validTo || null,
        mealPlan: rateForm.mealPlan,
        netUsd: rateForm.netUsd ? Number(rateForm.netUsd) : null,
        sellUsd: rateForm.sellUsd ? Number(rateForm.sellUsd) : null,
        sellUzs: rateForm.sellUzs ? Number(rateForm.sellUzs) : null,
      }),
    });
    setRateForm(emptyRateForm);
    setShowRateForm(false);
    load();
  }

  async function handleDeleteRate(id: number) {
    await fetch(`/api/admin/hotel-rates/${id}`, { method: "DELETE" });
    load();
  }

  if (!hotel) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.hotels.notFound}</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/hotels")}
        className="mb-4 text-sm text-gray-500 hover:text-indigo-600 dark:text-white/50"
      >
        ← {t.common.back}
      </button>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{hotel.name}</h2>
        <span className="text-amber-500">{"★".repeat(hotel.stars)}</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
        {hotel.city.name}
        {hotel.address ? ` · ${hotel.address}` : ""}
      </p>

      {/* Rooms */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.hotels.roomsHeading}
          </h3>
          <Button onClick={() => setShowRoomForm((v) => !v)} variant="secondary">
            {t.hotels.addRoom}
          </Button>
        </div>

        {showRoomForm && (
          <form onSubmit={handleAddRoom} className="flex flex-wrap items-end gap-3 mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
            <Field label={t.hotels.roomType} className="w-40">
              <Input
                value={roomForm.roomType}
                onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                placeholder="Standard, Deluxe..."
                required
              />
            </Field>
            <Field label={t.hotels.bedType} className="w-36">
              <Input
                value={roomForm.bedType}
                onChange={(e) => setRoomForm({ ...roomForm, bedType: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.adultCapacity} className="w-32">
              <Input
                type="number"
                min={1}
                value={roomForm.adultCapacity}
                onChange={(e) => setRoomForm({ ...roomForm, adultCapacity: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.childCapacity} className="w-32">
              <Input
                type="number"
                min={0}
                value={roomForm.childCapacity}
                onChange={(e) => setRoomForm({ ...roomForm, childCapacity: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
        )}

        {hotel.rooms.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.hotels.noRooms}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {hotel.rooms.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center justify-between text-sm">
                <span>
                  {r.roomType}
                  {r.bedType && <span className="text-gray-400"> · {r.bedType}</span>}
                  <span className="text-gray-400"> · {r.adultCapacity}+{r.childCapacity}</span>
                </span>
                <IconButton variant="danger" onClick={() => handleDeleteRoom(r.id)}>
                  {t.common.delete}
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Rates */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.hotels.ratesHeading}
          </h3>
          <Button onClick={() => setShowRateForm((v) => !v)} variant="secondary" disabled={hotel.rooms.length === 0}>
            {t.hotels.addRate}
          </Button>
        </div>

        {showRateForm && (
          <form onSubmit={handleAddRate} className="flex flex-wrap items-end gap-3 mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
            <Field label={t.hotels.room} className="w-40">
              <Select
                value={rateForm.roomId}
                onChange={(e) => setRateForm({ ...rateForm, roomId: e.target.value })}
                required
              >
                <option value="">{t.common.select}</option>
                {hotel.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomType}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.hotels.season} className="w-32">
              <Input
                value={rateForm.season}
                onChange={(e) => setRateForm({ ...rateForm, season: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.validFrom} className="w-40">
              <Input
                type="date"
                value={rateForm.validFrom}
                onChange={(e) => setRateForm({ ...rateForm, validFrom: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.validTo} className="w-40">
              <Input
                type="date"
                value={rateForm.validTo}
                onChange={(e) => setRateForm({ ...rateForm, validTo: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.mealPlan} className="w-28">
              <Select
                value={rateForm.mealPlan}
                onChange={(e) => setRateForm({ ...rateForm, mealPlan: e.target.value })}
              >
                {MEAL_PLANS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.hotels.netUsd} className="w-28">
              <Input
                type="number"
                step="0.01"
                value={rateForm.netUsd}
                onChange={(e) => setRateForm({ ...rateForm, netUsd: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.sellUsd} className="w-28">
              <Input
                type="number"
                step="0.01"
                value={rateForm.sellUsd}
                onChange={(e) => setRateForm({ ...rateForm, sellUsd: e.target.value })}
              />
            </Field>
            <Field label={t.hotels.sellUzs} className="w-32">
              <Input
                type="number"
                step="0.01"
                value={rateForm.sellUzs}
                onChange={(e) => setRateForm({ ...rateForm, sellUzs: e.target.value })}
              />
            </Field>
            <Button type="submit">{t.common.add}</Button>
          </form>
        )}

        {hotel.rates.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">{t.hotels.noRates}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {hotel.rates.map((rate) => (
              <li key={rate.id} className="py-2.5 flex items-center justify-between text-sm flex-wrap gap-2">
                <span>
                  <span className="font-medium">{rate.room.roomType}</span>
                  <span className="text-gray-400"> · {rate.mealPlan}</span>
                  {rate.season && <span className="text-gray-400"> · {rate.season}</span>}
                  {rate.validFrom && (
                    <span className="text-gray-400">
                      {" "}
                      · {rate.validFrom} → {rate.validTo}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">
                    {formatUsd(rate.sellUsd)} / {formatUzs(rate.sellUzs)}
                  </span>
                  <IconButton variant="danger" onClick={() => handleDeleteRate(rate.id)}>
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
