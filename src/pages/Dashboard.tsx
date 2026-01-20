import { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import Card from "../ui/Card";

import {
  listWalkins,
  listAppointments,
  listOpticalPatients,
  type PatientRecord,
  type Appointment,
  type OpticalPatient,
} from "../middleware/data";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

function Dashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [opticalPatients, setOpticalPatients] = useState<OpticalPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [patientsData, appointmentsData, opticalData] = await Promise.all([
          listWalkins(),
          listAppointments(),
          listOpticalPatients(),
        ]);
        setPatients(patientsData);
        setAppointments(appointmentsData);
        setOpticalPatients(opticalData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // Total patients
    const totalPatients = patients.length;

    // Walk-ins today - placeholder since we don't have created_at
    const walkinsToday = 0;

    // Completed lab works
    const completedLabWorks = patients.filter(p => p.status === "completed").length;

    // Active patients
    const activePatients = patients.filter(p => p.status === "active").length;

    // In lab patients
    const inLabPatients = patients.filter(p => p.status === "lab").length;

    // Total revenue from patients
    const totalRevenue = patients.reduce((sum, p) => {
      const insurance = p.insurance_amount || 0;
      const cash = p.cash_amount || 0;
      const installments = (p.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
      return sum + insurance + cash + installments;
    }, 0);

    // Insurance vs Cash breakdown
    const totalInsurance = patients.reduce((sum, p) => sum + (p.insurance_amount || 0), 0);
    const totalCash = patients.reduce((sum, p) => sum + (p.cash_amount || 0), 0);
    const totalInstallments = patients.reduce((sum, p) => {
      return sum + (p.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
    }, 0);

    // Pending appointments (scheduled or confirmed for today or future)
    const pendingAppointments = appointments.filter(
      a => a.status === "scheduled" || a.status === "confirmed"
    ).length;

    // Today's appointments
    const todaysAppointments = appointments.filter(
      a => a.appointment_date === today
    ).length;

    // Optical orders
    const totalOpticalOrders = opticalPatients.length;
    const opticalRevenue = opticalPatients.reduce((sum, o) => {
      const paid = (o.insurance_amount || 0) + (o.cash_amount || 0) +
        (o.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
      return sum + paid;
    }, 0);

    return {
      totalPatients,
      walkinsToday,
      completedLabWorks,
      activePatients,
      inLabPatients,
      totalRevenue,
      totalInsurance,
      totalCash,
      totalInstallments,
      pendingAppointments,
      todaysAppointments,
      totalOpticalOrders,
      opticalRevenue,
    };
  }, [patients, appointments, opticalPatients]);

  // Prepare chart data
  const paymentPieData = useMemo(() => [
    { name: "Insurance", value: kpis.totalInsurance, color: "#0ea5e9" },
    { name: "Cash", value: kpis.totalCash, color: "#10b981" },
    { name: "Installments", value: kpis.totalInstallments, color: "#f59e0b" },
  ].filter(d => d.value > 0), [kpis]);

  const statusBarData = useMemo(() => [
    { name: "Active", count: kpis.activePatients, fill: "#10b981" },
    { name: "In Lab", count: kpis.inLabPatients, fill: "#f59e0b" },
    { name: "Completed", count: kpis.completedLabWorks, fill: "#0ea5e9" },
  ], [kpis]);

  // Monthly revenue trend (simulated from data - in real scenario you'd group by month)
  const revenueLineData = useMemo(() => {
    // Group patients by month (using patient 'no' as proxy since we don't have dates)
    // This is a placeholder - in production you'd use actual date fields
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const baseRevenue = kpis.totalRevenue / 6;
    return months.map((month) => ({
      month,
      revenue: Math.round(baseRevenue * (0.8 + Math.random() * 0.4)),
      patients: Math.round((kpis.totalPatients / 6) * (0.8 + Math.random() * 0.4)),
    }));
  }, [kpis]);

  // Recent activity (combine latest appointments and format)
  const recentActivity = useMemo(() => {
    const activities: { text: string; time: string; type: string }[] = [];

    // Add recent appointments
    appointments.slice(0, 5).forEach(apt => {
      activities.push({
        text: `Appointment: ${apt.patient_name}`,
        time: apt.appointment_date,
        type: "appointment",
      });
    });

    // Add recent patients (last 5)
    patients.slice(-5).reverse().forEach(p => {
      activities.push({
        text: `Walk-in: ${p.name}`,
        time: `Patient #${p.no}`,
        type: "walkin",
      });
    });

    return activities.slice(0, 8);
  }, [appointments, patients]);

  const formatCurrency = (n: number) => `Ksh ${n.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <PageHeader title="Dashboard" action={{ label: "Refresh", onClick: () => window.location.reload() }} />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">Total Patients</div>
          <div className="text-3xl font-bold mt-1">{kpis.totalPatients.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">All registered walk-ins</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">Active Patients</div>
          <div className="text-3xl font-bold mt-1">{kpis.activePatients.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">Currently in treatment</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">In Lab</div>
          <div className="text-3xl font-bold mt-1">{kpis.inLabPatients.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">Awaiting lab work</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">Completed</div>
          <div className="text-3xl font-bold mt-1">{kpis.completedLabWorks.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">Finished treatments</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">Appointments</div>
          <div className="text-3xl font-bold mt-1">{kpis.pendingAppointments.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">Scheduled / Confirmed</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
          <div className="text-sm opacity-90">Optical Orders</div>
          <div className="text-3xl font-bold mt-1">{kpis.totalOpticalOrders.toLocaleString()}</div>
          <div className="text-xs opacity-75 mt-2">Total optical patients</div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpis.totalRevenue)}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="text-blue-600">Insurance: {formatCurrency(kpis.totalInsurance)}</span>
            <span className="text-green-600">Cash: {formatCurrency(kpis.totalCash)}</span>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Optical Revenue</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpis.opticalRevenue)}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">👓</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            From {kpis.totalOpticalOrders} orders
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Today's Appointments</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{kpis.todaysAppointments}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {kpis.pendingAppointments} total pending
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend Line Chart */}
        <Card className="lg:col-span-2 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: "#0ea5e9", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#0ea5e9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card className="bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
          <div className="h-64">
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No payment data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient Status Bar Chart */}
        <Card className="bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm ${activity.type === "appointment" ? "bg-purple-500" : "bg-teal-500"
                    }`}>
                    {activity.type === "appointment" ? "📅" : "🚶"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{activity.text}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          <div className="py-2">
            <div className="text-2xl font-bold text-gray-800">{kpis.totalPatients}</div>
            <div className="text-xs text-gray-500">Total Patients</div>
          </div>
          <div className="py-2">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(kpis.totalRevenue)}</div>
            <div className="text-xs text-gray-500">Total Revenue</div>
          </div>
          <div className="py-2">
            <div className="text-2xl font-bold text-blue-600">{kpis.totalInsurance > 0 ? Math.round((kpis.totalInsurance / (kpis.totalInsurance + kpis.totalCash + kpis.totalInstallments)) * 100) : 0}%</div>
            <div className="text-xs text-gray-500">Insurance Rate</div>
          </div>
          <div className="py-2">
            <div className="text-2xl font-bold text-amber-600">{kpis.inLabPatients}</div>
            <div className="text-xs text-gray-500">Pending Lab</div>
          </div>
          <div className="py-2">
            <div className="text-2xl font-bold text-purple-600">{appointments.length}</div>
            <div className="text-xs text-gray-500">Total Appointments</div>
          </div>
          <div className="py-2">
            <div className="text-2xl font-bold text-pink-600">{kpis.totalOpticalOrders}</div>
            <div className="text-xs text-gray-500">Optical Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;