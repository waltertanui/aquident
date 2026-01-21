import { useMemo, useState, useEffect } from "react";
import { listWalkins, updateWalkin, type PatientRecord, type TimeRange } from "../middleware/data";
import InventoryRequestModal from "../components/InventoryRequestModal";

type ProcedureItem = { id: string; name: string; price: number };
type ProcedureCategory = { id: string; name: string; items: ProcedureItem[] };

const PROCEDURES: ProcedureCategory[] = [
  {
    id: "consultation",
    name: "Consultation",
    items: [
      { id: "consultation", name: "Consultation", price: 1000 },
    ],
  },
  {
    id: "restorative",
    name: "Restorative",
    items: [
      { id: "filling", name: "Filling", price: 5000 },
      { id: "rct_anterior", name: "Root Canal Treatment - Anterior", price: 12000 },
      { id: "rct_premolars", name: "Root Canal Treatment - Premolars", price: 15000 },
      { id: "rct_molars", name: "Root Canal Treatment - Molars", price: 15000 },
      { id: "indirect_pulp_capping", name: "Indirect Pulp Capping", price: 6000 },
      { id: "direct_pulp_capping", name: "Direct Pulp Capping", price: 6000 },
      { id: "fissure_sealant", name: "Fissure Sealant (Per Tooth)", price: 3000 },
    ],
  },
  {
    id: "cosmetic",
    name: "Cosmetic",
    items: [
      { id: "masking", name: "Masking - Per Tooth", price: 5000 },
      { id: "bleaching", name: "Bleaching (Upper or Lower)", price: 20000 },
      { id: "tooth_gem", name: "Tooth Gem (Per Gem)", price: 1000 },
    ],
  },
  {
    id: "periodontal",
    name: "Periodontal",
    items: [
      { id: "scaling", name: "Scaling", price: 5000 },
      { id: "polishing", name: "Polishing", price: 2000 },
      { id: "scaling_polishing", name: "Scaling & Polishing", price: 7000 }, // IMPLIED sum or package? List says Scaling 5k, Polishing 2k.
      { id: "deep_cleaning", name: "Deep Cleaning", price: 10000 },
      { id: "fluoride_therapy", name: "Fluoride Therapy", price: 5000 },
    ],
  },
  {
    id: "orthodontics",
    name: "Orthodontics",
    items: [
      { id: "ortho_consultation", name: "Ortho Consultation", price: 3000 },
      { id: "braces", name: "Braces (Per Jaw)", price: 75000 }, // Range 75k-100k
      { id: "retainers", name: "Retainers", price: 10000 },
      { id: "study_models", name: "Study Models", price: 2000 },
      { id: "braces_removal", name: "Braces Removal (Per Jaw)", price: 10000 },
      { id: "ortho_appliance", name: "Orthodontic Appliance (Per Jaw)", price: 30000 },
      { id: "ext_ortho_review", name: "External Ortho Reviews", price: 3000 },
      { id: "bracket_replacement", name: "Bracket Replacement (Per Backet)", price: 2000 },
    ],
  },
  {
    id: "oral_surgery",
    name: "Oral Surgery",
    items: [
      { id: "extraction_adult", name: "Extraction (Adults)", price: 2500 },
      { id: "extraction_child", name: "Extraction (Kids)", price: 2000 },
      { id: "dry_socket", name: "Dry Socket", price: 3000 },
      { id: "operculectomy", name: "Operculectomy", price: 4000 },
      { id: "open_disimpaction", name: "Open Disimpaction", price: 15000 },
      { id: "closed_disimpaction", name: "Closed Disimpaction", price: 5000 },
      { id: "incision_drainage", name: "Incision & Drainage", price: 5000 },
      { id: "splinting", name: "Splinting", price: 7000 },
      { id: "mmf_fracture", name: "MMF / Jaw Fracture Fixation", price: 50000 },
      { id: "implant", name: "Implant", price: 200000 },
    ],
  },
  {
    id: "prosthodontics",
    name: "Prosthodontics",
    items: [
      { id: "crown_pfm", name: "Crown - PFM", price: 25000 },
      { id: "crown_emax", name: "Crown - Emax", price: 30000 },
      { id: "crown_zirconia", name: "Crown - Zirconia", price: 40000 },
      { id: "crown_recement", name: "Crown Recementing", price: 3000 },
      { id: "complete_denture", name: "Complete Denture (Per Jaw)", price: 25000 },
      { id: "rpd_1st", name: "RPD (1st Tooth)", price: 10000 },
      { id: "rpd_add", name: "RPD (Additional Tooth)", price: 2000 },
      { id: "veneers", name: "Veneers (Per Tooth)", price: 25000 },
      { id: "flex_denture", name: "Flexible Denture (Per Jaw)", price: 40000 },
      { id: "night_guard", name: "Night Guard", price: 10000 },
    ],
  },
  {
    id: "kids_procedures",
    name: "Kids Procedures",
    items: [
      { id: "pulpectomy", name: "Pulpectomy", price: 10000 },
      { id: "pulpotomy", name: "Pulpotomy", price: 8000 },
      { id: "space_maintainer", name: "Space Maintainer", price: 10000 },
      { id: "ss_crown", name: "SS Crown (Per Tooth)", price: 10000 },
    ],
  },
  {
    id: "imaging",
    name: "Imaging",
    items: [
      { id: "iopa", name: "IOPA", price: 1000 },
      { id: "opg", name: "OPG", price: 1000 },
      { id: "cbct", name: "CBCT", price: 4500 },
      { id: "lat_ceph", name: "Lateral Ceph", price: 2500 },
      { id: "bitewing", name: "Bitewing (Left or Right)", price: 1000 },
      { id: "bi_bitewing", name: "Bilateral Bitewing", price: 2000 },
    ],
  },
];



const getAge = (p: PatientRecord) => {
  if (p.dob) {
    const d = new Date(p.dob);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age;
    }
  }
  return p.a;
};

const formatDOB = (dob?: string) => {
  if (!dob) return "—";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const DOCTORS = ["Dr. Patel", "Dr. Lee", "Dr. Smith", "Dr. Jones"];

export default function Clinic() {
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Tooth selection state
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isChildDentition, setIsChildDentition] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeRange>('Today');

  const filteredByTime = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return patients.filter(p => {
      if (!p.created_at) return true;
      const d = new Date(p.created_at);
      if (timeFilter === 'Today') return d >= today;
      const diffDays = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (timeFilter === 'Weekly') return diffDays <= 7;
      if (timeFilter === 'Monthly') return diffDays <= 30;
      if (timeFilter === 'Quarterly') return diffDays <= 90;
      return true;
    });
  }, [patients, timeFilter]);

  // Derived state
  const activePatients = useMemo(() => filteredByTime.filter(p => p.status === 'active'), [filteredByTime]);
  // CHANGED: Include 'lab' status in this table so doctors can see them
  const completedPatients = useMemo(() => filteredByTime.filter(p => p.status === 'completed' || p.status === 'lab'), [filteredByTime]);

  const calculatedTotal = useMemo(() => {
    let total = 0;
    for (const id of Array.from(selected)) {
      const qty = quantities[id] || 1;
      for (const cat of PROCEDURES) {
        const found = cat.items.find(i => i.id === id);
        if (found) {
          total += found.price * qty;
          break;
        }
      }
    }
    return total;
  }, [selected, quantities]);

  // Fetch walk-ins on mount
  useEffect(() => {
    listWalkins().then(setPatients);
  }, []);

  const handlePatientSelect = (p: PatientRecord) => {
    setSelectedPatient(p);
    setPatientId(String(p.no));

    // Auto-detect dentition removed per user request
    setSelectedTeeth(new Set()); // Reset teeth selection
  };

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

  const clearAll = () => {
    setSelected(new Set());
    setSelectedTeeth(new Set());
    setQuantities({});
  };

  const handleQuantityChange = (id: string, val: string) => {
    const qty = parseInt(val) || 1;
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const toggleTooth = (t: number) => {
    setSelectedTeeth(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const assign = async (nextStatus: 'completed' | 'lab') => {
    if (!selectedPatient || selected.size === 0) return;
    if (!doctorName) {
      alert("Please select a doctor.");
      return;
    }

    // Procedure list from IDs to Names
    const teethString = selectedTeeth.size > 0 ? ` (${Array.from(selectedTeeth).sort((a, b) => a - b).join(', ')})` : "";

    // Procedure list from IDs to Names
    let calculatedCost = 0;
    const procedureNames = Array.from(selected).map(id => {
      const qty = quantities[id] || 1;
      for (const cat of PROCEDURES) {
        const found = cat.items.find(i => i.id === id);
        if (found) {
          calculatedCost += found.price * qty;
          return `${found.name}${teethString}${qty > 1 ? ` (x${qty})` : ''}`;
        }
      }
      return `${id}${teethString}${qty > 1 ? ` (x${qty})` : ''}`;
    });

    const success = await updateWalkin(selectedPatient.no, {
      status: nextStatus,
      procedure: procedureNames,
      doc_name: doctorName || 'Unknown',
      clinic_cost: calculatedCost, // Update clinic cost automatically
    });

    if (success) {
      // Refresh local state to move patient
      setPatients(prev => prev.map(p =>
        p.no === selectedPatient.no
          ? { ...p, status: nextStatus, procedure: procedureNames, doc_name: doctorName, clinic_cost: calculatedCost }
          : p
      ));

      // Reset form
      setSelectedPatient(null);
      setPatientId("");
      setSelected(new Set());
      setDoctorName("");
      setNotes("");
      setSelectedTeeth(new Set());
      setQuantities({});
    } else {
      alert("Failed to assign procedures.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* --- ADDED: Overview header + dashboard sections (keeps original styling) --- */}
      <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage patient treatments and assignments</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-gray-100 shadow-sm">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">View Range:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeRange)}
              className="border-none rounded-lg px-3 py-2 text-sm bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all min-w-[140px]"
            >
              <option value="Today">Today Only</option>
              <option value="Weekly">Weekly (7 Days)</option>
              <option value="Monthly">Monthly (30 Days)</option>
              <option value="Quarterly">Quarterly (90 Days)</option>
              <option value="All">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* --- ADDED: Walk-in Queue (Table View) --- */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-slate-700 mb-3">Walk-in Queue (Select Patient)</h2>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-2">NO</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">G</th>
                  <th className="p-2">AGE</th>
                  <th className="p-2">DOB</th>
                  <th className="p-2">CONTACTS</th>
                  <th className="p-2">RES</th>
                  <th className="p-2">Insurance</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      No walk-ins found.
                    </td>
                  </tr>
                ) : (
                  activePatients.map((p) => (
                    <tr
                      key={p.no}
                      onClick={() => handlePatientSelect(p)}
                      className={`cursor-pointer border-t hover:bg-blue-50 transition-colors ${selectedPatient?.no === p.no ? 'bg-blue-100' : ''}`}
                    >
                      <td className="p-2">{p.no}</td>
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2">{p.g}</td>
                      <td className="p-2">{getAge(p)}</td>
                      <td className="p-2">{formatDOB(p.dob)}</td>
                      <td className="p-2">{p.contacts}</td>
                      <td className="p-2">{p.res}</td>
                      <td className="p-2">{p.op}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>



      </div>
      {/* --- END ADDED --- */}

      {/* ... existing code ... */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Selected Patient</label>
          {selectedPatient ? (
            <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 flex items-center justify-between">
              <span className="font-medium">{selectedPatient.name} (ID: {selectedPatient.no})</span>
              <button onClick={() => { setSelectedPatient(null); setPatientId(""); }} className="text-xs text-blue-600 hover:text-blue-800 underline">Change</button>
            </div>
          ) : (
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Select a patient from the queue above or type ID"
            />
          )}
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
                  <div key={item.id} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <span className="text-sm">{item.name}</span>
                    </label>
                    {selected.has(item.id) && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          className="w-12 px-1 py-0.5 border rounded text-xs text-center"
                          value={quantities[item.id] || 1}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>


      {/* Tooth Selection UI */}
      <div className="rounded border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Tooth Selection</h3>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="dentition"
                checked={!isChildDentition}
                onChange={() => {
                  setIsChildDentition(false);
                  setSelectedTeeth(new Set());
                }}
              />
              Adult (Permanent)
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="dentition"
                checked={isChildDentition}
                onChange={() => {
                  setIsChildDentition(true);
                  setSelectedTeeth(new Set());
                }}
              />
              Child (Deciduous)
            </label>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Upper Arch */}
          <div className="flex gap-8">
            {/* Q1 / Q5 (Right) - Reverse order 8-1 or 5-1 */}
            <div className="flex gap-1">
              {(isChildDentition ? [55, 54, 53, 52, 51] : [18, 17, 16, 15, 14, 13, 12, 11]).map(t => (
                <button
                  key={t}
                  onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${selectedTeeth.has(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Q2 / Q6 (Left) - Normal order 1-8 or 1-5 */}
            <div className="flex gap-1">
              {(isChildDentition ? [61, 62, 63, 64, 65] : [21, 22, 23, 24, 25, 26, 27, 28]).map(t => (
                <button
                  key={t}
                  onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${selectedTeeth.has(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="flex gap-8">
            {/* Q4 / Q8 (Right) - Reverse order 8-1 or 5-1 */}
            <div className="flex gap-1">
              {(isChildDentition ? [85, 84, 83, 82, 81] : [48, 47, 46, 45, 44, 43, 42, 41]).map(t => (
                <button
                  key={t}
                  onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${selectedTeeth.has(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Q3 / Q7 (Left) - Normal order 1-8 or 1-5 */}
            <div className="flex gap-1">
              {(isChildDentition ? [71, 72, 73, 74, 75] : [31, 32, 33, 34, 35, 36, 37, 38]).map(t => (
                <button
                  key={t}
                  onClick={() => toggleTooth(t)}
                  className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${selectedTeeth.has(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-slate-400">
          ISO 3950 Notation · {isChildDentition ? "Deciduous (Child)" : "Permanent (Adult)"}
        </div>
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

      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="text-sm text-gray-600">
          Selected: <span className="font-semibold text-gray-900">{selectedCount}</span> items
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500 mr-2">Estimated Total:</span>
          <span className="text-2xl font-bold text-blue-700">Ksh {calculatedTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={doctorName}
          onChange={e => setDoctorName(e.target.value)}
        >
          <option value="">Select Doctor (Required)</option>
          {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setShowInventoryModal(true)}
          disabled={!selectedPatient}
          className="rounded bg-amber-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-amber-700"
        >
          Request Supplies
        </button>
        <button
          type="button"
          onClick={() => assign('lab')}
          disabled={!patientId || selected.size === 0}
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-indigo-700"
        >
          Send to Lab
        </button>
        <button
          type="button"
          onClick={() => assign('completed')}
          disabled={!patientId || selected.size === 0}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-green-700"
        >
          To Front Office
        </button>
      </div>

      {/* Inventory Request Modal */}
      <InventoryRequestModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        source="clinic"
        patientName={selectedPatient?.name}
        sourceReference={selectedPatient ? `Patient #${selectedPatient.no}` : undefined}
      />

      <div className="text-xs text-gray-500">
        After clicking Assign, check the browser console to see the payload.
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">Completed Treatments</h2>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-xs text-slate-500 border-b">
              <th className="py-2 pl-2">NO</th>
              <th className="py-2">PATIENT</th>
              <th className="py-2">PROCEDURE</th>
              <th className="py-2">DOCTOR</th>
              <th className="py-2">COST</th>
              <th className="py-2">STATUS</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {completedPatients.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-gray-500">No completed treatments yet.</td></tr>
            ) : (
              completedPatients.map(p => (
                <tr key={p.no} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 pl-2 ">{p.no}</td>
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{p.procedure?.join(", ") || "-"}</td>
                  <td className="py-2">{p.doc_name || "-"}</td>
                  <td className="py-2">Ksh {p.clinic_cost?.toLocaleString() || '0'}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-1 text-xs capitalize ${p.status === 'lab'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {p.status === 'lab' ? 'Sent to Lab' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div >
  );
}