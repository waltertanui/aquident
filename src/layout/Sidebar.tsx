import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/aquadent_logo.png";
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  Calendar,
  FlaskConical,
  Glasses,
  Package,
  Users,
  BadgeDollarSign,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  ChevronLeft
} from "lucide-react";

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
      className={`border-r border-slate-200 bg-slate-900 text-white overflow-y-auto h-screen sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-64'}`}
      style={{ width: isCollapsed ? '80px' : '16rem' }}
    >
      <div className={`flex items-center gap-2 px-4 py-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Aquadent" className="h-10 w-10 object-contain rounded-full" />
          {!isCollapsed && <div className="font-semibold text-white truncate">Aquadent</div>}
        </div>
        {!isCollapsed && (
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed (centered) */}
      {isCollapsed && (
        <div className="flex justify-center mb-4">
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      <nav className="space-y-1 px-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Dashboard" : ""}>
          <LayoutDashboard className="w-5 h-5" />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/front-office" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Front Office" : ""}>
          <Building2 className="w-5 h-5" />
          {!isCollapsed && <span>Front Office</span>}
        </NavLink>

        <NavLink to="/clinic" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Clinic" : ""}>
          <Stethoscope className="w-5 h-5" />
          {!isCollapsed && <span>Clinic</span>}
        </NavLink>

        <NavLink to="/appointments" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Appointments" : ""}>
          <Calendar className="w-5 h-5" />
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
              <FlaskConical className="w-5 h-5" />
              {!isCollapsed && <span>Laboratory</span>}
            </div>
            {!isCollapsed && (labOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
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
          <Glasses className="w-5 h-5" />
          {!isCollapsed && <span>Optical</span>}
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ""} ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? "Inventory" : ""}>
          <Package className="w-5 h-5" />
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
              <Users className="w-5 h-5" />
              {!isCollapsed && <span>Human Resources</span>}
            </div>
            {!isCollapsed && (hrOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
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
              <BadgeDollarSign className="w-5 h-5" />
              {!isCollapsed && <span>Sales & Billing</span>}
            </div>
            {!isCollapsed && (salesOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
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
              <BarChart3 className="w-5 h-5" />
              {!isCollapsed && <span>Daily Reports</span>}
            </div>
            {!isCollapsed && (reportsOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
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