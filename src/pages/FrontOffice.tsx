import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";

// ADD: hooks for table filter/search
import { useMemo, useState, useEffect } from "react";
import { getWalkins, saveWalkin } from "../data/dataService";

// ADD: Patient data shape aligned with your fields
type Gender = "M" | "F";
interface PatientRecord {
  no: number;
  old?: number;
  newId?: number;       // NEW
  name: string;         // NAME
  g: Gender;            // Gender
  a: number;            // Age
  contacts: string;     // Contact Number
  res: string;          // Residence
  op: string;           // Payment Type
  dr: string;           // Doctor Assigned
  ins?: string;         // Insurance Details
  cpb?: string;         // Cash/Payment Balance
  inv?: number;         // Invoice Amount
  bal?: number;         // Balance
  tca?: number;         // Total Charges Amount
}

// ADD: Sample rows mirroring your preview
const samplePatients: PatientRecord[] = [
  {
    no: 1,
    old: 497,
    name: "KIMUTAI P",
    g: "M",
    a: 37,
    contacts: "721623756",
    res: "WESTINDIES",
    op: "PRIVATE",
    dr: "SP",
    cpb: "PB 4,500",
  },
  {
    no: 2,
    old: 38,
    name: "LIMO M",
    g: "M",
    a: 37,
    contacts: "721277962",
    res: "WESTINDIES",
    op: "MADISON",
    dr: "K",
    inv: 10000,
    bal: 9252,
    tca: 2000,
  },
  {
    no: 3,
    newId: 500,
    name: "[Blurred]",
    g: "F",
    a: 7,
    contacts: "728834464",
    res: "ANNEX",
    op: "MADISON",
    dr: "SP",
    inv: 5000,
    bal: 9247,
  },
];

// ADD: helper to show currency with thousands separators
const formatCurrency = (n: number) => n.toLocaleString();

function FrontOffice() {
  // ADD: simple search across NO/NAME/RES
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>(samplePatients);

  useEffect(() => {
    const stored = getWalkins();
    if (stored.length) {
      setPatients((prev) => [...prev, ...stored]);
    }
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
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
    const created = saveWalkin(input);
    setPatients((prev) => [...prev, created]);
    setShowForm(false);
    e.currentTarget.reset();
  }

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

      {/* ADD: Patient Records table that matches your Front Office fields */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Patient Records</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by NO, Name or Residence"
            className="border rounded-md px-3 py-2 text-sm w-64"
          />
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2">NO</th>
                <th className="p-2">OLD</th>
                <th className="p-2">NEW</th>
                <th className="p-2">NAME</th>
                <th className="p-2">G</th>
                <th className="p-2">A</th>
                <th className="p-2">CONTACTS</th>
                <th className="p-2">RES</th>
                <th className="p-2">OP</th>
                <th className="p-2">DR</th>
                <th className="p-2">INS</th>
                <th className="p-2">C/PB</th>
                <th className="p-2">INV</th>
                <th className="p-2">BAL</th>
                <th className="p-2">TCA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.no} className="border-t">
                  <td className="p-2">{p.no}</td>
                  <td className="p-2">{p.old ?? "—"}</td>
                  <td className="p-2">{p.newId ?? "—"}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.g}</td>
                  <td className="p-2">{p.a}</td>
                  <td className="p-2">{p.contacts}</td>
                  <td className="p-2">{p.res}</td>
                  <td className="p-2">{p.op}</td>
                  <td className="p-2">{p.dr}</td>
                  <td className="p-2">{p.ins ?? "—"}</td>
                  <td className="p-2">{p.cpb ?? "—"}</td>
                  <td className="p-2">{p.inv ? formatCurrency(p.inv) : "—"}</td>
                  <td className="p-2">{p.bal ? formatCurrency(p.bal) : "—"}</td>
                  <td className="p-2">{p.tca ? formatCurrency(p.tca) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form
            className="bg-white p-4 rounded-md space-y-3 w-full max-w-md"
            onSubmit={handleSubmit}
          >
            <h3 className="text-md font-semibold">New Walk-in</h3>
            <input
              name="name"
              placeholder="Name"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <div className="flex gap-2">
              <select name="g" className="border rounded-md px-3 py-2 w-24">
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <input
                name="a"
                type="number"
                placeholder="Age"
                className="border rounded-md px-3 py-2 w-full"
                required
              />
            </div>
            <input
              name="contacts"
              placeholder="Contacts"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <input
              name="res"
              placeholder="Residence"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <input
              name="op"
              placeholder="Payment Type (OP)"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <input
              name="dr"
              placeholder="Doctor Assigned"
              className="border rounded-md px-3 py-2 w-full"
              required
            />
            <input
              name="ins"
              placeholder="Insurance (optional)"
              className="border rounded-md px-3 py-2 w-full"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="border px-3 py-2 rounded-md"
                onClick={() => setShowForm(false)}
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