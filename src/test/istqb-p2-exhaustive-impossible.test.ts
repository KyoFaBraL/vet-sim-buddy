/**
 * ISTQB Princípio 2 — Testes exaustivos são impossíveis.
 * Estratégia: partições de equivalência + valores-limite no status dos parâmetros
 * (pH 7.35–7.45), em vez de varrer todos os valores possíveis.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("P2 — Testes exaustivos são impossíveis (partições + limites)", () => {
  beforeEach(() => seedDefaultCase());

  it("classifica pH por partição e nos valores-limite", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const status = (v: number) => result.current.getParameterStatus(1, v);

    // Partição inferior (acidose) — crítico
    expect(status(7.0).isCritical).toBe(true);
    // Limite inferior exato — dentro da faixa, mas em margem de alerta (10%)
    expect(status(7.35).isCritical).toBe(false);
    expect(status(7.35).isNormal).toBe(false);
    // Partição central — normal
    expect(status(7.4).isNormal).toBe(true);
    // Limite superior exato
    expect(status(7.45).isCritical).toBe(false);
    // Partição superior (alcalose) — crítico
    expect(status(7.6).isCritical).toBe(true);
  });

  it("classifica PaCO2 nos limites 35 e 45", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    expect(result.current.getParameterStatus(2, 34.9).isCritical).toBe(true);
    expect(result.current.getParameterStatus(2, 40).isNormal).toBe(true);
    expect(result.current.getParameterStatus(2, 45.1).isCritical).toBe(true);
  });
});
