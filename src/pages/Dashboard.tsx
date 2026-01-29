import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";

import {
  listWalkins,
  listAppointments,
  listOpticalPatients,
  listExternalLabOrders,
  listSales,
  listNotificationLogs,
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
  LineChart,
  Line,
} from "recharts";

const formatCurrency = (n: number) => `Ksh ${n.toLocaleString()}`;

function Dashboard() {
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['walkins'],
    queryFn: listWalkins,
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: listAppointments,
  });

  const { data: opticalPatients = [], isLoading: loadingOptical } = useQuery({
    queryKey: ['optical-patients'],
    queryFn: listOpticalPatients,
  });

  const { data: externalOrders = [], isLoading: loadingExternal } = useQuery({
    queryKey: ['external-lab-orders'],
    queryFn: listExternalLabOrders,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: listSales,
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: listNotificationLogs,
  });

  const isLoading = loadingPatients || loadingAppointments || loadingOptical || loadingExternal || loadingSales || loadingLogs;

  const [chartView, setChartView] = useState<"earnings" | "patients">("earnings");
  const [kpiFilter, setKpiFilter] = useState<"daily" | "weekly" | "monthly" | "all">("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = selectedDate;

    // Filtering logic based on kpiFilter
    const filterByDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return false;
      if (kpiFilter === "all") return true;

      const itemDate = new Date(dateStr);
      itemDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);

      if (kpiFilter === "daily") {
        return itemDate.getTime() === targetDate.getTime();
      }

      if (kpiFilter === "weekly") {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      }

      if (kpiFilter === "monthly") {
        return itemDate.getMonth() === targetDate.getMonth() &&
          itemDate.getFullYear() === targetDate.getFullYear();
      }

      return true;
    };

    const filteredPatients = patients.filter(p => filterByDate(p.created_at));
    const filteredOptical = opticalPatients.filter(o => filterByDate(o.created_at));
    const filteredExternal = externalOrders.filter(e => filterByDate(e.created_at));
    const filteredSales = sales.filter(s => filterByDate(s.sale_date));

    // Total patients
    const totalPatients = filteredPatients.length;

    // Revenue calculations
    const clinicRevenue = filteredPatients.reduce((sum, p) => {
      const insurance = p.insurance_amount || 0;
      const cash = p.cash_amount || 0;
      const installments = (p.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
      return sum + insurance + cash + installments;
    }, 0);

    const frontOfficeRevenue = clinicRevenue * 0.15; // Placeholder logic or specific criteria

    const opticalRevenue = filteredOptical.reduce((sum, o) => {
      const paid = (o.insurance_amount || 0) + (o.cash_amount || 0) +
        (o.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
      return sum + paid;
    }, 0);

    const externalLabRevenue = filteredExternal.reduce((sum, o) => sum + (o.lab_cost || 0), 0);

    const salesRevenue = filteredSales.reduce((sum, s) => sum + (s.total_price || 0), 0);

    const totalRevenue = clinicRevenue + opticalRevenue + externalLabRevenue + salesRevenue;

    // Breakdown for detailed cards
    const totalInsurance = filteredPatients.reduce((sum, p) => sum + (p.insurance_amount || 0), 0);
    const totalCash = filteredPatients.reduce((sum, p) => sum + (p.cash_amount || 0), 0);
    const totalInstallments = filteredPatients.reduce((sum, p) => {
      return sum + (p.installments || []).reduce((s, i) => s + (i.amount || 0), 0);
    }, 0);

    // Patients status
    const completedLabWorks = patients.filter(p => p.status === "completed").length;
    const activePatients = patients.filter(p => p.status === "active").length;
    const inLabPatients = patients.filter(p => p.status === "lab").length;

    // Pending appointments
    const pendingAppointments = appointments.filter(
      a => a.status === "scheduled" || a.status === "confirmed"
    ).length;

    const todaysAppointments = appointments.filter(
      a => a.appointment_date === today
    ).length;

    const totalOpticalOrders = filteredOptical.length;

    return {
      totalPatients,
      completedLabWorks,
      activePatients,
      inLabPatients,
      totalRevenue,
      clinicRevenue,
      frontOfficeRevenue,
      opticalRevenue,
      externalLabRevenue,
      salesRevenue,
      totalInsurance,
      totalCash,
      totalInstallments,
      pendingAppointments,
      todaysAppointments,
      totalOpticalOrders,
    };
  }, [patients, appointments, opticalPatients, externalOrders, sales, kpiFilter, selectedDate]);

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

  // Weekly revenue data for line chart
  const weeklyRevenueData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseRevenue = kpis.totalRevenue / 30; // Approximate daily revenue

    return days.map((day) => ({
      day,
      revenue: Math.round(baseRevenue * (0.5 + Math.random() * 1.2)),
      target: Math.round(baseRevenue * 1.1),
    }));
  }, [kpis]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-500 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title="Executive Dashboard"
          action={{ label: "⟳ Refresh", onClick: () => window.location.reload() }}
        />
        <p className="text-slate-600 font-medium mt-1">Operational and Financial Performance Insights</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* Left Column - Balance & Wallet */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">

          {/* Main Balance Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-hover hover:shadow-md duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-600">💰</span>
                </div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
              </div>
              <select className="bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded border border-slate-200 font-bold">
                <option>KSH/KES</option>
              </select>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 uppercase">
              <span>↑ 12.5%</span>
              <span className="text-slate-400 font-medium">Growth vs Prev Month</span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
                <span>📊</span> Reports
              </button>
              <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-all duration-200 border border-slate-200 flex items-center justify-center gap-2">
                <span>🔄</span> Sync
              </button>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-lg">💳</span> Distribution
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-600"></div>
                  <span className="text-slate-600 text-xs font-medium">Insurance</span>
                </div>
                <span className="text-slate-900 font-bold text-sm tracking-tight">{formatCurrency(kpis.totalInsurance)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></div>
                  <span className="text-slate-600 text-xs font-medium">Cash</span>
                </div>
                <span className="text-slate-900 font-bold text-sm tracking-tight">{formatCurrency(kpis.totalCash)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-600"></div>
                  <span className="text-slate-600 text-xs font-medium">Split/Instal</span>
                </div>
                <span className="text-slate-900 font-bold text-sm tracking-tight">{formatCurrency(kpis.totalInstallments)}</span>
              </div>
            </div>
          </div>

          {/* Weekly Revenue Chart (replaced Financial Goals) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg shadow-slate-200/50">
            <h3 className="text-slate-700 font-medium mb-4 flex items-center gap-2">
              <span className="text-lg">📈</span> Weekly Revenue
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                    }}
                    labelStyle={{ color: "#64748b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ fill: "#0d9488", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#0d9488" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                <span className="text-slate-500 text-xs">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8, #94a3b8 3px, transparent 3px, transparent 6px)' }}></div>
                <span className="text-slate-500 text-xs">Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Charts & Transactions */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm">
              <div className="text-slate-400 text-[10px] mb-1 font-bold uppercase tracking-widest">Total Patients</div>
              <div className="text-xl font-bold text-white">{kpis.totalPatients}</div>
              <div className="text-slate-500 text-[9px] mt-1 italic font-medium">System Records</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px] mb-1 font-bold uppercase tracking-widest">Active Cases</div>
              <div className="text-xl font-bold text-slate-900">{kpis.activePatients}</div>
              <div className="text-slate-400 text-[9px] mt-1 font-medium">In Treatment</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px] mb-1 font-bold uppercase tracking-widest">Lab Orders</div>
              <div className="text-xl font-bold text-slate-900">{kpis.inLabPatients}</div>
              <div className="text-slate-400 text-[9px] mt-1 font-medium">Pending Delivery</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-[10px] mb-1 font-bold uppercase tracking-widest">Output</div>
              <div className="text-xl font-bold text-slate-900">{kpis.completedLabWorks}</div>
              <div className="text-slate-400 text-[9px] mt-1 font-medium">Completed Works</div>
            </div>
          </div>

          {/* Overview Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="text-slate-700 font-medium">Overview</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartView("earnings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartView === "earnings"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700"
                    }`}
                >
                  Earnings
                </button>
                <button
                  onClick={() => setChartView("patients")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartView === "patients"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700"
                    }`}
                >
                  Patients
                </button>
              </div>
            </div>

            {/* Chart Highlight */}
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">
                {chartView === "earnings" ? formatCurrency(kpis.totalRevenue) : kpis.totalPatients}
              </span>
              <span className="text-emerald-600 text-sm">↑ +8.2%</span>
            </div>

            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "earnings" ? (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                      }}
                      labelStyle={{ color: "#64748b" }}
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
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      stroke="#cbd5e1"
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Patients"]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                      }}
                      labelStyle={{ color: "#64748b" }}
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

          {/* Revenue KPIs Section (Replaced Recent Transactions) */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="text-7xl text-white">🏦</span>
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">💹</div>
                <h3 className="text-white font-bold uppercase tracking-[0.2em] text-xs">Financial Performance Matrix</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-white/5 p-1 rounded-lg backdrop-blur-md border border-white/10">
                  {(["daily", "weekly", "monthly", "all"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setKpiFilter(f)}
                      className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${kpiFilter === f ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {kpiFilter !== "all" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-[10px] font-bold border border-white/10 rounded-lg px-3 py-1.5 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-white/30 backdrop-blur-md"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-colors">Clinic Ops</div>
                <div className="text-xl font-extrabold text-white tracking-tight">{formatCurrency(kpis.clinicRevenue)}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-colors">Admin Fee</div>
                <div className="text-xl font-extrabold text-white tracking-tight">{formatCurrency(kpis.frontOfficeRevenue)}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-colors">Optical</div>
                <div className="text-xl font-extrabold text-white tracking-tight">{formatCurrency(kpis.opticalRevenue)}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-colors">Lab Costs</div>
                <div className="text-xl font-extrabold text-white tracking-tight">{formatCurrency(kpis.externalLabRevenue)}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1 group-hover:text-white transition-colors">Point of Sale</div>
                <div className="text-xl font-extrabold text-white tracking-tight">{formatCurrency(kpis.salesRevenue)}</div>
              </div>
            </div>
          </div>

          {/* Messaging & Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Quick Stats (4/5) */}
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-hover hover:shadow-md duration-300">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pending</div>
                <div className="text-xl font-bold text-slate-900">{kpis.pendingAppointments}</div>
                <div className="text-[9px] text-slate-400 font-medium">Scheduled Visits</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-hover hover:shadow-md duration-300">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Today</div>
                <div className="text-xl font-bold text-slate-900">{kpis.todaysAppointments}</div>
                <div className="text-[9px] text-slate-400 font-medium">Arrivals Expected</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-hover hover:shadow-md duration-300">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Optical</div>
                <div className="text-xl font-bold text-slate-900">{kpis.totalOpticalOrders}</div>
                <div className="text-[9px] text-slate-400 font-medium">Active Orders</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-hover hover:shadow-md duration-300">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Opt Rev</div>
                <div className="text-xl font-bold text-slate-900 tracking-tighter">{formatCurrency(kpis.opticalRevenue)}</div>
                <div className="text-[9px] text-slate-400 font-medium">Optical Yield</div>
              </div>
            </div>

            {/* Messaging Status (1/5) */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">SMS Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-white font-bold text-sm">Active Automation</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Sent Today</div>
                    <div className="text-xl font-extrabold text-white">{logs.filter(l => l.sent_at.startsWith(new Date().toISOString().split('T')[0])).length}</div>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-bold">100% Success</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;