/**
 * ISTQB Princípio 6 — Testes dependem do contexto.
 * Contexto Prática (formativo, sem limite de tempo) vs Avaliação (limite 300s).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("P6 — Testes dependem do contexto (Prática vs Avaliação)", () => {
  beforeEach(() => {
    seedDefaultCase();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  it("modo avaliação encerra por tempo em 300s", async () => {
    const { result } = renderHook(() => useSimulation(1, "evaluation"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => { await result.current.toggleSimulation(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(302_000); });

    expect(result.current.gameStatus).toBe("lost");
    expect(result.current.isRunning).toBe(false);
  });

  it("modo prática não encerra por tempo após 300s", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    await act(async () => { await result.current.toggleSimulation(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(302_000); });

    expect(result.current.gameStatus).toBe("playing");
  });
});
