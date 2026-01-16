import PageHeader from "../../components/PageHeader";
import { NavLink } from "react-router-dom";

function Reports() {
    return (
        <div className="p-6 space-y-6">
            <PageHeader title="Daily Reports" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <NavLink to="/reports/assistant" className="block p-6 bg-white rounded-lg shadow-sm border hover:border-teal-500 transition-colors">
                    <h3 className="text-lg font-semibold text-teal-700">Dental Assistant</h3>
                    <p className="text-sm text-gray-600 mt-2">Submit daily patient care and sterilization reports.</p>
                </NavLink>

                <NavLink to="/reports/lab" className="block p-6 bg-white rounded-lg shadow-sm border hover:border-teal-500 transition-colors">
                    <h3 className="text-lg font-semibold text-teal-700">Lab Technologist</h3>
                    <p className="text-sm text-gray-600 mt-2">Submit daily case work and quality control reports.</p>
                </NavLink>

                <NavLink to="/reports/finance" className="block p-6 bg-white rounded-lg shadow-sm border hover:border-teal-500 transition-colors">
                    <h3 className="text-lg font-semibold text-teal-700">Finance & Admin</h3>
                    <p className="text-sm text-gray-600 mt-2">Submit daily transaction and financial record reports.</p>
                </NavLink>

                <NavLink to="/reports/manager" className="block p-6 bg-teal-50 rounded-lg shadow-sm border border-teal-200 hover:border-teal-500 transition-colors">
                    <h3 className="text-lg font-semibold text-teal-700">Manager Dashboard</h3>
                    <p className="text-sm text-gray-600 mt-2">View and analyze reports from all departments.</p>
                </NavLink>
            </div>
        </div>
    );
}

export default Reports;
