// Top imports
import PageHeader from "../../components/PageHeader";
import { useState, useEffect } from "react";

type Employee = {
  id: number;
  name: string;
  baseSalary: number; // fixed monthly salary
};

function Payroll() {
  // Placeholder employees. Replace with your actual data source.
  const [employees] = useState<Employee[]>([
    { id: 1, name: "Alice Johnson", baseSalary: 1200 },
    { id: 2, name: "Michael Brown", baseSalary: 1500 },
    { id: 3, name: "Sarah Lee", baseSalary: 1000 },
  ]);

  const [nssfRate, setNssfRate] = useState<number>(0.05); // 5% example; adjust per policy
  const [periodDays, setPeriodDays] = useState<number>(30); // days in payroll period (e.g., month)
  const [leaveDays, setLeaveDays] = useState<Record<number, { paid: number; unpaid: number }>>({
    1: { paid: 2, unpaid: 1 },
    2: { paid: 0, unpaid: 0 },
    3: { paid: 1, unpaid: 2 },
  });

  // NEW: Year/Month selection
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  // NEW: Auto-calc period days based on year/month
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  useEffect(() => {
    setPeriodDays(daysInMonth(year, month));
  }, [year, month]);

  const setPaid = (id: number, val: number) =>
    setLeaveDays((m) => ({ ...m, [id]: { ...(m[id] ?? { paid: 0, unpaid: 0 }), paid: Math.max(0, val) } }));
  const setUnpaid = (id: number, val: number) =>
    setLeaveDays((m) => ({ ...m, [id]: { ...(m[id] ?? { paid: 0, unpaid: 0 }), unpaid: Math.max(0, val) } }));

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // NEW: Create payroll handler (stores to localStorage)
  const handleCreatePayroll = () => {
    const id = `${year}-${String(month).padStart(2, "0")}`;
    const items = employees.map((e) => {
      const perDay = e.baseSalary / periodDays;
      const { paid = 0, unpaid = 0 } = leaveDays[e.id] ?? { paid: 0, unpaid: 0 };
      const unpaidDeduction = perDay * unpaid;
      const nssf = e.baseSalary * nssfRate;
      const netPay = e.baseSalary - unpaidDeduction - nssf;
      return {
        employeeId: e.id,
        name: e.name,
        baseSalary: e.baseSalary,
        paidLeaveDays: paid,
        unpaidLeaveDays: unpaid,
        unpaidDeduction,
        nssf,
        netPay,
      };
    });

    const payrollRecord = {
      id,
      year,
      month,
      periodDays,
      nssfRate,
      createdAt: new Date().toISOString(),
      items,
    };

    const key = "payrolls";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    // Replace existing payroll for the same period if present
    const withoutDup = existing.filter((p: any) => p.id !== payrollRecord.id);
    localStorage.setItem(key, JSON.stringify([...withoutDup, payrollRecord]));

    // Optional reset of leave inputs for next period
    setLeaveDays({});
    alert(`Payroll ${id} created`);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Payroll" />

      <div className="rounded-lg border p-4 space-y-3">
        <div className="font-semibold">Payroll Settings</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* NEW: Year input */}
          <label className="text-sm">
            Year
            <input
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || `${new Date().getFullYear()}`, 10))}
              className="border rounded p-2 w-full mt-1"
            />
          </label>
          {/* NEW: Month select */}
          <label className="text-sm">
            Month
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value || "1", 10))}
              className="border rounded p-2 w-full mt-1"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </label>
          <label className="text-sm">
            NSSF Rate
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={nssfRate}
              onChange={(e) => setNssfRate(parseFloat(e.target.value || "0"))}
              className="border rounded p-2 w-full mt-1"
            />
          </label>
          <label className="text-sm">
            Period Days
            <input
              type="number"
              min="1"
              max="31"
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value || "30", 10))}
              className="border rounded p-2 w-full mt-1"
            />
          </label>
        </div>
        <div className="text-xs text-gray-600">
          Note: Paid leave doesn't reduce salary; unpaid leave deducts proportionally. NSSF is applied to base salary.
        </div>
        {/* NEW: Create payroll button and period summary */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCreatePayroll}
            className="border rounded px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Create Payroll
          </button>
          <div className="text-xs text-gray-600">
            Current period: {year}-{String(month).padStart(2, "0")} • {periodDays} days
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Employee</th>
              <th className="py-2 pr-4">Base Salary</th>
              <th className="py-2 pr-4">Paid Leave (days)</th>
              <th className="py-2 pr-4">Unpaid Leave (days)</th>
              <th className="py-2 pr-4">Unpaid Deduction</th>
              <th className="py-2 pr-4">NSSF</th>
              <th className="py-2 pr-4">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const perDay = e.baseSalary / periodDays;
              const { paid = 0, unpaid = 0 } = leaveDays[e.id] ?? { paid: 0, unpaid: 0 };
              const unpaidDeduction = perDay * unpaid;
              const nssf = e.baseSalary * nssfRate;
              const netPay = e.baseSalary - unpaidDeduction - nssf;

              return (
                <tr key={e.id} className="border-b">
                  <td className="py-2 pr-4">{e.name}</td>
                  <td className="py-2 pr-4">{fmt(e.baseSalary)}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min="0"
                      value={paid}
                      onChange={(ev) => setPaid(e.id, parseInt(ev.target.value || "0", 10))}
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min="0"
                      value={unpaid}
                      onChange={(ev) => setUnpaid(e.id, parseInt(ev.target.value || "0", 10))}
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="py-2 pr-4">{fmt(unpaidDeduction)}</td>
                  <td className="py-2 pr-4">{fmt(nssf)}</td>
                  <td className="py-2 pr-4 font-semibold">{fmt(netPay)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payroll;