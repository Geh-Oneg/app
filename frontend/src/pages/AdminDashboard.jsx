import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError, formatDateTime, STATUS_OPTIONS } from "@/lib/api";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Printer, Wrench, Clock, CheckCircle2, AlertCircle, Edit3, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "all", plate: "", driver: "", date_from: "", date_to: "" });
  const [editing, setEditing] = useState(null); // os object
  const [deleting, setDeleting] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  const confirmDelete = async () => {
  if (!deleting || !deletePassword || deletingLoading) return;

  setDeletingLoading(true);

  try {
    await api.delete(`/service-orders/${deleting.id}`, {
      data: { password: deletePassword },
    });

    toast.success("Ordem de serviço excluída com sucesso!");

    setDeleting(null);
    setDeletePassword("");

    setOrders((current) =>
      current.filter((o) => o.id !== deleting.id)
    );

    setStats((current) =>
      current
        ? {
            ...current,
            total: Math.max(0, current.total - 1),
            by_status: {
              ...current.by_status,
              [deleting.status]: Math.max(
                0,
                (current.by_status?.[deleting.status] || 0) - 1
              ),
            },
          }
        : current
    );
  } catch (error) {
    toast.error(formatApiError(error));
  } finally {
    setDeletingLoading(false);
  }
};
  
  const [editForm, setEditForm] = useState({ status: "Pendente", supervisor_notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.plate) params.plate = filters.plate;
    if (filters.driver) params.driver = filters.driver;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    try {
      const [o, s] = await Promise.all([api.get("/service-orders", { params }), api.get("/stats")]);
      setOrders(o.data);
      setStats(s.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (os) => {
    setEditing(os);
    setEditForm({ status: os.status, supervisor_notes: os.supervisor_notes || "" });
  };

  const saveEdit = async () => {
    try {
      await api.patch(`/service-orders/${editing.id}`, editForm);
      toast.success("OS atualizada");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const metrics = [
    { label: "Total de OSs", value: stats?.total ?? 0, icon: Wrench, color: "bg-slate-900 text-amber-400" },
    { label: "Pendentes", value: stats?.by_status?.["Pendente"] ?? 0, icon: Clock, color: "bg-amber-50 text-amber-700" },
    { label: "Em Manutenção", value: stats?.by_status?.["Em Manutenção"] ?? 0, icon: Wrench, color: "bg-orange-50 text-orange-700" },
    { label: "Concluídas", value: stats?.by_status?.["Concluída"] ?? 0, icon: CheckCircle2, color: "bg-green-50 text-green-700" },
  ];

  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">Painel do supervisor</div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Ordens de Serviço</h1>
          </div>
          {stats?.pending_users > 0 && (
            <Link to="/admin/users">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2 rounded-md text-sm font-semibold" data-testid="pending-users-alert">
                <AlertCircle size={16} /> {stats.pending_users} usuário(s) aguardando aprovação
              </div>
            </Link>
          )}
          {stats?.pending_resets > 0 && (
            <Link to="/admin/resets">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-300 text-orange-800 px-4 py-2 rounded-md text-sm font-semibold" data-testid="pending-resets-alert">
                <AlertCircle size={16} /> {stats.pending_resets} pedido(s) de recuperação de senha
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <Card key={m.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{m.label}</div>
                  <div className="font-display text-3xl font-extrabold mt-2">{m.value}</div>
                </div>
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${m.color}`}>
                  <m.icon size={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Buscar OS, placa, descrição..." data-testid="filter-search"
                className="pl-9 h-11" value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
              <SelectTrigger className="h-11" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Placa" data-testid="filter-plate" className="h-11 font-mono uppercase"
              value={filters.plate} onChange={(e) => setFilters((f) => ({ ...f, plate: e.target.value }))} />
            <Input placeholder="Motorista" data-testid="filter-driver" className="h-11"
              value={filters.driver} onChange={(e) => setFilters((f) => ({ ...f, driver: e.target.value }))} />
           
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 w-full">
  <Input
    type="date"
    className="h-11 w-full min-w-0"
    value={filters.date_from}
    onChange={(e) =>
      setFilters((f) => ({ ...f, date_from: e.target.value }))
    }
  />
  <Input
    type="date"
    className="h-11 w-full min-w-0"
    value={filters.date_to}
    onChange={(e) =>
      setFilters((f) => ({ ...f, date_to: e.target.value }))
    }
  />
</div>

          </div>
        </Card>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display font-bold">Todas as Ordens de Serviço</h2>
            <span className="text-xs text-slate-500">{orders.length} registro(s)</span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Nenhuma OS encontrada.</div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm" data-testid="admin-os-table">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="text-left px-5 py-3">OS</th>
                      <th className="text-left px-5 py-3">Data/Hora</th>
                      <th className="text-left px-5 py-3">Motorista</th>
                      <th className="text-left px-5 py-3">Veículo</th>
                      <th className="text-left px-5 py-3">KM</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs font-bold">{o.os_number}</td>
                        <td className="px-5 py-3 text-slate-700">{formatDateTime(o.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium">{o.driver_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{o.driver_matricula}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="plate-chip">{o.vehicle_plate}</span>
                          <div className="text-xs text-slate-500 mt-1">{o.vehicle_model}</div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{o.km.toLocaleString("pt-BR")}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <Button size="sm" variant="outline" onClick={() => openEdit(o)}
                            data-testid={`edit-os-${o.os_number}`} className="mr-2">
                            <Edit3 size={14} /> Atualizar
                          </Button>
                          <Link to={`/os/${o.id}/print`}>
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white"
                              data-testid={`print-os-${o.os_number}`}>
                              <Printer size={14} /> PDF
                            </Button>
                          </Link>

                          <Button
  size="sm"
  variant="outline"
  className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
  onClick={() => {
    setDeleting(o);
    setDeletePassword("");
  }}
>
  <Trash2 size={14} /> Excluir
</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden divide-y divide-slate-200">
                {orders.map((o) => (
                  <div key={o.id} className="p-4">
                    <div className="flex justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-mono text-xs text-slate-500">{o.os_number}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="plate-chip">{o.vehicle_plate}</span>
                          <span className="text-sm font-semibold">{o.vehicle_model}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{o.driver_name} · KM {o.km.toLocaleString("pt-BR")}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(o.created_at)}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700 line-clamp-2">{o.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(o)}>
                        <Edit3 size={14} /> Atualizar
                      </Button>
                      <Link to={`/os/${o.id}/print`} className="flex-1">
                        <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                          <Printer size={14} /> PDF
                        </Button>
                      </Link>

                      <Button
  size="sm"
  variant="outline"
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
  onClick={() => {
    setDeleting(o);
    setDeletePassword("");
  }}
>
  <Trash2 size={14} />
</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm">
                <div className="font-mono font-bold">{editing.os_number}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {editing.vehicle_plate} · {editing.driver_name}
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-11 mt-1.5" data-testid="edit-status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações do supervisor</Label>
                <Textarea className="mt-1.5 min-h-[100px]" data-testid="edit-notes-input"
                  placeholder="Parecer técnico, peças trocadas, previsão..."
                  value={editForm.supervisor_notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, supervisor_notes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} data-testid="save-edit-btn"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !deletingLoading) {
            setDeleting(null);
            setDeletePassword("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Ordem de Serviço</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Tem certeza que deseja excluir a OS{" "}
              <strong>{deleting?.os_number}</strong>?
            </p>

            <p className="text-sm text-red-600">
              Atenção: esta exclusão é definitiva.
            </p>

            <div>
              <Label>Senha do supervisor</Label>
              <Input
                type="password"
                className="mt-1.5"
                placeholder="Digite sua senha"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={deletingLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletingLoading}
              onClick={() => {
                setDeleting(null);
                setDeletePassword("");
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              disabled={!deletePassword || deletingLoading}
              onClick={confirmDelete}
            >
              {deletingLoading ? "Excluindo..." : "Excluir OS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
