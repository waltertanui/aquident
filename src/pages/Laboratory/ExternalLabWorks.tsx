import React, { useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";

/* =======================
   Types
======================= */

type OrderItem = {
  product: string;
  material: string;
  quantity: number;
  specs: string;
};

type ExternalLabOrder = {
  id: string;
  doctorName: string;
  institution: string;
  patientName: string;
  partnerLab: string;
  expectedDate: string;
  shippingMethod: string;
  notes?: string;
  items: OrderItem[];
  quote: {
    subtotal: number;
    tax: number;
    total: number;
    status: "pending" | "awaitingApproval" | "approved" | "rejected";
  };
  status:
    | "draft"
    | "submitted"
    | "accepted"
    | "declined"
    | "inProduction"
    | "completed";
  capacityOk?: boolean;
  lastMessage?: string;
};

/* =======================
   Constants
======================= */

const priceBook: Record<string, number> = {
  "Zirconia Crown": 140,
  "Porcelain-Fused Bridge": 210,
  "Complete Denture": 260,
  "Implant Abutment": 190,
  "Clear Aligner Set": 320,
};

const materialMultiplier: Record<string, number> = {
  Zirconia: 1.25,
  PMMA: 0.9,
  Titanium: 1.4,
  Composite: 1.0,
  Gold: 1.8,
};

const capacityThreshold: Record<string, number> = {
  ZenLab: 18,
  BrightDentalLab: 24,
  FusionCeramics: 20,
};

/* =======================
   Component
======================= */

function ExternalLabWorks() {
  const [form, setForm] = useState({
    doctorName: "",
    institution: "",
    patientName: "",
    partnerLab: "ZenLab",
    expectedDate: "",
    shippingMethod: "Courier",
    notes: "",
    items: [
      {
        product: "Zirconia Crown",
        material: "Zirconia",
        quantity: 1,
        specs: "",
      },
    ] as OrderItem[],
  });

  const [order, setOrder] = useState<ExternalLabOrder | null>(null);
  const [busy, setBusy] = useState(false);

  /* =======================
     Derived values
  ======================= */

  const totalUnits = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
    [form.items]
  );

  /* =======================
     Helpers
  ======================= */

  const generateOrderId = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `EL-${y}${m}${d}-${rand}`;
  };

  const estimateQuote = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      const base = priceBook[item.product] ?? 150;
      const mult = materialMultiplier[item.material] ?? 1;
      return sum + base * mult * item.quantity;
    }, 0);

    const tax = +(subtotal * 0.12).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    return {
      subtotal: +subtotal.toFixed(2),
      tax,
      total,
    };
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "Implant Abutment",
          material: "Titanium",
          quantity: 1,
          specs: "",
        },
      ],
    }));
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const autofillCreative = () => {
    setForm({
      doctorName: "Dr. Aurora Finch",
      institution: "Starlight Dental Institute",
      patientName: "Nova Comet",
      partnerLab: "FusionCeramics",
      expectedDate: new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .slice(0, 10),
      shippingMethod: "Courier",
      notes:
        "Theme: celestial aesthetics. Request subtle opalescence on anterior units.",
      items: [
        {
          product: "Zirconia Crown",
          material: "Zirconia",
          quantity: 2,
          specs: "Shade A2, high translucency",
        },
        {
          product: "Porcelain-Fused Bridge",
          material: "Composite",
          quantity: 1,
          specs: "3-unit bridge, canine guidance",
        },
        {
          product: "Clear Aligner Set",
          material: "PMMA",
          quantity: 1,
          specs: "Stages 1–4",
        },
      ],
    });
  };

  /* =======================
     Actions
  ======================= */

  const generateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    await new Promise((r) => setTimeout(r, 400));

    const quote = estimateQuote(form.items);

    setOrder({
      id: generateOrderId(),
      doctorName: form.doctorName || "Unknown Doctor",
      institution: form.institution || "External Institution",
      patientName: form.patientName || "Unnamed Patient",
      partnerLab: form.partnerLab,
      expectedDate: form.expectedDate || new Date().toISOString().slice(0, 10),
      shippingMethod: form.shippingMethod,
      notes: form.notes,
      items: form.items,
      quote: { ...quote, status: "awaitingApproval" },
      status: "submitted",
      lastMessage: "Quote generated. Awaiting approval.",
    });

    setBusy(false);
  };

  const sendToPartner = () => {
    if (!order) return;
    setBusy(true);

    const threshold = capacityThreshold[order.partnerLab] ?? 20;

    setTimeout(() => {
      const ok = totalUnits <= threshold;

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: ok ? "accepted" : "declined",
              capacityOk: ok,
              lastMessage: ok
                ? `Partner accepted (≤ ${threshold} units).`
                : `Partner declined (> ${threshold} units).`,
            }
          : prev
      );

      setBusy(false);
    }, 500);
  };

  const finalizeApproval = (approved: boolean) => {
    if (!order) return;

    setOrder((prev) =>
      prev
        ? {
            ...prev,
            quote: {
              ...prev.quote,
              status: approved ? "approved" : "rejected",
            },
            status: approved ? "inProduction" : "draft",
            lastMessage: approved
              ? "Approved. In production."
              : "Rejected. Returned to draft.",
          }
        : prev
    );
  };

  const downloadProforma = () => {
    if (!order) return;

    const blob = new Blob([JSON.stringify(order, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Proforma_${order.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =======================
     JSX
  ======================= */

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="External Lab Works" />

      {/* Order Form */}
      <Card>
        <form onSubmit={generateQuote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["Doctor Name", "doctorName"],
              ["Institution", "institution"],
              ["Patient Name", "patientName"],
            ].map(([label, key]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">{label}</span>
                <input
                  className="border rounded px-3 py-2"
                  value={(form as any)[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                />
              </label>
            ))}

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Partner Lab</span>
              <select
                className="border rounded px-3 py-2"
                value={form.partnerLab}
                onChange={(e) =>
                  setForm({ ...form, partnerLab: e.target.value })
                }
              >
                <option>ZenLab</option>
                <option>BrightDentalLab</option>
                <option>FusionCeramics</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Expected Date</span>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={form.expectedDate}
                onChange={(e) =>
                  setForm({ ...form, expectedDate: e.target.value })
                }
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Shipping Method</span>
              <select
                className="border rounded px-3 py-2"
                value={form.shippingMethod}
                onChange={(e) =>
                  setForm({ ...form, shippingMethod: e.target.value })
                }
              >
                <option>Courier</option>
                <option>Pickup</option>
                <option>Digital Impression</option>
              </select>
            </label>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="font-medium">Items</div>
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded p-3"
              >
                <select
                  className="border rounded px-2 py-2"
                  value={item.product}
                  onChange={(e) =>
                    updateItem(idx, { product: e.target.value })
                  }
                >
                  {Object.keys(priceBook).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>

                <select
                  className="border rounded px-2 py-2"
                  value={item.material}
                  onChange={(e) =>
                    updateItem(idx, { material: e.target.value })
                  }
                >
                  {Object.keys(materialMultiplier).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  className="border rounded px-2 py-2"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: Number(e.target.value) })
                  }
                />

                <input
                  className="border rounded px-2 py-2 md:col-span-2"
                  placeholder="Specifications"
                  value={item.specs}
                  onChange={(e) =>
                    updateItem(idx, { specs: e.target.value })
                  }
                />
              </div>
            ))}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                + Add Item
              </button>
              <button
                type="button"
                onClick={autofillCreative}
                className="px-3 py-2 rounded bg-indigo-100 hover:bg-indigo-200"
              >
                Autofill Creative Sample
              </button>
            </div>
          </div>

          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={3}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Total Units: <strong>{totalUnits}</strong>
            </span>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {busy ? "Generating..." : "Generate Quote"}
            </button>
          </div>
        </form>
      </Card>

      {/* Order Summary */}
      {order && (
        <Card>
          <div className="space-y-2">
            <div className="font-semibold">Order Summary</div>
            <div className="text-sm">ID: {order.id}</div>
            <div className="text-sm">
              Total: ${order.quote.total.toFixed(2)}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={downloadProforma}
                className="px-3 py-2 bg-blue-500 text-white rounded"
              >
                Download Proforma
              </button>
              <button
                onClick={() => finalizeApproval(true)}
                disabled={order.quote.status !== "awaitingApproval"}
                className="px-3 py-2 bg-emerald-500 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => finalizeApproval(false)}
                disabled={order.quote.status !== "awaitingApproval"}
                className="px-3 py-2 bg-red-500 text-white rounded"
              >
                Reject
              </button>
              <button
                onClick={sendToPartner}
                className="px-3 py-2 bg-purple-500 text-white rounded"
              >
                Send to Partner
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ExternalLabWorks;
