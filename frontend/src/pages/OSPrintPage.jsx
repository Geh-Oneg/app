import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatDateTime } from "@/lib/api";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Printer, Bus } from "lucide-react";

export default function OSPrintPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [os, setOs] = useState(null);

  useEffect(() => {
    api.get(`/service-orders/${id}`).then((r) => setOs(r.data));
  }, [id]);

  if (!os) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando OS...</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5 no-print">
          <Button variant="outline" onClick={() => nav(-1)}>
            <ArrowLeft size={16} /> Voltar
          </Button>
          <Button onClick={() => window.print()} data-testid="print-trigger-btn"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
            <Printer size={16} /> Imprimir / Salvar PDF
          </Button>
        </div>

        <div className="print-sheet bg-white shadow-md rounded-lg p-8 sm:p-12 border border-slate-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-amber-500 text-slate-900 flex items-center justify-center">
                <Bus size={30} strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-display font-extrabold text-xl leading-tight">FROTA ESCOLAR</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Ordem de Serviço Nº</div>
              <div className="font-display font-extrabold text-2xl">{os.os_number}</div>
              <div className="mt-1"><StatusBadge status={os.status} /></div>
            </div>
          </div>

          <h1 className="font-display text-xl font-bold text-center mt-5 tracking-tight">
            ORDEM DE SERVIÇO DE MANUTENÇÃO
          </h1>
          <p className="text-center text-xs text-slate-500 mt-1">
            Emitida em {formatDateTime(os.created_at)} · Última atualização {formatDateTime(os.updated_at)}
          </p>

          {/* Section: Solicitante */}
          <SectionTitle>1. Dados do Solicitante</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matrícula" value={os.driver_matricula} mono />
            <Field label="Nome do motorista" value={os.driver_name} />
          </div>

          {/* Section: Veículo */}
          <SectionTitle>2. Dados do Veículo</SectionTitle>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Placa" value={os.vehicle_plate} mono />
            <Field label="Modelo" value={os.vehicle_model} />
            <Field label="Quilometragem (KM)" value={Number(os.km).toLocaleString("pt-BR")} mono />
          </div>

          {/* Section: Descrição */}
          <SectionTitle>3. Descrição da Falha / Problema Relatado</SectionTitle>
          <div className="rounded border border-slate-300 p-4 min-h-[120px] text-sm leading-relaxed whitespace-pre-wrap">
            {os.description}
          </div>
          {os.urgency && (
            <div className="mt-2 text-xs text-slate-600">
              <span className="font-semibold">Urgência informada:</span> {os.urgency}
            </div>
          )}

          {/* Section: Supervisor */}
          <SectionTitle>4. Parecer e Observações do Supervisor</SectionTitle>
          <div className="rounded border border-slate-300 p-4 min-h-[100px] text-sm leading-relaxed whitespace-pre-wrap">
            {os.supervisor_notes || <span className="text-slate-400">— (sem observações registradas)</span>}
          </div>

          {/* Section: Histórico */}
          {os.status_history && os.status_history.length > 0 && (
            <>
              <SectionTitle>5. Histórico de Status</SectionTitle>
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-slate-300">Data</th>
                    <th className="text-left px-3 py-2 border-b border-slate-300">Status</th>
                    <th className="text-left px-3 py-2 border-b border-slate-300">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {os.status_history.map((h, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="px-3 py-2">{formatDateTime(h.at)}</td>
                      <td className="px-3 py-2">{h.status}</td>
                      <td className="px-3 py-2">{h.by || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Signatures */}
          <SectionTitle>Assinaturas</SectionTitle>
          <div className="grid grid-cols-2 gap-10 mt-10">
            <Signature label="Motorista Solicitante" sub={os.driver_name} />
            <Signature label="Supervisor / Mecânico Responsável" sub="___________________________" />
          </div>

          <div className="mt-10 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center">
            Documento gerado digitalmente pelo Sistema de Gestão de OS – Frota Escolar · {os.os_number}
          </div>
        </div>
      </div>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <h2 className="font-display font-bold text-sm uppercase tracking-widest mt-6 mb-3 pb-1 border-b border-slate-300 text-slate-800">
    {children}
  </h2>
);

const Field = ({ label, value, mono }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className={`text-sm font-semibold mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>
);

const Signature = ({ label, sub }) => (
  <div className="text-center">
    <div className="border-b-2 border-slate-900 h-10" />
    <div className="text-xs font-semibold mt-2">{label}</div>
    <div className="text-[11px] text-slate-500">{sub}</div>
  </div>
);
