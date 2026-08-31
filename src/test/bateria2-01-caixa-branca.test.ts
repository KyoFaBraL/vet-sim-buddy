/**
 * Bateria 2 — Teste de CAIXA BRANCA
 * Avalia a estrutura interna do código: percorre explicitamente cada caminho
 * de execução (branches) das funções críticas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock, mockTables } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";
import { getAuthErrorMessage } from "@/lib/authErrors";

describe("Caixa branca — cobertura de caminhos de getAuthErrorMessage", () => {
  const caminhos: Array<[any, string]> = [
    [{ status: 429 }, "Muitos acessos simultâneos"],
    [{ message: "Rate limit exceeded" }, "Muitos acessos simultâneos"],
    [{ message: "too many requests" }, "Muitos acessos simultâneos"],
    [{ message: "User already registered" }, "já está cadastrado"],
    [{ message: "Email has already been registered" }, "já está cadastrado"],
    [{ message: "Invalid login credentials" }, "incorretos"],
    [{ message: "Email not confirmed" }, "Confirme seu email"],
    [{ message: "Password should be at least 6 characters" }, "mínimo 6 caracteres"],
    [{ message: "Failed to fetch" }, "Falha de conexão"],
    [{ message: "NetworkError when attempting to fetch" }, "Falha de conexão"],
  ];

  it.each(caminhos)("cobre o branch de %o", (erro, esperado) => {
    expect(getAuthErrorMessage(erro)).toContain(esperado);
  });

  it("cobre o caminho de fallback (mensagem desconhecida) e o caminho vazio", () => {
    expect(getAuthErrorMessage({ message: "Erro X do servidor" })).toBe("Erro X do servidor");
    expect(getAuthErrorMessage({})).toContain("erro inesperado");
    expect(getAuthErrorMessage(null)).toContain("erro inesperado");
  });
});

describe("Caixa branca — branches de prioridade em applyTreatment", () => {
  beforeEach(() => {
    seedDefaultCase();
    mockTables["tratamentos"] = [{ id: 10, nome: "Bicarbonato", descricao: "d", tipo: "medicamento" }];
    mockTables["efeitos_tratamento"] = [{ id_parametro: 1, magnitude: 0.2, descricao: null }];
    mockTables["tratamentos_adequados"] = [];
  });

  const casos: Array<[number, number]> = [
    [1, 25],
    [2, 15],
    [3, 10],
    [9, 10], // default do switch
  ];

  it.each(casos)("prioridade %i aplica %i de HP", async (prioridade, delta) => {
    mockTables["tratamentos_caso"] = [{ prioridade, justificativa: "j" }];
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    expect(result.current.hp).toBe(50 + delta);
    expect(result.current.lastHpChange).toBe(delta);
  });

  it("caminho de tratamento inadequado (sem gabarito) penaliza o HP", async () => {
    mockTables["tratamentos_caso"] = [];
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => {
      await result.current.applyTreatment(10);
    });

    expect(result.current.hp).toBe(35); // 50 - 15
  });

  it("caminho guardado: bloqueia tratamento quando a partida terminou", async () => {
    mockTables["tratamentos_caso"] = [{ prioridade: 1, justificativa: "j" }];
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    act(() => result.current.changeHp(-500));
    expect(result.current.gameStatus).toBe("lost");

    const hpAntes = result.current.hp;
    await act(async () => {
      await result.current.applyTreatment(10);
    });
    expect(result.current.hp).toBe(hpAntes);
  });
});
