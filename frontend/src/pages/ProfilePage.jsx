import React, { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!currentPassword) return toast.error("Informe sua senha atual");
    if (newPassword && newPassword !== confirm) return toast.error("Confirmação de nova senha não confere");
    setLoading(true);
    try {
      const payload = { current_password: currentPassword };
      if (name && name !== user?.name) payload.name = name;
      if (newPassword) payload.new_password = newPassword;
      await api.put("/auth/profile", payload);
      toast.success("Perfil atualizado. Faça login novamente.");
      setTimeout(() => { logout(); window.location.href = "/login"; }, 1200);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Meu perfil</h1>
          <p className="text-sm text-slate-500 mt-1">Atualize seu nome e senha de acesso.</p>
        </div>

        <Card className="p-5 sm:p-7 border-slate-200">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Matrícula</div>
                <div className="font-mono font-semibold mt-1">{user?.matricula}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Função</div>
                <div className="font-semibold mt-1 capitalize">{user?.role}</div>
              </div>
            </div>

            <div>
              <Label htmlFor="p-name" className="flex items-center gap-2 mb-1.5">
                <User size={14} /> Nome completo
              </Label>
              <Input id="p-name" data-testid="profile-name-input" value={name}
                onChange={(e) => setName(e.target.value)} className="h-11" />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Lock size={14} /> Alterar senha (opcional)
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="p-new">Nova senha</Label>
                  <Input id="p-new" type="password" data-testid="profile-new-password"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 mt-1.5" placeholder="Deixe em branco para manter a atual" minLength={4} />
                </div>
                <div>
                  <Label htmlFor="p-confirm">Confirmar nova senha</Label>
                  <Input id="p-confirm" type="password" data-testid="profile-confirm-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="h-11 mt-1.5" minLength={4} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Label htmlFor="p-cur" className="text-slate-700">Senha atual (obrigatório para salvar)</Label>
              <Input id="p-cur" type="password" data-testid="profile-current-password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 mt-1.5" required />
            </div>

            <Button type="submit" disabled={loading} data-testid="profile-save-btn"
              className="h-12 w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Save size={18} /> {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
