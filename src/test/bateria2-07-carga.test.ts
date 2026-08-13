/**
 * Bateria 2 — Teste de CARGA
 * Simula o cenário de turma: muitas sessões simultâneas e grande volume
 * de cálculos clínicos, verificando estabilidade e tempo de resposta.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("Carga — turma inteira em uso simultâneo", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_caso"] = [{ prioridade: 2, justificativa: "j" }];
  });

  it("40 sessões simultâneas carregam o caso sem falhas", async () => {
    const inicio = Date.now();
    const hooks = Array.from({ length: 40 }, () => renderHook(() => useSimulation(1, "practice")));

    await waitFor(() => {
      hooks.forEach((h) => expect(h.result.current.parameters.length).toBe(3));
    });

    hooks.forEach((h) => {
      expect(h.result.current.hp).toBe(50);
      expect(h.result.current.currentState[1]).toBe(7.2);
    });

    expect(Date.now() - inicio).toBeLessThan(15000);
    hooks.forEach((h) => h.unmount());
  }, 30000);

  it("30 tratamentos aplicados em sequência mantêm o HP consistente", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await result.current.applyTreatment(10);
      });
      expect(result.current.hp).toBeGreaterThanOrEqual(0);
      expect(result.current.hp).toBeLessThanOrEqual(100);
      if (result.current.gameStatus !== "playing") break;
    }

    expect(["playing", "won", "lost"]).toContain(result.current.gameStatus);
  }, 30000);

  it("10.000 avaliações de status clínico executam em tempo aceitável", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const inicio = performance.now();
    for (let i = 0; i < 10000; i++) {
      result.current.getParameterStatus(1, 7.0 + (i % 100) / 100);
    }
    expect(performance.now() - inicio).toBeLessThan(2000);
  });
});
