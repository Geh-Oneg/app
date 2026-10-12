import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bus, LogOut, LayoutDashboard, Users, Truck, Wrench, UserCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const navItems = user?.role === "supervisor"
    ? [
        { to: "/admin", icon: LayoutDashboard, label: "Painel" },
        { to: "/admin/vehicles", icon: Truck, label: "Veículos" },
        { to: "/admin/users", icon: Users, label: "Usuários" },
        { to: "/admin/resets", icon: KeyRound, label: "Senhas" },
      ]
    : [
        { to: "/driver", icon: Wrench, label: "Minhas OSs" },
      ];

  const handleLogout = () => { logout(); nav("/login"); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to={user?.role === "supervisor" ? "/admin" : "/driver"} className="flex items-center gap-3" data-testid="brand-link">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center">
              <Bus size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-none">Frota Escolar</div>
              <div className="text-xs text-slate-400">Gestão de OS de Manutenção</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {navItems.map((item) => {
                const active = loc.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      active ? "bg-amber-500 text-slate-900" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <item.icon size={16} /> {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium" data-testid="user-name">{user?.name}</div>
              <div className="text-xs text-slate-400">
                {user?.matricula} · {user?.role === "supervisor" ? "Supervisor" : "Motorista"}
              </div>
            </div>
            <Link to="/profile" data-testid="profile-link">
              <Button variant="outline" size="sm"
                className="bg-transparent border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-amber-400">
                <UserCircle size={16} /> <span className="hidden sm:inline">Perfil</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="logout-btn"
              className="bg-transparent border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-amber-400"
            >
              <LogOut size={16} /> Sair
            </Button>
          </div>
        </div>
        <nav className="sm:hidden border-t border-slate-800 px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                  active ? "bg-amber-500 text-slate-900" : "text-slate-300 bg-slate-800"
                }`}
              >
                <item.icon size={14} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
