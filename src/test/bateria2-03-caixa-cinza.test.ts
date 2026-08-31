/**
 * Bateria 2 — Teste de CAIXA CINZA
 * Usa conhecimento parcial da estrutura interna (ordem de consulta do gabarito:
 * tratamentos_caso -> tratamentos_adequados) mas valida o efeito externo visível.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("Caixa cinza — gabarito do caso e fallback pela condição", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
  });

  it("usa o gabarito específico do caso quando ele existe", async () => {
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "primeira linha" }];
    mockTables["tratamentos_adequados"] = [{ prioridade: 3, justificativa: "genérica" }];

    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    // prioridade 1 do gabarito do caso (+25) vence a genérica (+10);
    // o tratamento adequado normaliza pH e PaCO2 e concede alta (100 HP)
    expect(result.current.lastHpChange).toBe(25);
    expect(result.current.hp).toBe(100);
  });

  it("recorre ao gabarito da condição primária em casos pré-definidos", async () => {
    mockTables["casos_clinicos"] = [
      {
        id: 1,
        nome: "Acidose metabólica",
        especie: "Canino",
        user_id: null,
        id_condicao_primaria: 4,
        condicoes: { nome: "Acidose", descricao: "x" },
      },
    ];
    mockTables["tratamentos_caso"] = [];
    mockTables["tratamentos_adequados"] = [{ prioridade: 2, justificativa: "adequado à condição" }];

    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.caseData?.id_condicao_primaria).toBe(4));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    expect(result.current.lastHpChange).toBe(15); // prioridade 2
    expect(result.current.hp).toBe(100); // parâmetros normalizados -> alta
  });

  it("caso personalizado sem gabarito não herda o fallback da condição", async () => {
    mockTables["casos_clinicos"] = [
      {
        id: 1,
        nome: "Caso do professor",
        especie: "Felino",
        user_id: "prof-1",
        id_condicao_primaria: 4,
        condicoes: { nome: "Acidose", descricao: "x" },
      },
    ];
    mockTables["tratamentos_caso"] = [];
    mockTables["tratamentos_adequados"] = [{ prioridade: 1, justificativa: "não deve ser usada" }];

    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.caseData?.user_id).toBe("prof-1"));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    expect(result.current.hp).toBe(35); // tratamento tratado como inadequado
  });
});
