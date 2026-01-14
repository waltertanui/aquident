import React, { useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
import LabProcedures from "./LabProcedures";

// ────────────────────────────────────────────────
// TYPES (kept minimal)
// ────────────────────────────────────────────────

type OrderItem = {
  product: string;
  material: string;
  quantity: number;
  specs: string;
};

type FormData = {
  doctorName: string;
  institution: string;
  patientName: string;
  partnerLab: string;
  expectedDate: string;
  shippingMethod: string;
  notes: string;
  lab_procedures: string;
  lab_cost: number;
  items: OrderItem[];
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const PRICE_BOOK: Record<string, number> = {
  "Zirconia Crown": 140,
  "Porcelain-Fused Bridge": 210,
  "Complete Denture": 260,
  "Implant Abutment": 190,
  "Clear Aligner Set": 320,
};

const MATERIAL_MULTIPLIER: Record<string, number> = {
  Zirconia: 1.25,
  PMMA: 0.9,
  Titanium: 1.4,
  Composite: 1.0,
  Gold: 1.8,
};

const DEFAULT_FORM_VALUES: FormData = {
  doctorName: "",
  institution: "",
  patientName: "",
  partnerLab: "ZenLab",
  expectedDate: "",
  shippingMethod: "Courier",
  notes: "",
  lab_procedures: "",
  lab_cost: 0,
  items: [{
    product: "Zirconia Crown",
    material: "Zirconia",
    quantity: 1,
    specs: "",
  }],
};

// ────────────────────────────────────────────────
// COMPONENT — UI ONLY
// ────────────────────────────────────────────────

export default function ExternalLabWorks() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM_VALUES);

  const totalUnits = useMemo(
    () => form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [form.items]
  );

  const updateForm = (patch: Partial<FormData>) =>
    setForm(prev => ({ ...prev, ...patch }));

  const updateItem = (index: number, patch: Partial<OrderItem>) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));

  const addItem = () =>
    setForm(prev => ({
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

  const loadSample = () => {
    setForm({
      doctorName: "Dr. Aurora Finch",
      institution: "Starlight Dental Institute",
      patientName: "Nova Comet",
      partnerLab: "FusionCeramics",
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      shippingMethod: "Courier",
      notes: "Theme: celestial aesthetics. Request subtle opalescence on anterior units.",
      lab_procedures: "",
      lab_cost: 0,
      items: [
        { product: "Zirconia Crown", material: "Zirconia", quantity: 2, specs: "Shade A2, high translucency" },
        { product: "Porcelain-Fused Bridge", material: "Composite", quantity: 1, specs: "3-unit bridge, canine guidance" },
        { product: "Clear Aligner Set", material: "PMMA", quantity: 1, specs: "Stages 1–4" },
      ],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="External Lab Works" />

      <Card>
        <form className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Doctor Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.doctorName}
                onChange={e => updateForm({ doctorName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Institution</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.institution}
                onChange={e => updateForm({ institution: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Patient Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.patientName}
                onChange={e => updateForm({ patientName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Partner Lab</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.partnerLab}
                onChange={e => updateForm({ partnerLab: e.target.value })}
              >
                <option value="ZenLab">ZenLab</option>
                <option value="BrightDentalLab">BrightDentalLab</option>
                <option value="FusionCeramics">FusionCeramics</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Expected Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.expectedDate}
                onChange={e => updateForm({ expectedDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Shipping Method</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.shippingMethod}
                onChange={e => updateForm({ shippingMethod: e.target.value })}
              >
                <option>Courier</option>
                <option>Pickup</option>
                <option>Digital Impression</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="font-medium flex items-center justify-between">
              <span>Items</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  + Add Item
                </button>
                <button
                  type="button"
                  onClick={loadSample}
                  className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded"
                >
                  Load Sample
                </button>
              </div>
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50/40"
              >
                <div className="md:col-span-4">
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={item.product}
                    onChange={e => updateItem(index, { product: e.target.value })}
                  >
                    {Object.keys(PRICE_BOOK).map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={item.material}
                    onChange={e => updateItem(index, { material: e.target.value })}
                  >
                    {Object.keys(MATERIAL_MULTIPLIER).map(m => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded px-3 py-2"
                    value={item.quantity}
                    onChange={e => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                  />
                </div>

                <div className="md:col-span-3">
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Specifications / Shade / etc."
                    value={item.specs}
                    onChange={e => updateItem(index, { specs: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Lab Procedures & Notes */}
          <div className="space-y-4">
            <LabProcedures
              onSelect={name =>
                updateForm({
                  lab_procedures: form.lab_procedures
                    ? `${form.lab_procedures}, ${name}`
                    : name,
                })
              }
              onTotalChange={total => updateForm({ lab_cost: total })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">
                  Calculated Lab Cost
                </label>
                <div className="border bg-gray-50 rounded px-4 py-2.5 font-medium text-slate-700">
                  Ksh {form.lab_cost.toLocaleString()}
                </div>
              </div>

              <div className="text-sm flex items-end">
                Total units: <strong className="ml-1">{totalUnits}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Lab Procedures
              </label>
              <textarea
                value={form.lab_procedures}
                onChange={e => updateForm({ lab_procedures: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm min-h-[80px]"
                placeholder="Selected procedures will appear here..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => updateForm({ notes: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm min-h-[100px]"
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate Quote
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}