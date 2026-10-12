import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Bus, UserPlus } from "lucide-react";
import { formatApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ matricula: "", name: "", password: "", role: "motorista" });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Cadastro enviado. Aguarde aprovação do supervisor.");
      nav("/login");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Falha ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3 justify-center">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
            <Bus size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Frota Escolar</div>
            <div className="text-xs text-slate-500">Solicitação de Cadastro</div>
          </div>
        </div>
        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">Solicitar cadastro</h2>
          <p className="text-sm text-slate-500 mt-1">Seu acesso será liberado após aprovação.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="r-mat">Matrícula</Label>
              <Input id="r-mat" data-testid="register-matricula-input" value={form.matricula}
                onChange={(e) => update("matricula", e.target.value)}
                className="h-12 mt-1.5 font-mono uppercase" required />
            </div>
            <div>
              <Label htmlFor="r-name">Nome completo</Label>
              <Input id="r-name" data-testid="register-name-input" value={form.name}
                onChange={(e) => update("name", e.target.value)} className="h-12 mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="r-pass">Senha</Label>
              <Input id="r-pass" type="password" data-testid="register-password-input"
                value={form.password} onChange={(e) => update("password", e.target.value)}
                className="h-12 mt-1.5" required minLength={4} />
            </div>
            <div>
              <Label>Função solicitada</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {["motorista", "supervisor"].map((r) => (
                  <button
                    type="button"
                    key={r}
                    data-testid={`register-role-${r}`}
                    onClick={() => update("role", r)}
                    className={`h-12 rounded-md border text-sm font-medium capitalize transition ${
                      form.role === r
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading} data-testid="register-submit-btn"
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold">
              <UserPlus size={18} /> {loading ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600 text-center">
            Já tem acesso?{" "}
            <Link to="/login" className="text-amber-700 font-semibold hover:underline">Entrar</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
