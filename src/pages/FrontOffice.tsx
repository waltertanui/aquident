// Top-level imports
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import AllRecords from "../components/AllRecords";

// ADD: hooks for table filter/search
import { useMemo, useState, useEffect, useRef } from "react";

// REMOVE: deprecated local dataService imports
// import { getWalkins, saveWalkin } from "../data/dataService";

// Ensure Supabase middleware imports (already present)
import { listWalkins, createWalkin, type PatientRecord, type Gender } from "../middleware/data";

// REMOVE: local sample data — fetch from Supabase instead
// const samplePatients: PatientRecord[] = [
//   { /* ... */ },
//   { /* ... */ },
//   { /* ... */ },
// ];

// ADD: helper to show currency with thousands separators
const formatCurrency = (n: number) => n.toLocaleString();

function FrontOffice() {
  // ADD: simple search across NO/NAME/RES
  // CHANGE: initialize with empty list; we'll fetch only from Supabase
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);

  useEffect(() => {
    // CHANGE: fetch all from Supabase and replace local state
    const run = async () => {
      const stored = await listWalkins();
      setPatients(stored);
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.res.toLowerCase().includes(q) ||
        String(p.no).includes(q)
    );
  }, [query, patients]);

  // ADD: form typing state + existing selection + refs to prefill
  const [tempName, setTempName] = useState("");
  const [tempContacts, setTempContacts] = useState("");
  const [selectedExisting, setSelectedExisting] = useState<PatientRecord | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const contactsRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const resRef = useRef<HTMLInputElement>(null);
  const opRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);

  const existingMatches = useMemo(() => {
    const nameQ = tempName.trim().toLowerCase();
    const contactQ = tempContacts.trim();
    if (!nameQ && !contactQ) return [];
    return patients
      .filter(
        (p) =>
          (nameQ && p.name.toLowerCase().includes(nameQ)) ||
          (contactQ && p.contacts.includes(contactQ))
      )
      .slice(0, 5);
  }, [tempName, tempContacts, patients]);

  function pickExisting(p: PatientRecord) {
    setSelectedExisting(p);
    if (nameRef.current) nameRef.current.value = p.name;
    if (contactsRef.current) contactsRef.current.value = p.contacts;
    if (ageRef.current) ageRef.current.value = String(p.a);
    // ADD: prefill DOB if available
    if (dobRef.current && p.dob) dobRef.current.value = p.dob;
    if (resRef.current) resRef.current.value = p.res;
    if (opRef.current) opRef.current.value = p.op;
    if (genderRef.current) genderRef.current.value = p.g;
  }

  function clearExisting() {
    setSelectedExisting(null);
  }

  // CHANGE: make submit async and save via middleware
  // CHANGE: capture form before await; reset before closing the modal
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // FIX: capture the form element before any await
    const form = e.currentTarget;

    try {
      const fd = new FormData(form);
      const input = {
        name: String(fd.get("name") || ""),
        g: (String(fd.get("g") || "M") as Gender),
        a: Number(fd.get("a") || 0),
        contacts: String(fd.get("contacts") || ""),
        res: String(fd.get("res") || ""),
        op: String(fd.get("op") || ""),
        dr: String(fd.get("dr") || ""),
        ins: fd.get("ins") ? String(fd.get("ins")) : undefined,
      };
      // ADD: read DOB from form (keep out of saveWalkin to avoid extra property checks)
      const dob = String(fd.get("dob") || "");

      const created = await createWalkin(input, dob);

      const merged = selectedExisting
        ? { ...created, old: selectedExisting.old ?? selectedExisting.no }
        : { ...created, newId: (created as any).newId ?? (created as any).no };

      const finalRecord = { ...merged, dob: dob || (selectedExisting?.dob || undefined) };

      setPatients((prev) => [...prev, finalRecord]);

      // FIX: reset the form before closing the modal (prevents null reference)
      form.reset();

      setShowForm(false);
      setSelectedExisting(null);
      // NOTE: removed e.currentTarget.reset() (SyntheticEvent becomes null after await)
    } catch (err) {
      console.error("Failed to create walk-in:", err);
      alert("Failed to save to Supabase. Please try again.");
    }
  }

  // Handle patient update from CompletedLabWorksTable
  function handleUpdatePatient(updatedPatient: PatientRecord) {
    setPatients((prev) =>
      prev.map((p) => (p.no === updatedPatient.no ? updatedPatient : p))
    );
  }

  // Prefill the form when opened from "Create from search"
  useEffect(() => {
    if (showForm && nameRef.current && tempName) {
      nameRef.current.value = tempName;
    }
    if (showForm && contactsRef.current && tempContacts) {
      contactsRef.current.value = tempContacts;
    }
  }, [showForm, tempName, tempContacts]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Front Office"
        action={{ label: "New Walk-in", onClick: () => setShowForm(true) }}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Check-ins Today" value="42" />
        <SummaryCard label="Pending Forms" value="15" />
        <SummaryCard label="Messages" value="9" />
        <SummaryCard label="Open Tickets" value="3" />
      </div>

      import AllRecords from "../components/AllRecords";

      // ... imports

      // ... inside component ...
      {/* Search Bar */}
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Patient Records</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by NO, Name or Residence"
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-64"
        />
      </div>

      {/* Replaced manual tables with AllRecords component */}
      <AllRecords
        patients={filtered}
        query={query}
        onShowForm={() => setShowForm(true)}
        onSetTempName={(name) => setTempName(name)} // To capture search text when clicking "Create new"
        onUpdatePatient={handleUpdatePatient}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            className="bg-white p-4 rounded-md space-y-3 w-full max-w-md"
            onSubmit={handleSubmit}
          >
            <h3 className="text-md font-semibold">New Walk-in</h3>

            {/* ADD: existing selection banner */}
            {selectedExisting && (
              <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm">
                <span>
                  Existing client selected: {selectedExisting.name} — {selectedExisting.contacts}
                </span>
                <button
                  type="button"
                  className="text-green-700 underline"
                  onClick={clearExisting}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="relative">
              <input
                ref={nameRef}
                name="name"
                placeholder="Name"
                className="border rounded-md px-3 py-2 w-full"
                required
                onChange={(e) => setTempName(e.target.value)}
              />
              {/* Suggestion overlay: also show a hint to proceed if no matches */}
              {!selectedExisting && (existingMatches.length > 0 || tempName || tempContacts) && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                  {existingMatches.map((p) => (
                    <button
                      key={`${p.no}-${p.contacts}`}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => pickExisting(p)}
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-gray-500">{p.contacts}</span>
                    </button>
                  ))}
                  {existingMatches.length === 0 && (tempName || tempContacts) && (
                    <div className="px-3 py-2 text-sm text-gray-600">
                      No existing client found. Continue with entered details.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <select
                ref={genderRef}
                name="g"
                className="border rounded-md px-3 py-2 w-24"
              >
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <input
                ref={ageRef}
                name="a"
                type="number"
                placeholder="Age"
                className="border rounded-md px-3 py-2 w-full"
                required
              />
            </div>
            {/* ADD: Date of Birth field */}
            <input
              ref={dobRef}
              name="dob"
              type="date"
              placeholder="Date of Birth"
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              ref={contactsRef}
              name="contacts"
              placeholder="Contacts"
              className="border rounded-md px-3 py-2 w-full"
              required
              onChange={(e) => setTempContacts(e.target.value)}
            />
            <input
              ref={resRef}
              name="res"
              placeholder="Residence"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <input
              ref={opRef}
              name="op"
              placeholder="Payment Type (OP)"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="border px-3 py-2 rounded-md"
                onClick={() => {
                  setShowForm(false);
                  setSelectedExisting(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default FrontOffice;