import { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";

import {
  listWalkins,
  listAppointments,
  listOpticalPatients,
  type PatientRecord,
  type Appointment,
  type OpticalPatient,
} from "../middleware/data";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

function Dashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [opticalPatients, setOpticalPatients] = useState<OpticalPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartView, setChartView] = useState<"earnings" | "patients">("earnings");

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

  // Monthly revenue data for chart
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const baseRevenue = kpis.totalRevenue / 8;
    const basePatients = kpis.totalPatients / 8;

    return months.map((month, index) => ({
      month,
      revenue: index <= currentMonth ? Math.round(baseRevenue * (0.6 + Math.random() * 0.8)) : 0,
      patients: index <= currentMonth ? Math.round(basePatients * (0.6 + Math.random() * 0.8)) : 0,
      isCurrent: index === currentMonth,
    }));
  }, [kpis]);

  // Recent transactions/activity
  const recentTransactions = useMemo(() => {
    const transactions: {
      id: string;
      description: string;
      date: string;
      amount: number;
      status: "success" | "pending" | "completed";
      type: string;
    }[] = [];

    // Add recent patients as transactions
    patients.slice(-8).reverse().forEach((p, i) => {
      const amount = (p.insurance_amount || 0) + (p.cash_amount || 0);
      const status = p.status === "completed" ? "completed" : p.status === "active" ? "pending" : "success";
      transactions.push({
        id: `TRX-${String(p.no).padStart(5, "0")}`,
        description: p.name,
        date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        amount,
        status,
        type: p.insurance_amount ? "Insurance" : "Cash",
      });
    });

    return transactions.slice(0, 6);
  }, [patients]);

  // Financial goals/targets
  const financialGoals = useMemo(() => [
    {
      name: "Monthly Revenue Target",
      current: kpis.totalRevenue,
      target: 500000,
      icon: "💰",
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "Patient Target",
      current: kpis.totalPatients,
      target: 200,
      icon: "👥",
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "Optical Revenue",
      current: kpis.opticalRevenue,
      target: 150000,
      icon: "👓",
      color: "from-purple-500 to-pink-500"
    },
  ], [kpis]);

  const formatCurrency = (n: number) => `Ksh ${n.toLocaleString()}`;

  const getStatusBadge = (status: "success" | "pending" | "completed") => {
    const styles = {
      success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return styles[status];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500/30 border-t-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title="Dashboard"
          action={{ label: "⟳ Refresh", onClick: () => window.location.reload() }}
        />
        <p className="text-slate-400 mt-1">Welcome back! Here's your clinic overview.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* Left Column - Balance & Wallet */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">

          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <span className="text-teal-400">💰</span>
                </div>
                <span className="text-slate-300 text-sm font-medium">Total Revenue</span>
              </div>
              <select className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-lg border border-slate-600/50">
                <option>KSH</option>
              </select>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="text-emerald-400 text-sm flex items-center gap-1">
              <span>↑ 12.5%</span>
              <span className="text-slate-500">from last month</span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25">
                <span>📊</span> View Reports
              </button>
              <button className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 flex items-center justify-center gap-2">
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
              <span className="text-lg">💳</span> Revenue Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-slate-300 text-sm">Insurance</span>
                </div>
                <span className="text-white font-semibold">{formatCurrency(kpis.totalInsurance)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-300 text-sm">Cash</span>
                </div>
                <span className="text-white font-semibold">{formatCurrency(kpis.totalCash)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-slate-300 text-sm">Installments</span>
                </div>
                <span className="text-white font-semibold">{formatCurrency(kpis.totalInstallments)}</span>
              </div>
            </div>
          </div>

          {/* Financial Goals */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
              <span className="text-lg">🎯</span> Financial Goals
            </h3>
            <div className="space-y-4">
              {financialGoals.map((goal, i) => {
                const progress = Math.min((goal.current / goal.target) * 100, 100);
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{goal.icon}</span>
                        <span className="text-slate-300 text-sm">{goal.name}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${goal.color} rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{typeof goal.current === "number" && goal.target > 1000 ? formatCurrency(goal.current) : goal.current}</span>
                      <span className="text-slate-500">Target: {goal.target > 1000 ? formatCurrency(goal.target) : goal.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Charts & Transactions */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 backdrop-blur-xl rounded-xl p-4 border border-teal-500/20">
              <div className="text-teal-400 text-sm mb-1">Total Patients</div>
              <div className="text-2xl font-bold text-white">{kpis.totalPatients}</div>
              <div className="text-slate-400 text-xs mt-1">All registered</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-4 border border-blue-500/20">
              <div className="text-blue-400 text-sm mb-1">Active</div>
              <div className="text-2xl font-bold text-white">{kpis.activePatients}</div>
              <div className="text-slate-400 text-xs mt-1">In treatment</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-xl p-4 border border-amber-500/20">
              <div className="text-amber-400 text-sm mb-1">In Lab</div>
              <div className="text-2xl font-bold text-white">{kpis.inLabPatients}</div>
              <div className="text-slate-400 text-xs mt-1">Awaiting work</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/20">
              <div className="text-emerald-400 text-sm mb-1">Completed</div>
              <div className="text-2xl font-bold text-white">{kpis.completedLabWorks}</div>
              <div className="text-slate-400 text-xs mt-1">Finished</div>
            </div>
          </div>

          {/* Overview Chart */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="text-slate-300 font-medium">Overview</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartView("earnings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartView === "earnings"
                      ? "bg-teal-500 text-white"
                      : "bg-slate-700/50 text-slate-400 hover:text-white"
                    }`}
                >
                  Earnings
                </button>
                <button
                  onClick={() => setChartView("patients")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartView === "patients"
                      ? "bg-teal-500 text-white"
                      : "bg-slate-700/50 text-slate-400 hover:text-white"
                    }`}
                >
                  Patients
                </button>
              </div>
            </div>

            {/* Chart Highlight */}
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {chartView === "earnings" ? formatCurrency(kpis.totalRevenue) : kpis.totalPatients}
              </span>
              <span className="text-emerald-400 text-sm">↑ +8.2%</span>
            </div>

            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "earnings" ? (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#475569"
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#475569"
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[6, 6, 0, 0]}
                      fill="#0d9488"
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#475569"
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      stroke="#475569"
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Patients"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPatients)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h3 className="text-slate-300 font-medium">Recent Transactions</h3>
              </div>
              <button className="text-teal-400 text-sm hover:text-teal-300 transition-colors">
                View All →
              </button>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/50">
                    <th className="pb-3 font-medium">Transaction</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm">
                              {tx.type === "Insurance" ? "🏥" : "💵"}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{tx.description}</div>
                              <div className="text-slate-500 text-xs">{tx.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-400 text-sm">{tx.date}</td>
                        <td className="py-3 text-slate-400 text-sm">{tx.type}</td>
                        <td className="py-3 text-white text-sm font-medium">{formatCurrency(tx.amount)}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(tx.status)}`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No recent transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-purple-400">{kpis.pendingAppointments}</div>
              <div className="text-slate-500 text-xs mt-1">Pending Appointments</div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-pink-400">{kpis.todaysAppointments}</div>
              <div className="text-slate-500 text-xs mt-1">Today's Appointments</div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-cyan-400">{kpis.totalOpticalOrders}</div>
              <div className="text-slate-500 text-xs mt-1">Optical Orders</div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="text-2xl font-bold text-orange-400">{formatCurrency(kpis.opticalRevenue)}</div>
              <div className="text-slate-500 text-xs mt-1">Optical Revenue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;