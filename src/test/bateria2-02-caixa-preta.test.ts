/**
 * Bateria 2 — Teste de CAIXA PRETA
 * Avalia o sistema apenas pela interface externa (API pública do simulador),
 * a partir dos requisitos funcionais esperados pelo usuário.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

const montar = async () => {
  const hook = renderHook(() => useSimulation(1, "practice"));
  await waitFor(() => expect(hook.result.current.parameters.length).toBe(3));
  return hook;
};

describe("Caixa preta — requisitos do usuário", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "j" }];
  });

  it("RF01 — o caso clínico é apresentado com nome, espécie e parâmetros iniciais", async () => {
    const { result } = await montar();
    expect(result.current.caseData?.nome).toBe("Acidose metabólica");
    expect(result.current.caseData?.especie).toBe("canino");
    expect(result.current.currentState[1]).toBe(7.2);
    expect(result.current.currentState[2]).toBe(30);
  });

  it("RF02 — o paciente inicia com 50 de vitalidade e a partida em andamento", async () => {
    const { result } = await montar();
    expect(result.current.hp).toBe(50);
    expect(result.current.gameStatus).toBe("playing");
    expect(result.current.isRunning).toBe(false);
  });

  it("RF03 — o tratamento correto melhora o quadro do paciente", async () => {
    const { result } = await montar();
    const phAntes = result.current.currentState[1];

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    expect(result.current.currentState[1]).toBeGreaterThan(phAntes);
    expect(result.current.hp).toBeGreaterThan(50);
  });

  it("RF04 — o usuário recebe o status clínico de cada parâmetro", async () => {
    const { result } = await montar();
    const normal = result.current.getParameterStatus(1, 7.4);
    const critico = result.current.getParameterStatus(1, 6.9);
    expect(normal.isNormal).toBe(true);
    expect(critico.isCritical).toBe(true);
  });

  it("RF05 — a vitalidade nunca sai da faixa visível de 0 a 100", async () => {
    const { result } = await montar();
    act(() => result.current.changeHp(+999));
    expect(result.current.hp).toBeLessThanOrEqual(100);

    const { result: r2 } = await montar();
    act(() => r2.current.changeHp(-999));
    expect(r2.current.hp).toBeGreaterThanOrEqual(0);
  });
});
