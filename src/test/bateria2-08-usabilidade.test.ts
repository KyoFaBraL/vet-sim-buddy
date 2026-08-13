/**
 * Bateria 2 — Teste de USABILIDADE
 * Avalia clareza, idioma e caráter acionável do que o usuário final vê,
 * além da previsibilidade das faixas clínicas exibidas no monitor.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";
import { getAuthErrorMessage } from "@/lib/authErrors";

const mensagens = [
  getAuthErrorMessage({ status: 429 }),
  getAuthErrorMessage({ message: "User already registered" }),
  getAuthErrorMessage({ message: "Invalid login credentials" }),
  getAuthErrorMessage({ message: "Email not confirmed" }),
  getAuthErrorMessage({ message: "Failed to fetch" }),
  getAuthErrorMessage({}),
];

describe("Usabilidade — comunicação com o aluno", () => {
  it.each(mensagens)("a mensagem \"%s\" está em português, sem jargão técnico", (msg) => {
    expect(msg).not.toMatch(/rate limit|fetch|credentials|token|null|undefined|error:/i);
    expect(msg).toMatch(/[a-zà-ú]/i);
  });

  it.each(mensagens)("a mensagem \"%s\" é curta e termina em pontuação", (msg) => {
    expect(msg.length).toBeLessThan(180);
    expect(msg.trim()).toMatch(/[.!]$/);
  });

  it("mensagens de bloqueio indicam o próximo passo ao aluno", () => {
    expect(getAuthErrorMessage({ status: 429 })).toMatch(/aguarde|tente novamente|dados móveis/i);
    expect(getAuthErrorMessage({ message: "User already registered" })).toMatch(/login/i);
  });
});

describe("Usabilidade — leitura do monitor do paciente", () => {
  beforeEach(() => seedDefaultCase());

  it("o status do parâmetro é autoexplicativo (normal, alerta ou crítico)", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const normal = result.current.getParameterStatus(1, 7.4);
    const alerta = result.current.getParameterStatus(1, 7.35);
    const critico = result.current.getParameterStatus(1, 7.0);

    expect(normal.isNormal && !normal.isCritical).toBe(true);
    expect(alerta.isNormal).toBe(false);
    expect(alerta.isCritical).toBe(false);
    expect(critico.isCritical).toBe(true);
  });

  it("a tendência do parâmetro é informada de forma comparável", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const trend = result.current.getParameterTrend(1, 7.2);
    expect(["up", "down", "stable", null, undefined]).toContain(trend as any);
  });
});
