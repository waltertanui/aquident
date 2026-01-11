import React, { useMemo, useState } from "react";

type ProcedureItem = { id: string; name: string };
type ProcedureCategory = { id: string; name: string; items: ProcedureItem[] };

const PROCEDURES: ProcedureCategory[] = [
  {
    id: "general",
    name: "General",
    items: [
      { id: "consultation", name: "Consultation" },
    ],
  },
  {
    id: "endodontics",
    name: "Endodontics (RCT)",
    items: [
      { id: "rct_start", name: "RCT Start" },
      { id: "bmp", name: "BMP" },
      { id: "obt", name: "OBT" },
      { id: "rct_retreatment", name: "Root Canal Retreatment" },
    ],
  },
  {
    id: "oral_surgery",
    name: "Oral Surgery (Extraction/XLA)",
    items: [
      { id: "extraction_simple", name: "Extraction - Simple" },
      { id: "open_disimpaction", name: "Open Disimpaction" },
      { id: "closed_disimpaction", name: "Closed Disimpaction" },
    ],
  },
  {
    id: "restorative",
    name: "Restorative (Filling)",
    items: [
      { id: "filling_amalgam", name: "Filling - Amalgam" },
      { id: "filling_composite", name: "Filling - Composite" },
    ],
  },
  {
    id: "cosmetic",
    name: "Cosmetic",
    items: [{ id: "bleaching", name: "Bleaching" }],
  },
  {
    id: "orthodontics",
    name: "Orthodontics",
    items: [{ id: "ortho_review", name: "Ortho - Review" }],
  },
  {
    id: "periodontics",
    name: "Periodontics",
    items: [
      { id: "fms_scaling_polishing", name: "Full Mouth Scaling & Polishing" },
      { id: "fluoride_therapy", name: "Fluoride Therapy" },
    ],
  },
];

type Assignment = {
  patientId: string;
  procedures: string[];
  notes?: string;
};

export default function Clinic() {
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedCount = useMemo(() => selected.size, [selected]);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCategory = (category: ProcedureCategory, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of category.items) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const assign = (): Assignment | null => {
    if (!patientId || selected.size === 0) return null;
    const payload: Assignment = {
      patientId,
      procedures: Array.from(selected),
      notes: notes.trim() || undefined,
    };
    console.log("Assigned procedures", payload);
    // TODO: POST payload to your backend, e.g.:
    // await fetch(`/api/patients/${patientId}/procedures`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    return payload;
  };

  return (
    <div className="p-6 space-y-6">
      {/* --- ADDED: Overview header + dashboard sections (keeps original styling) --- */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Clinic</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage clinical operations: patient queue, treatments, and lab work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Today's Appointments</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between rounded-md bg-slate-50 p-3">
              <span className="text-sm text-slate-700">09:30 — John Doe</span>
              <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-700">Checked-in</span>
            </li>
            <li className="flex items-center justify-between rounded-md bg-slate-50 p-3">
              <span className="text-sm text-slate-700">10:15 — Jane Smith</span>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Waiting</span>
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Active Treatments</h2>
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">Root canal — John Doe</div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">In-progress</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Operatory 2 · Dr. Patel</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">Crown fitting — Jane Smith</div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Ready</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Operatory 1 · Dr. Lee</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-slate-700">Lab Orders</h2>
          <table className="mt-3 w-full text-left">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-2">Order #</th>
                <th className="py-2">Patient</th>
                <th className="py-2">Type</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              <tr className="border-t">
                <td className="py-2">L-1024</td>
                <td className="py-2">John Doe</td>
                <td className="py-2">Crown</td>
                <td className="py-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">Sent</span>
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-2">L-1025</td>
                <td className="py-2">Jane Smith</td>
                <td className="py-2">Bridge</td>
                <td className="py-2">
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">Pending</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      {/* --- END ADDED --- */}

      {/* ... existing code ... */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Patient ID / Name</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Enter patient identifier"
          />
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="h-10 rounded border px-3 hover:bg-gray-50"
        >
          Clear selections
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROCEDURES.map((cat) => {
          const allChecked = cat.items.every((i) => selected.has(i.id));
          const someChecked = cat.items.some((i) => selected.has(i.id));
          return (
            <div key={cat.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{cat.name}</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => selectAllCategory(cat, e.target.checked)}
                  />
                  Select all
                  {someChecked && !allChecked ? " (partial)" : ""}
                </label>
              </div>
              <div className="mt-3 space-y-2">
                {cat.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          rows={3}
          placeholder="Optional notes for the patient/procedures"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Selected: {selectedCount}
        </div>
        <button
          type="button"
          onClick={() => assign()}
          disabled={!patientId || selected.size === 0}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Assign to patient
        </button>
      </div>

      <div className="text-xs text-gray-500">
        After clicking Assign, check the browser console to see the payload.
      </div>
    </div>
  );
}