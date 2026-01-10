// ... existing code ...
import PageHeader from "../../components/PageHeader";
import SummaryCard from "../../components/SummaryCard";
import { Link } from "react-router-dom"; // New: link to sub-pages
// ... existing code ...

function HumanResources() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Human Resources" action={{ label: "New Employee" }} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Staff" value="68" />
        <SummaryCard label="On Leave" value="5" />
        <SummaryCard label="Open Positions" value="3" />
        <SummaryCard label="Pending Reviews" value="7" />
      </div>

      {/* New: Quick navigation to the three HR sub-pages */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/hr/attendance-employees"
          className="rounded-lg border p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold">Attendance & Employee Data</div>
          <div className="text-sm text-gray-600">
            View attendance summaries and employee records.
          </div>
        </Link>

        <Link
          to="/hr/leave-management"
          className="rounded-lg border p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold">Leave Management</div>
          <div className="text-sm text-gray-600">
            Apply for leave and manage approvals.
          </div>
        </Link>

        <Link
          to="/hr/payroll"
          className="rounded-lg border p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold">Payroll</div>
          <div className="text-sm text-gray-600">
            Fixed salary, paid/unpaid leave, and NSSF deductions.
          </div>
        </Link>
      </div>
    </div>
  );
}

// ... existing code ...
export default HumanResources;