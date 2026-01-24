import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
// Add React state for the form
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LabProcedures from "./LabProcedures";
import InventoryRequestModal from "../../components/InventoryRequestModal";


type WorkOrderForm = {
  patientId: string;
  clinician: string;
  lab_procedures: string;
  lab_type: "Internal" | "External";
  lab_cost: number;
  notes: string;
};
// Add middleware import
import { listWalkins, updateWalkin, type PatientRecord } from "../../middleware/data";


function InternalLabWorks() {
  // Initialize form state
  const [form, setForm] = useState<WorkOrderForm>({
    patientId: "",
    clinician: "",
    lab_procedures: "",
    lab_type: "Internal",
    lab_cost: 0,
    notes: "",
  });

  // Lab Queue state
  const queryClient = useQueryClient();
  const { data: allPatients = [] } = useQuery({
    queryKey: ['walkins'],
    queryFn: listWalkins,
  });

  // Filter for patients sent to lab
  const labPatients = allPatients.filter(p => p.status === 'lab');

  // Filter for completed lab works (status 'completed')
  // Since we temporarily removed materials, we just show all completed for now.
  const completedLabPatients = allPatients.filter(p =>
    p.status === 'completed' && p.lab_procedures && p.lab_procedures.trim().length > 0
  );

  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const handlePatientSelect = (p: PatientRecord) => {
    setSelectedPatient(p);
    setForm({
      patientId: String(p.no),
      clinician: p.doc_name || "",
      lab_procedures: p.procedure && p.procedure.length > 0 ? p.procedure.join(', ') : "",
      lab_type: "Internal",
      lab_cost: 0,
      notes: "",
    });
  };

  // Simple validation
  const isValid = selectedPatient !== null;

  // Form helpers
  function updateForm<K extends keyof WorkOrderForm>(
    key: K,
    value: WorkOrderForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setMessage(null);

    // Payload to send to backend
    const payload = {
      status: 'completed' as const,
      lab_procedures: form.lab_procedures,
      lab_notes: form.notes,
      lab_type: form.lab_type,
      lab_cost: Number(form.lab_cost),
    };

    try {
      console.log("Submitting internal lab work order:", payload);

      if (selectedPatient) {
        await updateWalkin(selectedPatient.no, payload);
      }

      setMessage("Internal lab work order completed successfully.");

      // Reset form
      setForm({
        patientId: "",
        clinician: "",
        lab_procedures: "",
        lab_type: "Internal",
        lab_cost: 0,
        notes: "",
      });

      setSelectedPatient(null);

      // Refresh lists
      queryClient.invalidateQueries({ queryKey: ['walkins'] });

    } catch (err) {
      console.error(err);
      setMessage("Failed to save order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Internal Lab Works" action={{ label: "Create Order" }} />

      {/* 1. Horizontal Lab Queue Table */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Lab Queue (Select Patient to Process)</h2>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2">NO</th>
                <th className="p-2">PATIENT</th>
                <th className="p-2">DOCTOR</th>
                <th className="p-2">PROCEDURES</th>
                <th className="p-2">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {labPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">No patients in lab queue.</td>
                </tr>
              ) : (
                labPatients.map((p) => (
                  <tr
                    key={p.no}
                    className={`border-t hover:bg-blue-50 transition-colors cursor-pointer ${selectedPatient?.no === p.no ? 'bg-blue-100' : ''}`}
                    onClick={() => handlePatientSelect(p)}
                  >
                    <td className="p-2">{p.no}</td>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2">{p.doc_name || '-'}</td>
                    <td className="p-2">{p.procedure?.join(', ') || '-'}</td>
                    <td className="p-2">
                      <button className="text-blue-600 underline">Select</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Form Area */}
        {selectedPatient ? (
          <Card className="md:col-span-3">
            <div className="text-sm text-gray-600 mb-4 font-medium p-2 bg-blue-50 border border-blue-200 rounded">
              Processing work order for: {selectedPatient.name} (ID: {selectedPatient.no})
            </div>

            <LabProcedures
              onSelect={(name) => updateForm("lab_procedures", form.lab_procedures ? form.lab_procedures + ", " + name : name)}
              onTotalChange={(total) => updateForm("lab_cost", total)}
            />

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lab Type */}
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-1">Lab Type</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="labType"
                        value="Internal"
                        checked={form.lab_type === "Internal"}
                        onChange={() => updateForm("lab_type", "Internal")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Internal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="labType"
                        value="External"
                        checked={form.lab_type === "External"}
                        onChange={() => updateForm("lab_type", "External")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">External</span>
                    </label>
                  </div>
                </div>

                {/* Lab Cost Display (Read-only or Hidden if preferred, but showing for clarity as it's auto-calculated) */}
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-1">Lab Cost (Auto-calculated)</label>
                  <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Ksh {form.lab_cost.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Lab Procedures Text Area (Editable) */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-1">Lab Procedures</label>
                <textarea
                  value={form.lab_procedures}
                  onChange={(e) => updateForm("lab_procedures", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Procedures will appear here when selected above..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Diagnosis, procedure details, treatment notes..."
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-300 hover:bg-blue-700 shadow-sm"
                >
                  {submitting ? "Processing..." : "Mark as Completed"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(true)}
                  className="text-sm px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                >
                  Request Materials
                </button>
                {message && (
                  <span className="text-xs text-green-600 font-medium">{message}</span>
                )}
              </div>
            </form>

            {/* Inventory Request Modal */}
            <InventoryRequestModal
              isOpen={showInventoryModal}
              onClose={() => setShowInventoryModal(false)}
              source="internal_lab"
              patientName={selectedPatient?.name}
              sourceReference={selectedPatient ? `Patient #${selectedPatient.no}` : undefined}
            />
          </Card>
        ) : (
          <div className="md:col-span-3 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            Select a patient from the queue above to start processing.
          </div>
        )}
      </div>

      {/* 2. Completed Lab Works Table */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Completed Lab Works</h2>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2">NO</th>
                <th className="p-2">PATIENT</th>
                <th className="p-2">PROCEDURE</th>
                <th className="p-2">LAB PROCEDURES</th>
                <th className="p-2">NOTES</th>
                <th className="p-2">TYPE</th>
                <th className="p-2">LAB COST</th>
                <th className="p-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {completedLabPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500">No completed lab works.</td>
                </tr>
              ) : (
                completedLabPatients.map((p) => (
                  <tr key={p.no} className="border-t hover:bg-slate-50">
                    <td className="p-2">{p.no}</td>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-gray-500 min-w-[200px]">{p.procedure?.join(', ') || '-'}</td>
                    <td className="p-2 min-w-[200px]">{p.lab_procedures || '-'}</td>
                    <td className="p-2 min-w-[200px]">{p.lab_notes || '-'}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.lab_type === 'Internal' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {p.lab_type || 'Internal'}
                      </span>
                    </td>
                    <td className="p-2 font-semibold text-slate-800">
                      {p.lab_cost?.toLocaleString() || '0'}
                    </td>
                    <td className="p-2">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Completed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default InternalLabWorks;