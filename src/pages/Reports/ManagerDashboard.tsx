import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { listDailyReports, type DailyReport, type ReportDepartment } from "../../middleware/data";

export default function ManagerDashboard() {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [deptFilter, setDeptFilter] = useState<ReportDepartment | "all">("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, [dateFilter]);

    const fetchReports = async () => {
        setIsLoading(true);
        const data = await listDailyReports(dateFilter);
        setReports(data);
        setIsLoading(false);
    };

    const filteredReports = deptFilter === "all"
        ? reports
        : reports.filter(r => r.department === deptFilter);

    const renderContent = (report: DailyReport) => {
        const c = report.content;
        const items = Object.entries(c).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-gray-100 py-1 last:border-0">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium text-gray-800">
                    {typeof value === 'boolean' ? (value ? '✅' : '❌') : value || '-'}
                </span>
            </div>
        ));
        return <div className="space-y-1 mt-4 text-xs">{items}</div>;
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader title="Manager Dashboard - All Reports" />

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1">Report Date</label>
                    <input type="date" className="border rounded px-3 py-1.5 text-sm"
                        value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1">Department</label>
                    <select className="border rounded px-3 py-1.5 text-sm"
                        value={deptFilter} onChange={e => setDeptFilter(e.target.value as any)}>
                        <option value="all">All Departments</option>
                        <option value="assistant">Dental Assistant</option>
                        <option value="lab">Lab Technologist</option>
                        <option value="finance">Finance & Admin</option>
                    </select>
                </div>
                <div className="flex flex-col justify-end">
                    <button onClick={fetchReports} className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded text-sm border font-medium">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-gray-400">Loading reports...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 border border-dashed rounded-lg bg-gray-50">
                        No reports found for this date/department combination.
                    </div>
                ) : (
                    filteredReports.map(report => (
                        <div key={report.id} className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                            <div className={`px-4 py-3 font-semibold flex justify-between items-center ${report.department === 'assistant' ? 'bg-teal-600 text-white' :
                                report.department === 'lab' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                                }`}>
                                <span className="capitalize">{report.department} Report</span>
                                <span className="text-xs font-normal opacity-80">{new Date(report.report_date).toLocaleDateString()}</span>
                            </div>
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-center text-xs text-gray-400 mb-3 font-medium">
                                    <span>By: {report.submitted_by}</span>
                                    <span>{new Date(report.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {renderContent(report)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
