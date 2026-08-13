/**
 * Bateria 2 — Teste de ESTRESSE
 * Submete o simulador a condições extremas e fora da especificação,
 * avaliando estabilidade e capacidade de recuperação.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

const montar = async (modo: "practice" | "evaluation" = "practice") => {
  const hook = renderHook(() => useSimulation(1, modo));
  await waitFor(() => expect(hook.result.current.parameters.length).toBe(3));
  return hook;
};

describe("Estresse — valores e cliques extremos", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "j" }];
  });

  it("suporta variações absurdas de HP sem quebrar a faixa 0–100", async () => {
    const { result } = await montar();
    const extremos = [1e9, -1e9, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER];
    for (const delta of extremos) {
      act(() => result.current.changeHp(delta));
      expect(result.current.hp).toBeGreaterThanOrEqual(0);
      expect(result.current.hp).toBeLessThanOrEqual(100);
      expect(Number.isFinite(result.current.hp)).toBe(true);
    }
  });

  it("valores clínicos fora da especificação não travam a avaliação de status", async () => {
    const { result } = await montar();
    const entradas = [-1000, 0, 1e6, NaN, Infinity, -Infinity];
    for (const v of entradas) {
      const status = result.current.getParameterStatus(1, v);
      expect(typeof status.isCritical).toBe("boolean");
      expect(typeof status.isNormal).toBe("boolean");
    }
  });

  it("rajada de 50 cliques concorrentes em tratamento não corrompe o estado", async () => {
    const { result } = await montar();
    await act(async () => {
      await Promise.all(Array.from({ length: 50 }, () => result.current.applyTreatment(10)));
    });
    expect(result.current.hp).toBeGreaterThanOrEqual(0);
    expect(result.current.hp).toBeLessThanOrEqual(100);
  }, 30000);

  it("recupera-se após o fim da partida por meio do reset", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(-1e9));
    expect(result.current.gameStatus).toBe("lost");

    await act(async () => {
      await result.current.resetSimulation();
    });

    expect(result.current.gameStatus).toBe("playing");
    expect(result.current.hp).toBe(50);
  });

  it("ciclos repetidos de start/reset não deixam a simulação em estado inválido", async () => {
    const { result } = await montar();
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.toggleSimulation();
      });
      await act(async () => {
        await result.current.resetSimulation();
      });
      expect(result.current.isRunning).toBe(false);
      expect(result.current.hp).toBe(50);
      expect(result.current.gameStatus).toBe("playing");
    }
  }, 30000);
});
