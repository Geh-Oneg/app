import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Clock, CheckCircle2, Printer } from "lucide-react";
import { formatDateTime } from "@/lib/api";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/service-orders"), api.get("/stats")])
      .then(([o, s]) => { setOrders(o.data); setStats(s.data); })
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: "Minhas OSs", value: stats?.total ?? 0, icon: Wrench, color: "text-slate-900" },
    { label: "Pendentes", value: stats?.by_status?.["Pendente"] ?? 0, icon: Clock, color: "text-amber-700" },
    { label: "Em Manutenção", value: stats?.by_status?.["Em Manutenção"] ?? 0, icon: Wrench, color: "text-orange-700" },
    { label: "Concluídas", value: stats?.by_status?.["Concluída"] ?? 0, icon: CheckCircle2, color: "text-green-700" },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">Olá, motorista</div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{user?.name}</h1>
            <div className="text-slate-500 text-sm mt-1 font-mono">Matrícula: {user?.matricula}</div>
          </div>
          <Link to="/driver/new" data-testid="create-os-button">
            <Button className="h-14 px-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-base shadow-md shadow-amber-500/20">
              <Plus size={20} strokeWidth={2.5} /> Criar Nova Solicitação de Manutenção
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <Card key={m.label} className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase tracking-wide">{m.label}</div>
                <m.icon size={16} className={m.color} />
              </div>
              <div className="font-display text-3xl font-extrabold mt-2">{m.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Histórico de solicitações</h2>
            <span className="text-xs text-slate-500">{orders.length} registro(s)</span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-slate-500 mb-4">Nenhuma solicitação registrada ainda.</div>
              <Link to="/driver/new">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  <Plus size={16} /> Criar primeira solicitação
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200" data-testid="driver-os-list">
              {orders.map((o) => (
                <div key={o.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="plate-chip">{o.vehicle_plate}</span>
                      <div>
                        <div className="font-mono text-xs text-slate-500">{o.os_number}</div>
                        <div className="text-sm font-semibold">{o.vehicle_model}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{formatDateTime(o.created_at)}</div>
                        <div className="font-mono text-xs text-slate-500">KM {o.km.toLocaleString("pt-BR")}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 line-clamp-2">{o.description}</p>
                  {o.supervisor_notes && (
                    <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded p-2">
                      <span className="font-semibold text-slate-700">Observação do supervisor: </span>
                      <span className="text-slate-600">{o.supervisor_notes}</span>
                    </div>
                  )}
                  <div className="mt-2">
                    <Link to={`/os/${o.id}/print`} className="text-xs text-amber-700 font-semibold hover:underline inline-flex items-center gap-1">
                      <Printer size={12} /> Visualizar / Imprimir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
