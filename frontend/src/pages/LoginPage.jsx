import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Bus, LogIn } from "lucide-react";
import { formatApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(matricula, password);
      toast.success(`Bem-vindo, ${user.name}`);
      nav(user.role === "supervisor" ? "/admin" : "/driver");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-slate-50">
      <div className="lg:col-span-3 relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1613688263142-67f1e0c25ef1?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80"
          alt="Frota de ônibus escolar"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-900/40" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
              <Bus size={26} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-bold text-2xl leading-none">Frota Escolar</div>
              <div className="text-sm text-slate-300">Portal de Manutenção</div>
            </div>
          </div>
          <div className="max-w-lg">
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Gestão de Ordens de Serviço para a frota que leva nossas crianças.
            </h1>
            <p className="mt-6 text-slate-300 text-lg leading-relaxed">
              Registre falhas, acompanhe reparos e mantenha cada ônibus seguro — tudo em um só lugar,
              no celular ou no computador da coordenação.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
              {[
                ["5", "Status de OS"],
                ["24h", "Tempo médio de triagem"],
                ["100%", "Frota rastreada"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-display text-3xl font-extrabold text-amber-400">{k}</div>
                  <div className="text-slate-300">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400">© {new Date().getFullYear()} Frota Escolar · Uso interno</div>
        </div>
      </div>

      <div className="lg:col-span-2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
              <Bus size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-bold text-xl leading-none">Frota Escolar</div>
              <div className="text-xs text-slate-500">Portal de Manutenção</div>
            </div>
          </div>
          <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
            <h2 className="font-display text-2xl font-bold">Entrar no sistema</h2>
            <p className="text-sm text-slate-500 mt-1">Use sua matrícula e senha corporativa.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  data-testid="login-matricula-input"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="EX: ADMIN001"
                  className="h-12 mt-1.5 font-mono uppercase"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 mt-1.5"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                data-testid="login-submit-btn"
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-base"
              >
                <LogIn size={18} /> {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center">
                <Link to="/forgot" data-testid="forgot-password-link"
                  className="text-sm text-slate-600 hover:text-amber-700">
                  Esqueci minha senha
                </Link>
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600 text-center">
              Novo motorista?{" "}
              <Link to="/register" className="text-amber-700 font-semibold hover:underline" data-testid="go-to-register">
                Solicitar cadastro
              </Link>
            </div>
          </Card>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Admin demo: <span className="font-mono">ADMIN001 / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
