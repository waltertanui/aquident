import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const linkClass =
  // changed: make base text light and hover a darker slate
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800";
const activeClass = 
  // changed: active state on dark sidebar
  "bg-slate-800 text-white";

function Sidebar() {
  const [labOpen, setLabOpen] = useState(true);

  // New: collapsible state for Human Resources
  const [hrOpen, setHrOpen] = useState(true);

  return (
    // changed: dark sidebar background + light text + darker border
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-8 w-8 rounded-md bg-teal-600" />
        {/* changed: ensure brand text is white on dark bg */}
        <div className="font-semibold text-white">AquiDent</div>
      </div>

      <nav className="space-y-1 px-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/front-office"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Front Office</span>
        </NavLink>

        <NavLink
          to="/appointments"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Appointments</span>
        </NavLink>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setLabOpen((v) => !v)}
            className={`${linkClass} w-full justify-between`}
          >
            <span>Laboratory</span>
            {/* changed: lighter arrow on dark bg */}
            <span className="text-xs text-slate-400">{labOpen ? "▾" : "▸"}</span>
          </button>
          {labOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink
                to="/laboratory/internal"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                <span>Internal Lab Works</span>
              </NavLink>
              <NavLink
                to="/laboratory/external"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                <span>External Lab Works</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/optical"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Optical</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Inventory</span>
        </NavLink>

        {/* Replace the standalone "Human Resources" NavLink with this collapsible group */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setHrOpen((v) => !v)}
            className={`${linkClass} w-full justify-between`}
          >
            <span>Human Resources</span>
            <span className="text-xs text-slate-400">{hrOpen ? "▾" : "▸"}</span>
          </button>
          {hrOpen && (
            <div className="mt-1 space-y-1 pl-4">
              <NavLink
                to="/hr/attendance-employees"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                <span>Attendance & Employee Data</span>
              </NavLink>
              <NavLink
                to="/hr/leave-management"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                <span>Leave Management</span>
              </NavLink>
              <NavLink
                to="/hr/payroll"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                <span>Payroll</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/sales-billing"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : ""}`
          }
        >
          <span>Sales & Billing</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;