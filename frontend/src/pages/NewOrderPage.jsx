import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError, formatDateTime } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Save, X, AlertTriangle } from "lucide-react";

const URGENCIES = ["Baixa", "Média", "Alta", "Crítica"];

export default function NewOrderPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState("list"); // list | manual
  const [form, setForm] = useState({
    vehicle_plate: "",
    vehicle_model: "",
    km: "",
    description: "",
    urgency: "Média",
  });
  const [loading, setLoading] = useState(false);
  const now = formatDateTime(new Date().toISOString());

  useEffect(() => {
    api.get("/vehicles").then((r) => setVehicles(r.data)).catch(() => {});
  }, []);

  const pickVehicle = (plate) => {
    const v = vehicles.find((x) => x.plate === plate);
    if (v) setForm((f) => ({ ...f, vehicle_plate: v.plate, vehicle_model: v.model }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_plate || !form.vehicle_model || !form.km || !form.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setLoading(true);
    try {
      await api.post("/service-orders", { ...form, km: parseInt(form.km, 10) });
      toast.success("Solicitação enviada com sucesso!");
      nav("/driver");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Nova Solicitação de Manutenção</h1>
          <p className="text-sm text-slate-500 mt-1">Descreva a falha com o máximo de detalhes possível.</p>
        </div>

        <Card className="p-5 sm:p-7 border-slate-200">
          <div className="grid sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200">
            <ReadOnly label="Matrícula" value={user?.matricula} mono />
            <ReadOnly label="Motorista" value={user?.name} />
            <ReadOnly label="Data e hora" value={now} />
          </div>

          <form onSubmit={submit} className="space-y-5 pt-5">
            <div>
              <Label>Veículo</Label>
              <div className="flex gap-2 mt-1.5">
                <button type="button" onClick={() => setMode("list")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === "list" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                  data-testid="veh-mode-list">
                  Selecionar da frota
                </button>
                <button type="button" onClick={() => setMode("manual")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === "manual" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                  data-testid="veh-mode-manual">
                  Digitar manualmente
                </button>
              </div>

              {mode === "list" ? (
                <div className="mt-3">
                  <Select value={form.vehicle_plate} onValueChange={pickVehicle}>
                    <SelectTrigger className="h-12" data-testid="vehicle-select">
                      <SelectValue placeholder="Selecione a placa / modelo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Nenhum veículo cadastrado</div>
                      ) : vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.plate}>
                          <span className="font-mono font-bold">{v.plate}</span> — {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Placa (ex: ABC-1D23)"
                    data-testid="vehicle-plate-input"
                    className="h-12 font-mono uppercase"
                    value={form.vehicle_plate}
                    onChange={(e) => setForm((f) => ({ ...f, vehicle_plate: e.target.value.toUpperCase() }))}
                  />
                  <Input
                    placeholder="Modelo / Descrição"
                    data-testid="vehicle-model-input"
                    className="h-12"
                    value={form.vehicle_model}
                    onChange={(e) => setForm((f) => ({ ...f, vehicle_model: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="km">Quilometragem atual (KM)</Label>
                <Input id="km" type="number" min="0" data-testid="km-input"
                  className="h-12 mt-1.5 font-mono"
                  value={form.km} onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} required />
              </div>
              <div>
                <Label>Urgência</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm((f) => ({ ...f, urgency: v }))}>
                  <SelectTrigger className="h-12 mt-1.5" data-testid="urgency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="desc">Descrição do problema</Label>
              <Textarea id="desc" data-testid="description-input"
                className="mt-1.5 min-h-[140px]"
                placeholder="Descreva a falha, barulho estranho, luz do painel, problema no freio, etc."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required />
            </div>

            {form.urgency === "Crítica" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <div>Urgência crítica — o ônibus pode ser retirado de rota até avaliação técnica.</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => nav("/driver")}
                className="h-12 flex-1" data-testid="cancel-btn">
                <X size={18} /> Cancelar
              </Button>
              <Button type="submit" disabled={loading} data-testid="submit-os-btn"
                className="h-12 flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                <Save size={18} /> {loading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Shell>
  );
}

function ReadOnly({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
