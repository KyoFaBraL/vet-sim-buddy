/**
 * ISTQB Princípio 7 — A ausência de erros é uma ilusão.
 * Verifica requisitos de USO (adequação ao usuário/turma), não só ausência de bugs:
 * mensagens em português, orientação acionável e carga inicial de caso pronta para aula.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";
import { getAuthErrorMessage } from "@/lib/authErrors";

const ENGLISH_LEAK = /(rate limit|invalid login|already registered|failed to fetch)/i;

describe("P7 — Ausência de erros é ilusão (adequação ao uso)", () => {
  beforeEach(() => seedDefaultCase());

  it("nenhuma mensagem conhecida vaza texto técnico em inglês", () => {
    const inputs = [
      { status: 429 },
      { message: "Invalid login credentials" },
      { message: "User already registered" },
      { message: "Failed to fetch" },
      { message: "Email not confirmed" },
      { message: "Password should be at least 6 characters" },
    ];
    for (const i of inputs) {
      expect(getAuthErrorMessage(i)).not.toMatch(ENGLISH_LEAK);
    }
  });

  it("erro de rede orienta ação concreta ao aluno", () => {
    expect(getAuthErrorMessage({ status: 429 })).toMatch(/dados móveis|aguarde/i);
  });

  it("caso carrega com espécie normalizada e valores iniciais fora da faixa (cenário didático)", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.caseData).toBeTruthy());

    expect(result.current.caseData.especie).toBe("canino");
    expect(result.current.currentState[1]).toBe(7.2);
    expect(result.current.getParameterStatus(1, result.current.currentState[1]).isCritical).toBe(true);
  });
});
