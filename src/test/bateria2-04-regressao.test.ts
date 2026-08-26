/**
 * Bateria 2 — Teste de REGRESSÃO
 * Garante que correções e recursos recentes continuam funcionando:
 * (a) encerramento da partida quando o HP atinge os extremos via changeHp;
 * (b) tradução amigável do limite anti-abuso (turmas na mesma rede);
 * (c) parâmetros sem faixa cadastrada não quebram o status.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";
import { getAuthErrorMessage } from "@/lib/authErrors";

const montar = async () => {
  const hook = renderHook(() => useSimulation(1, "practice"));
  await waitFor(() => expect(hook.result.current.parameters.length).toBe(3));
  return hook;
};

describe("Regressão — correções já entregues", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "j" }];
  });

  it("BUG-01 — HP zerado por changeHp encerra a partida como derrota", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(-50));
    expect(result.current.hp).toBe(0);
    expect(result.current.gameStatus).toBe("lost");
  });

  it("BUG-01b — HP é limitado a 99 enquanto há parâmetro fora da faixa (regra de estabilização)", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(+50));
    expect(result.current.hp).toBe(99);
    expect(result.current.gameStatus).toBe("playing");
  });


  it("BUG-02 — erro 429 continua traduzido com orientação prática", () => {
    const msg = getAuthErrorMessage({ status: 429, message: "Request rate limit reached" });
    expect(msg).toContain("Aguarde");
    expect(msg.toLowerCase()).not.toContain("rate limit");
  });

  it("BUG-03 — penalidade de dica (-10) mantém a partida em andamento", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(-10));
    expect(result.current.hp).toBe(40);
    expect(result.current.gameStatus).toBe("playing");
  });

  it("BUG-04 — parâmetro sem faixa cadastrada não é marcado como crítico", async () => {
    const { result } = await montar();
    const status = result.current.getParameterStatus(3, 123);
    expect(status.isCritical).toBe(false);
  });

  it("BUG-05 — reset restaura o estado inicial da simulação", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(-20));
    await act(async () => {
      await result.current.resetSimulation();
    });
    expect(result.current.hp).toBe(50);
    expect(result.current.gameStatus).toBe("playing");
    expect(result.current.isRunning).toBe(false);
  });
});
