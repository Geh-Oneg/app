
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Users as UsersIcon, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("pending");
  const [userToDelete, setUserToDelete] = useState(null);
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const params = tab === "pending" ? { approved: false } : {};
      const response = await api.get("/users", { params });
      setUsers(response.data);
    } catch {
      toast.error("Erro ao carregar usuários");
    }
  };

  useEffect(() => {
    const params = tab === "pending" ? { approved: false } : {};
    api.get("/users", { params })
      .then((r) => setUsers(r.data))
      .catch(() => toast.error("Erro ao carregar usuários"));
  }, [tab]);

  const approve = async (u, approved) => {
    try {
      await api.patch(`/users/${u.id}`, { approved });
      toast.success(approved ? "Usuário aprovado" : "Usuário rejeitado");
      load();
    } catch {
      toast.error("Não foi possível atualizar o usuário");
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setUserToDelete(null);
    setSupervisorPassword("");
  };

  const deleteUser = async (event) => {
    event.preventDefault();
    if (!userToDelete || !supervisorPassword || deleting) return;

    setDeleting(true);

    try {
      await api.delete(`/users/${userToDelete.id}`, {
        data: { password: supervisorPassword }
      });

      toast.success("Usuário excluído com sucesso");
      setUserToDelete(null);
      setSupervisorPassword("");
      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Não foi possível excluir o usuário"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold">
            Gestão de Usuários
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aprove novos motoristas e supervisores do sistema.
          </p>
        </div>

        <div className="flex gap-2">
          {[
            ["pending", "Aguardando aprovação"],
            ["all", "Todos usuários"]
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              data-testid={`users-tab-${k}`}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                tab === k
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Card className="p-0 border-slate-200 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <UsersIcon
                size={32}
                className="mx-auto mb-2 text-slate-400"
              />
              Nenhum usuário nesta categoria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {u.matricula} · {u.role}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.approved
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {u.approved ? "Aprovado" : "Pendente"}
                    </span>

                    {!u.approved && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approve(u, true)}
                          data-testid={`approve-${u.matricula}`}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check size={14} /> Aprovar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approve(u, false)}
                          className="text-red-700 border-red-200"
                        >
                          <X size={14} /> Rejeitar
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUserToDelete(u);
                        setSupervisorPassword("");
                      }}
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      title={`Excluir ${u.name}`}
                      aria-label={`Excluir ${u.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4"
          >
            <h2
              id="delete-user-title"
              className="text-xl font-bold text-red-700"
            >
              Excluir usuário
            </h2>

            <p className="text-sm text-slate-700">
              Deseja excluir definitivamente{" "}
              <strong>{userToDelete.name}</strong>?
            </p>

            <p className="text-xs text-slate-500">
              Esta ação não poderá ser desfeita.
              Sua própria conta não pode ser excluída.
            </p>

            <form onSubmit={deleteUser} className="space-y-4">
              <div>
                <label
                  htmlFor="supervisor-delete-password"
                  className="block text-sm font-semibold mb-2"
                >
                  Senha do supervisor
                </label>

                <input
                  id="supervisor-delete-password"
                  type="password"
                  autoComplete="off"
                  value={supervisorPassword}
                  onChange={(e) =>
                    setSupervisorPassword(e.target.value)
                  }
                  placeholder="Digite sua senha"
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDelete}
                  disabled={deleting}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={deleting || !supervisorPassword}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} />
                  {deleting ? "Excluindo..." : "Confirmar exclusão"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
