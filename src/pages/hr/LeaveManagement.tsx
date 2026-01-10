import PageHeader from "../../components/PageHeader";
import { useState } from "react";

type LeaveApplication = {
  id: number;
  employeeName: string;
  type: "Paid" | "Unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

function LeaveManagement() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [form, setForm] = useState<LeaveApplication>({
    id: 0,
    employeeName: "",
    type: "Paid",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending",
  });

  const submit = () => {
    if (!form.employeeName || !form.startDate || !form.endDate) return;
    const id = applications.length ? applications[applications.length - 1].id + 1 : 1;
    setApplications([...applications, { ...form, id }]);
    setForm({ id: 0, employeeName: "", type: "Paid", startDate: "", endDate: "", reason: "", status: "Pending" });
  };

  const setStatus = (id: number, status: LeaveApplication["status"]) => {
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Leave Management" />

      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2">Apply for Leave</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border rounded p-2"
            placeholder="Employee Name"
            value={form.employeeName}
            onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
          />
          <select
            className="border rounded p-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "Paid" | "Unpaid" })}
          >
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <input
            type="date"
            className="border rounded p-2"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <input
            type="date"
            className="border rounded p-2"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <textarea
            className="border rounded p-2 md:col-span-2"
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={submit}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2">Pending & Recent Applications</div>
        {applications.length === 0 ? (
          <div className="text-sm text-gray-600">No applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Dates</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2 pr-4">{a.employeeName}</td>
                    <td className="py-2 pr-4">{a.type}</td>
                    <td className="py-2 pr-4">
                      {a.startDate} - {a.endDate}
                    </td>
                    <td className="py-2 pr-4">{a.reason}</td>
                    <td className="py-2 pr-4">{a.status}</td>
                    <td className="py-2 pr-4 space-x-2">
                      <button
                        className="px-3 py-1 rounded border hover:bg-green-50"
                        onClick={() => setStatus(a.id, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1 rounded border hover:bg-red-50"
                        onClick={() => setStatus(a.id, "Rejected")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveManagement;