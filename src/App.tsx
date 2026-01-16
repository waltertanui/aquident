import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./layout/Shell";
import { getSupabaseClient } from "./lib/supabaseClient";

// Lazy-load pages for production-grade code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FrontOffice = lazy(() => import("./pages/FrontOffice"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Laboratory = lazy(() => import("./pages/Laboratory/Laboratory"));
const InternalLabWorks = lazy(() => import("./pages/Laboratory/InternalLabWorks"));
const ExternalLabWorks = lazy(() => import("./pages/Laboratory/ExternalLabWorks"));
const Optical = lazy(() => import("./pages/Optical"));
const Inventory = lazy(() => import("./pages/Inventory"));
import HumanResources from "./pages/hr/HumanResources";
import AttendanceEmployees from "./pages/hr/AttendanceEmployees";
import LeaveManagement from "./pages/hr/LeaveManagement";
import Payroll from "./pages/hr/Payroll";
const SalesBilling = lazy(() => import("./pages/SalesBilling"));
const Sales = lazy(() => import("./pages/SalesBilling/Sales"));
const SalesInventory = lazy(() => import("./pages/SalesBilling/SalesInventory"));

// Add lazy import for Clinic page
const Clinic = lazy(() => import("./pages/Clinic"));

// Daily Reports
const Reports = lazy(() => import("./pages/Reports/Reports"));
const AssistantReport = lazy(() => import("./pages/Reports/AssistantReport"));
const LabReport = lazy(() => import("./pages/Reports/LabReport"));
const FinanceReport = lazy(() => import("./pages/Reports/FinanceReport"));
const ManagerDashboard = lazy(() => import("./pages/Reports/ManagerDashboard"));

function App() {
  // New: initialize Supabase on mount (optional)
  React.useEffect(() => {
    const sb = getSupabaseClient();
    sb.auth
      .getSession()
      .then(({ data }) => {
        console.log("Supabase session:", data.session);
      })
      .catch(console.error);
  }, []);

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/front-office" element={<FrontOffice />} />

          {/* New: route for Clinic to match Sidebar link */}
          <Route path="/clinic" element={<Clinic />} />

          <Route path="/appointments" element={<Appointments />} />
          <Route path="/laboratory" element={<Laboratory />} />
          <Route path="/laboratory/internal" element={<InternalLabWorks />} />
          <Route path="/laboratory/external" element={<ExternalLabWorks />} />
          <Route path="/optical" element={<Optical />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/hr" element={<HumanResources />} />
          <Route path="/hr/attendance-employees" element={<AttendanceEmployees />} />
          <Route path="/hr/leave-management" element={<LeaveManagement />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/sales-billing" element={<SalesBilling />} />
          <Route path="/sales-billing/sales" element={<Sales />} />
          <Route path="/sales-billing/inventory" element={<SalesInventory />} />

          {/* Daily Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/assistant" element={<AssistantReport />} />
          <Route path="/reports/lab" element={<LabReport />} />
          <Route path="/reports/finance" element={<FinanceReport />} />
          <Route path="/reports/manager" element={<ManagerDashboard />} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;