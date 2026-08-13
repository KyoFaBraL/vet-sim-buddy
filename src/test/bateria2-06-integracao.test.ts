/**
 * Bateria 2 — Teste de INTEGRAÇÃO
 * Verifica a interação entre hook de simulação, camada de dados (backend mockado)
 * e o ciclo de vida da sessão/histórico.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("Integração — simulação + persistência", () => {
  beforeEach(() => {
    seedDefaultCase();
    supabaseMock.from.mockClear();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "j" }];
  });

  afterEach(() => vi.useRealTimers());

  it("carrega caso, parâmetros e valores iniciais das tabelas correspondentes", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const tabelas = supabaseMock.from.mock.calls.map((c) => c[0]);
    expect(tabelas).toContain("casos_clinicos");
    expect(tabelas).toContain("parametros");
    expect(tabelas).toContain("valores_iniciais_caso");
    expect(tabelas).toContain("parametros_secundarios_caso");
  });

  it("iniciar a simulação cria uma sessão no backend", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.toggleSimulation();
    });

    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
    expect(supabaseMock.from.mock.calls.map((c) => c[0])).toContain("simulation_sessions");
    expect(result.current.isRunning).toBe(true);
  });

  it("aplicar tratamento integra gabarito, efeitos e estado clínico", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    const tabelas = supabaseMock.from.mock.calls.map((c) => c[0]);
    expect(tabelas).toContain("tratamentos");
    expect(tabelas).toContain("tratamentos_caso");
    expect(tabelas).toContain("efeitos_tratamento");
    expect(result.current.currentState[1]).toBeCloseTo(7.4, 5);
  });

  it("com a simulação rodando, o histórico é acumulado e enviado em lote", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.toggleSimulation();
    });

    await waitFor(() => expect(result.current.history.length).toBeGreaterThan(0), {
      timeout: 4000,
    });
    await waitFor(
      () => expect(supabaseMock.from.mock.calls.map((c) => c[0])).toContain("session_history"),
      { timeout: 9000 }
    );
  }, 20000);

});
