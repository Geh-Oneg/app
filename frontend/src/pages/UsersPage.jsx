import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Users as UsersIcon } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("pending"); // pending | all

  const load = () => {
    const params = tab === "pending" ? { approved: false } : {};
    api.get("/users", { params }).then((r) => setUsers(r.data));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const approve = async (u, approved) => {
    await api.patch(`/users/${u.id}`, { approved });
    toast.success(approved ? "Usuário aprovado" : "Usuário rejeitado");
    load();
  };

  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Gestão de Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">Aprove novos motoristas e supervisores do sistema.</p>
        </div>

        <div className="flex gap-2">
          {[["pending", "Aguardando aprovação"], ["all", "Todos usuários"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} data-testid={`users-tab-${k}`}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                tab === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <Card className="p-0 border-slate-200 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <UsersIcon size={32} className="mx-auto mb-2 text-slate-400" />
              Nenhum usuário nesta categoria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{u.matricula} · {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.approved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {u.approved ? "Aprovado" : "Pendente"}
                    </span>
                    {!u.approved && (
                      <>
                        <Button size="sm" onClick={() => approve(u, true)}
                          data-testid={`approve-${u.matricula}`}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <Check size={14} /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => approve(u, false)}
                          className="text-red-700 border-red-200">
                          <X size={14} /> Rejeitar
                        </Button>
                      </>
                    )}
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
