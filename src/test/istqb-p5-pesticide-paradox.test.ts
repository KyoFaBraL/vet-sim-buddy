/**
 * ISTQB Princípio 5 — Paradoxo do pesticida.
 * Casos NOVOS e atípicos (não repetidos das suítes anteriores): parâmetros sem
 * faixa cadastrada, IDs inexistentes, NaN, tendência sem estado anterior.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";
import { getAuthErrorMessage } from "@/lib/authErrors";

describe("P5 — Paradoxo do pesticida (entradas inéditas)", () => {
  beforeEach(() => seedDefaultCase());

  it("parâmetro sem faixa cadastrada nunca é crítico", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    const s = result.current.getParameterStatus(3, 999999);
    expect(s.isCritical).toBe(false);
  });

  it("ID de parâmetro inexistente retorna estado neutro", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    expect(result.current.getParameterStatus(9999, 7.4)).toEqual({ isNormal: true, isCritical: false });
  });

  it("tendência é nula quando não há leitura anterior", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    expect(result.current.getParameterTrend(1, 7.4)).toBeNull();
  });

  it("mensagens de erro toleram formatos inesperados", () => {
    expect(getAuthErrorMessage({ code: 429 })).toMatch(/acessos simultâneos/i);
    expect(getAuthErrorMessage({ message: "USER ALREADY REGISTERED" })).toMatch(/já está cadastrado/i);
    expect(getAuthErrorMessage(undefined)).toMatch(/erro inesperado/i);
  });
});
