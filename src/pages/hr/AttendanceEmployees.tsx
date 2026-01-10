import PageHeader from "../../components/PageHeader";
import SummaryCard from "../../components/SummaryCard";

function AttendanceEmployees() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Attendance & Employee Data" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard label="Present Today" value="62" />
        <SummaryCard label="Absent Today" value="6" />
        <SummaryCard label="Late Check-ins" value="4" />
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2">Employee Directory</div>
        <div className="text-sm text-gray-600 mb-4">
          This is a placeholder list. Replace with real data source.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Alice Johnson", dept: "HR", role: "Officer", status: "Active" },
                { name: "Michael Brown", dept: "IT", role: "Engineer", status: "Active" },
                { name: "Sarah Lee", dept: "Finance", role: "Analyst", status: "On Leave" },
              ].map((e) => (
                <tr key={e.name} className="border-b">
                  <td className="py-2 pr-4">{e.name}</td>
                  <td className="py-2 pr-4">{e.dept}</td>
                  <td className="py-2 pr-4">{e.role}</td>
                  <td className="py-2 pr-4">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceEmployees;