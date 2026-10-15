import React, { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import Shell from "@/components/Shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Truck } from "lucide-react";

const formatDateBR = (date) => {
  if (!date) return "Não informado";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({
  plate: "",
  model: "",
  description: "",
  renavam: "",
  licensing_due_date: "",
  inspection_due_date: "",
  survey_due_date: "",
  additional_notes: "",
});
  const [loading, setLoading] = useState(false);

  const load = () => api.get("/vehicles").then((r) => setVehicles(r.data));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.plate || !form.model) return toast.error("Placa e modelo são obrigatórios");
    setLoading(true);
    try {
      await api.post("/vehicles", form);
      toast.success("Veículo cadastrado");
     setForm({
  plate: "",
  model: "",
  description: "",
  renavam: "",
  licensing_due_date: "",
  inspection_due_date: "",
  survey_due_date: "",
  additional_notes: "",
});
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remover este veículo?")) return;
    await api.delete(`/vehicles/${id}`);
    toast.success("Veículo removido");
    load();
  };

  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Gestão de Veículos</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastre os ônibus da frota para seleção rápida pelos motoristas.</p>
        </div>

        <Card className="p-5 border-slate-200">
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="plate">Placa</Label>
              <Input id="plate" data-testid="vehicle-plate-input"
                value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                className="h-11 mt-1.5 font-mono uppercase" placeholder="ABC-1D23" required />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" data-testid="vehicle-model-input"
                value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="h-11 mt-1.5" placeholder="Mercedes OF-1721" required />
            </div>
            <div>
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Textarea id="desc" rows={1}
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1.5 min-h-[44px]" placeholder="Capacidade / Prefixo / Rota" />
            </div>
            <div>
  <Label htmlFor="renavam">RENAVAM</Label>
  <Input
    id="renavam"
    value={form.renavam}
    onChange={(e) => setForm((f) => ({ ...f, renavam: e.target.value }))}
    className="h-11 mt-1.5"
    placeholder="Número do RENAVAM"
  />
</div>

<div>
  <Label htmlFor="licensing">Vencimento do licenciamento</Label>
  <Input
    id="licensing"
    type="date"
    value={form.licensing_due_date}
    onChange={(e) => setForm((f) => ({ ...f, licensing_due_date: e.target.value }))}
    className="h-11 mt-1.5 w-full min-w-0"
  />
</div>

<div>
  <Label htmlFor="inspection">Próxima inspeção</Label>
  <Input
    id="inspection"
    type="date"
    value={form.inspection_due_date}
    onChange={(e) => setForm((f) => ({ ...f, inspection_due_date: e.target.value }))}
    className="h-11 mt-1.5 w-full min-w-0"
  />
</div>

<div>
  <Label htmlFor="survey">Próxima vistoria</Label>
  <Input
    id="survey"
    type="date"
    value={form.survey_due_date}
    onChange={(e) => setForm((f) => ({ ...f, survey_due_date: e.target.value }))}
    className="h-11 mt-1.5 w-full min-w-0"
  />
</div>

<div className="sm:col-span-4">
  <Label htmlFor="additional_notes">Observações adicionais</Label>
  <Textarea
    id="additional_notes"
    value={form.additional_notes}
    onChange={(e) => setForm((f) => ({ ...f, additional_notes: e.target.value }))}
    className="mt-1.5"
    placeholder="Informações adicionais sobre o veículo..."
  />
</div>
            <Button type="submit" disabled={loading} data-testid="add-vehicle-btn"
              className="h-11 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Plus size={16} /> Adicionar
            </Button>
          </form>
        </Card>

        <Card className="p-0 border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h2 className="font-display font-bold">Frota cadastrada ({vehicles.length})</h2>
          </div>
          {vehicles.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Truck size={32} className="mx-auto mb-2 text-slate-400" />
              Nenhum veículo cadastrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="plate-chip">{v.plate}</span>
                    <div>
                      <div className="font-semibold">{v.model}</div>
                      {v.description && <div className="text-xs text-slate-500">{v.description}</div>}
                    </div>
                  </div>

  <div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setSelectedVehicle(v)}
  >
    Ver detalhes
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => remove(v.id)}
    className="text-red-700 border-red-200 hover:bg-red-50"
  >
    <Trash2 size={14} />
  </Button>
</div>
                  </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Dialog
  open={!!selectedVehicle}
  onOpenChange={(open) => {
    if (!open) setSelectedVehicle(null);
  }}
>
  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Ficha do Veículo</DialogTitle>
    </DialogHeader>

    {selectedVehicle && (
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xl font-bold font-mono">
            {selectedVehicle.plate}
          </div>
          <div className="font-semibold mt-1">
            {selectedVehicle.model}
          </div>
          <div className="text-slate-500 mt-1">
            {selectedVehicle.description || "Sem descrição"}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <strong>RENAVAM:</strong>{" "}
            {selectedVehicle.renavam || "Não informado"}
          </div>

          <div>
            <strong>Vencimento do licenciamento:</strong>{" "}
            {formatDateBR(selectedVehicle.licensing_due_date)}
          </div>

          <div>
            <strong>Próxima inspeção:</strong>{" "}
            {formatDateBR(selectedVehicle.inspection_due_date)}
          </div>

          <div>
            <strong>Próxima vistoria:</strong>{" "}
            {formatDateBR(selectedVehicle.survey_due_date)}
          </div>
        </div>

        <div className="border-t pt-3">
          <strong>Observações adicionais</strong>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">
            {selectedVehicle.additional_notes || "Nenhuma observação cadastrada."}
          </p>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </Shell>
  );
}
