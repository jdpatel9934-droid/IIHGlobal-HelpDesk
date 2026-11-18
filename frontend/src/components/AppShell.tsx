import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              HD
            </span>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              HelpDesk Lite
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"}`
              }
            >
              Tickets
            </NavLink>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-800">
                {user?.email}
              </p>
              <p className="text-[11px] capitalize text-slate-500">
                {user?.role}
              </p>
            </div>
            <button className="button-secondary !px-3 !py-2" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
