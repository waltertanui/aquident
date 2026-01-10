import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import { useLocation } from "react-router-dom";
import React, { useState } from "react";

type PatientBasic = { id?: string; name: string; age?: number };

function Optical() {
  // Get patient basic info from navigation state or query params
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const patient: PatientBasic =
    (location.state as any)?.patient ?? {
      name: searchParams.get("name") ?? "",
      age: searchParams.get("age") ? Number(searchParams.get("age")) : undefined,
      id: searchParams.get("id") ?? undefined,
    };

  // Form state for optician to fill remaining details
  const [frameBrand, setFrameBrand] = useState("");
  const [frameModel, setFrameModel] = useState("");
  const [lensType, setLensType] = useState("Single Vision");
  const [prescription, setPrescription] = useState("");
  const [pd, setPd] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = {
      patient,
      frameBrand,
      frameModel,
      lensType,
      prescription,
      pd,
      notes,
    };
    // TODO: replace with API call or state update
    console.log("Optical Order:", order);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Optical" action={{ label: "New Order" }} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Orders (MTD)" value="128" />
        <SummaryCard label="Ready for Pickup" value="23" />
        <SummaryCard label="Repairs" value="4" />
        <SummaryCard label="Returns" value="2" />
      </div>

      {/* Patient details and optician form */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1 rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-3">Patient</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {patient.name || "-"}</div>
            <div><span className="font-medium">Age:</span> {patient.age ?? "-"}</div>
            <div><span className="font-medium">ID:</span> {patient.id ?? "-"}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-2 rounded-lg border p-4 space-y-4">
          <h3 className="text-lg font-semibold">Optical Order</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Frame Brand</label>
              <input
                type="text"
                value={frameBrand}
                onChange={(e) => setFrameBrand(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g., Ray-Ban"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Frame Model</label>
              <input
                type="text"
                value={frameModel}
                onChange={(e) => setFrameModel(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g., RB3025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Lens Type</label>
              <select
                value={lensType}
                onChange={(e) => setLensType(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option>Single Vision</option>
                <option>Bifocal</option>
                <option>Progressive</option>
                <option>Photochromic</option>
                <option>Computer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">PD (Pupillary Distance)</label>
              <input
                type="text"
                value={pd}
                onChange={(e) => setPd(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="e.g., 63"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Prescription</label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                rows={3}
                placeholder="Add sphere, cylinder, axis for OD/OS..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                rows={2}
                placeholder="Any additional instructions"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Save Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Optical;