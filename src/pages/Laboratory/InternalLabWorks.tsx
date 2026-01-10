import PageHeader from "../../components/PageHeader";
import Card from "../../ui/Card";
// Add React state for the form
import { useState, useEffect } from "react";

type WorkOrderForm = {
  patientId: string;
  appointmentDate: string;
  procedureType: string;
  tooth: string;
  clinician: string;
  inventoryChecked: boolean;
  notes: string;
};

type MaterialItem = {
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
};

function InternalLabWorks() {
  // REMOVED: workflow steps overview
  // const steps = [ ... ];  // deleted

  // REMOVED: earlier return block that only showed "Workflow Overview" using `steps`
  // return ( ... )  // deleted

  // Initialize form state
  const [form, setForm] = useState<WorkOrderForm>({
    patientId: "",
    appointmentDate: "",
    procedureType: "",
    tooth: "",
    clinician: "",
    inventoryChecked: false,
    notes: "",
  });

  // Dynamic materials list
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { name: "", quantity: 1, unit: "" },
  ]);

  // NEW: receive basic info from front office and prefill form/materials
  const [frontOfficeInfo, setFrontOfficeInfo] =
    useState<Partial<WorkOrderForm> & { materials?: MaterialItem[] } | null>(null);

  useEffect(() => {
    async function fetchFrontOfficeInfo() {
      try {
        // TODO: replace with your actual API call to fetch basic info from front office
        // Example:
        // const res = await fetch("/api/front-office/basic-info?orderId=...");
        // const info = await res.json();
        const info = null; // placeholder

        if (info) {
          setFrontOfficeInfo(info);
          setForm((prev) => ({ ...prev, ...info }));
          if (info.materials?.length) {
            setMaterials(info.materials);
          }
        }
      } catch (err) {
        console.error("Failed to fetch front office info", err);
      }
    }

    fetchFrontOfficeInfo();
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Simple validation
  // CHANGED: Remove patientId and appointmentDate from required fields
  const isValid = [form.procedureType, form.clinician]
    .every((v) => v.trim().length > 0);

  // Form helpers
  function updateForm<K extends keyof WorkOrderForm>(
    key: K,
    value: WorkOrderForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMaterial(
    index: number,
    key: keyof MaterialItem,
    value: string | number
  ) {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    );
  }

  function addMaterial() {
    setMaterials((prev) => [...prev, { name: "", quantity: 1, unit: "" }]);
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setMessage(null);

    // Payload to send to backend
    const payload = {
      ...form,
      materials: materials.filter((m) => m.name.trim()),
    };

    try {
      // TODO: replace with your API call
      // await fetch("/api/internal-lab-works", { method: "POST", body: JSON.stringify(payload) })
      console.log("Submitting internal lab work order:", payload);
      setMessage("Internal lab work order saved successfully.");
      // Optional: reset form
      setForm({
        patientId: "",
        appointmentDate: "",
        procedureType: "",
        tooth: "",
        clinician: "",
        inventoryChecked: false,
        notes: "",
      });
      setMaterials([{ name: "", quantity: 1, unit: "" }]);
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
      <Card>
        <div className="text-sm text-gray-600">
          Internal lab queue, specimens, and results overview go here.
        </div>

        {/* Data collection form for internal lab work */}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <h3 className="text-sm font-medium text-gray-900">Create Internal Work Order</h3>

          {/* REMOVED: Patient ID and Appointment Date/Time inputs (now fetched from front office) */}

          {/* Procedure Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-700">Procedure Type</label>
              <select
                value={form.procedureType}
                onChange={(e) => updateForm("procedureType", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm bg-white"
                required
              >
                <option value="">Select a procedure</option>
                <option value="Extraction">Extraction</option>
                <option value="Crown Preparation">Crown Preparation</option>
                <option value="Filling">Filling</option>
                <option value="Root Canal">Root Canal</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700">Tooth (optional)</label>
              <input
                type="text"
                value={form.tooth}
                onChange={(e) => updateForm("tooth", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                placeholder="e.g., #12"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700">Clinician</label>
              <input
                type="text"
                value={form.clinician}
                onChange={(e) => updateForm("clinician", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                placeholder="Dr. Jane Doe"
                required
              />
            </div>
          </div>

          {/* Inventory Check */}
          <div className="flex items-center gap-2">
            <input
              id="inventoryChecked"
              type="checkbox"
              checked={form.inventoryChecked}
              onChange={(e) => updateForm("inventoryChecked", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="inventoryChecked" className="text-xs text-gray-700">
              Inventory checked and materials available
            </label>
          </div>

          {/* Materials Used */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">Materials Used</label>
              <button
                type="button"
                onClick={addMaterial}
                className="text-xs px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
              >
                + Add Material
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {materials.map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end"
                >
                  <div className="md:col-span-5">
                    <label className="block text-xs text-gray-700">Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMaterial(idx, "name", e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="e.g., Anesthetic"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min={0}
                      value={m.quantity}
                      onChange={(e) =>
                        updateMaterial(idx, "quantity", Number(e.target.value))
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-700">Unit</label>
                    <input
                      type="text"
                      value={m.unit}
                      onChange={(e) => updateMaterial(idx, "unit", e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="ml, pcs, g"
                    />
                  </div>
                  {/* NEW: Cost per material */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-700">Cost</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={m.cost ?? 0}
                      onChange={(e) => updateMaterial(idx, "cost", Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 w-full"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
              rows={3}
              placeholder="Diagnosis, procedure details, treatment notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:bg-gray-300"
            >
              {submitting ? "Saving..." : "Save Work Order"}
            </button>
            {message && (
              <span className="text-xs text-gray-600">{message}</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default InternalLabWorks;