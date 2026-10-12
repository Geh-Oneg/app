import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bus, KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [matricula, setMatricula] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { matricula, reason });
      toast.success(data.message || "Solicitação enviada");
      setSent(true);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
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
            <div className="text-xs text-slate-500">Recuperação de Senha</div>
          </div>
        </div>
        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <KeyRound size={22} className="text-amber-600" /> Esqueci minha senha
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Envie uma solicitação ao supervisor. Após aprovação, você receberá uma senha temporária.
          </p>

          {sent ? (
            <div className="mt-6 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <strong>Solicitação enviada!</strong> Procure o supervisor da frota para receber sua nova senha temporária.
              Após o primeiro login, altere a senha na página <em>Meu Perfil</em>.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="fp-mat">Matrícula</Label>
                <Input id="fp-mat" data-testid="forgot-matricula-input" value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="h-12 mt-1.5 font-mono uppercase" required />
              </div>
              <div>
                <Label htmlFor="fp-reason">Motivo (opcional)</Label>
                <Textarea id="fp-reason" data-testid="forgot-reason-input" value={reason}
                  onChange={(e) => setReason(e.target.value)} rows={3}
                  className="mt-1.5" placeholder="Ex: Esqueci a senha após as férias..." />
              </div>
              <Button type="submit" disabled={loading} data-testid="forgot-submit-btn"
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                {loading ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <button onClick={() => nav("/login")} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Voltar ao login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
