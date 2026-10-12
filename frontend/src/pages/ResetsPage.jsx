import React, { useEffect, useState } from "react";
import { api, formatApiError, formatDateTime } from "@/lib/api";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { KeyRound, Check, X, Copy } from "lucide-react";

function randomPassword() {
  return Math.random().toString(36).slice(-8);
}

export default function ResetsPage() {
  const [resets, setResets] = useState([]);
  const [tab, setTab] = useState("pending");
  const [current, setCurrent] = useState(null);
  const [tempPwd, setTempPwd] = useState("");
  const [issued, setIssued] = useState(null); // { matricula, password }

  const load = () => {
    api.get("/password-resets", { params: { status: tab } }).then((r) => setResets(r.data));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const openApprove = (r) => {
    setCurrent(r);
    setTempPwd(randomPassword());
  };

  const approve = async () => {
    if (!tempPwd || tempPwd.length < 4) return toast.error("Senha temporária inválida");
    try {
      await api.post(`/password-resets/${current.id}/approve`, { new_password: tempPwd });
      setIssued({ matricula: current.matricula, name: current.user_name, password: tempPwd });
      setCurrent(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const reject = async (r) => {
    if (!window.confirm(`Rejeitar solicitação de ${r.user_name}?`)) return;
    await api.post(`/password-resets/${r.id}/reject`);
    toast.success("Solicitação rejeitada");
    load();
  };

  const copyIssued = () => {
    navigator.clipboard.writeText(`Matrícula: ${issued.matricula}\nSenha temporária: ${issued.password}`);
    toast.success("Credenciais copiadas");
  };

  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <KeyRound size={26} className="text-amber-600" /> Recuperação de Senhas
          </h1>
          <p className="text-sm text-slate-500 mt-1">Aprove solicitações e envie a senha temporária ao usuário.</p>
        </div>

        <div className="flex gap-2">
          {[["pending", "Pendentes"], ["approved", "Aprovadas"], ["rejected", "Rejeitadas"], ["all", "Todas"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} data-testid={`resets-tab-${k}`}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                tab === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <Card className="p-0 border-slate-200 overflow-hidden">
          {resets.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <KeyRound size={32} className="mx-auto mb-2 text-slate-400" />
              Nenhuma solicitação nesta categoria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {resets.map((r) => (
                <div key={r.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">{r.user_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.matricula}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Solicitado em {formatDateTime(r.created_at)}
                    </div>
                    {r.reason && (
                      <div className="text-sm text-slate-700 mt-2 bg-slate-50 border border-slate-200 rounded p-2 max-w-md">
                        {r.reason}
                      </div>
                    )}
                    {r.status !== "pending" && r.resolved_by && (
                      <div className="text-xs text-slate-500 mt-1">
                        {r.status === "approved" ? "Aprovado" : "Rejeitado"} por {r.resolved_by} em {formatDateTime(r.resolved_at)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.status === "pending" ? "bg-amber-50 text-amber-700" :
                      r.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {r.status === "pending" ? "Pendente" : r.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </span>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => openApprove(r)}
                          data-testid={`approve-reset-${r.matricula}`}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <Check size={14} /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject(r)}
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

      <Dialog open={!!current} onOpenChange={(o) => !o && setCurrent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir senha temporária</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm">
                <div className="font-semibold">{current.user_name}</div>
                <div className="text-xs text-slate-500 font-mono">{current.matricula}</div>
              </div>
              <div>
                <Label>Senha temporária</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input className="h-11 font-mono" value={tempPwd}
                    data-testid="temp-password-input"
                    onChange={(e) => setTempPwd(e.target.value)} />
                  <Button type="button" variant="outline" onClick={() => setTempPwd(randomPassword())}>
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  O usuário deverá trocar a senha após o primeiro login em <em>Meu Perfil</em>.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrent(null)}>Cancelar</Button>
            <Button onClick={approve} data-testid="confirm-approve-reset"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              Confirmar e aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!issued} onOpenChange={(o) => !o && setIssued(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha temporária gerada</DialogTitle>
          </DialogHeader>
          {issued && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Repasse estas credenciais a <strong>{issued.name}</strong>:
              </p>
              <div className="p-4 rounded-md bg-slate-900 text-slate-100 font-mono text-sm space-y-1">
                <div>Matrícula: <span className="text-amber-400">{issued.matricula}</span></div>
                <div>Senha: <span className="text-amber-400">{issued.password}</span></div>
              </div>
              <Button onClick={copyIssued} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                <Copy size={16} /> Copiar credenciais
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
