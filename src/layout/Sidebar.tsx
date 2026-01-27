import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/aquadent_logo.png";

const linkClass = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-all duration-200";
const activeClass = "bg-slate-800 text-white";

function Sidebar() {
  const [labOpen, setLabOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);

  // New: Collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleGroupClick = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentState: boolean) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setter(true);
    } else {
      setter(!currentState);
    }
  };

  return (
    <aside
      className={`border-r border-slate-800 bg-slate-900 text-white overflow-y-auto h-screen sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-64'}`}
      style={{ width: isCollapsed ? '80px' : '16rem' }}
    >
      <div className={`flex items-center gap-2 px-4 py-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Aquadent" className="h-10 w-10 object-contain rounded-full" />
          {!isCollapsed && <div className="font-semibold text-white truncate">Aquadent</div>}
        </div>
        {!isCollapsed && (
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition-colors">
            {/* Simple toggle icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Toggle button when collapsed (centered) */}
      {isCollapsed && (
        <div className="flex justify-center mb-4">
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      <nav className="space-y-1 px-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Dashboard" : ""}>
          <span className="text-lg">🏠</span>
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/front-office" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Front Office" : ""}>
          <span className="text-lg">🏢</span>
          {!isCollapsed && <span>Front Office</span>}
        </NavLink>

        <NavLink to="/clinic" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Clinic" : ""}>
          <span className="text-lg">⚕️</span>
          {!isCollapsed && <span>Clinic</span>}
        </NavLink>

        <NavLink to="/appointments" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Appointments" : ""}>
          <span className="text-lg">📅</span>
          {!isCollapsed && <span>Appointments</span>}
        </NavLink>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => handleGroupClick(setLabOpen, labOpen)}
            className={`${linkClass} w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title={isCollapsed ? "Laboratory" : ""}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <span className="text-lg">🧪</span>
              {!isCollapsed && <span>Laboratory</span>}
            </div>
            {!isCollapsed && <span className="text-xs text-slate-400">{labOpen ? "▾" : "▸"}</span>}
          </button>
          {!isCollapsed && labOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink to="/laboratory/internal" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""}`}>
                <span>Internal Lab Works</span>
              </NavLink>
              <NavLink to="/laboratory/external" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""}`}>
                <span>External Lab Works</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/optical" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Optical" : ""}>
          <span className="text-lg">👓</span>
          {!isCollapsed && <span>Optical</span>}
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Inventory" : ""}>
          <span className="text-lg">📦</span>
          {!isCollapsed && <span>Inventory</span>}
        </NavLink>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => handleGroupClick(setHrOpen, hrOpen)}
            className={`${linkClass} w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title={isCollapsed ? "Human Resources" : ""}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <span className="text-lg">👥</span>
              {!isCollapsed && <span>Human Resources</span>}
            </div>
            {!isCollapsed && <span className="text-xs text-slate-400">{hrOpen ? "▾" : "▸"}</span>}
          </button>
          {!isCollapsed && hrOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink to="/hr/attendance-employees" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""}`}>
                <span>Attendance & Employee Data</span>
              </NavLink>
              <NavLink to="/hr/leave-management" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""}`}>
                <span>Leave Management</span>
              </NavLink>
              <NavLink to="/hr/payroll" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""}`}>
                <span>Payroll</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => handleGroupClick(setSalesOpen, salesOpen)}
            className={`${linkClass} w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title={isCollapsed ? "Sales & Billing" : ""}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <span className="text-lg">💰</span>
              {!isCollapsed && <span>Sales & Billing</span>}
            </div>
            {!isCollapsed && <span className="text-xs text-slate-400">{salesOpen ? "▾" : "▸"}</span>}
          </button>
          {!isCollapsed && salesOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink to="/sales-billing/sales" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                <span>Sales Records</span>
              </NavLink>
              <NavLink to="/sales-billing/inventory" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                <span>Sales Inventory</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => handleGroupClick(setReportsOpen, reportsOpen)}
            className={`${linkClass} w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            title={isCollapsed ? "Daily Reports" : ""}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <span className="text-lg">📊</span>
              {!isCollapsed && <span>Daily Reports</span>}
            </div>
            {!isCollapsed && <span className="text-xs text-slate-400">{reportsOpen ? "▾" : "▸"}</span>}
          </button>
          {!isCollapsed && reportsOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink to="/reports/assistant" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                Assistant Report
              </NavLink>
              <NavLink to="/reports/lab" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                Lab Report
              </NavLink>
              <NavLink to="/reports/finance" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                Finance Report
              </NavLink>
              <NavLink to="/reports/manager" className={({ isActive }) => `${linkClass} py-1 text-xs ${isActive ? activeClass : ""}`}>
                Manager Dashboard
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;