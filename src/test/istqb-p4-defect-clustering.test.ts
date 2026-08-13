/**
 * ISTQB Princípio 4 — Defeitos se agrupam (defect clustering).
 * Módulo historicamente mais sensível: HP e ciclo de vida da sessão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { seedDefaultCase, supabaseMock } from "./supabaseMock";

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

import { useSimulation } from "@/hooks/useSimulation";

describe("P4 — Defeitos se agrupam (módulo de HP)", () => {
  beforeEach(() => {
    seedDefaultCase();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("HP inicia em 50 e o jogo em andamento", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));
    expect(result.current.hp).toBe(50);
    expect(result.current.gameStatus).toBe("playing");
  });

  it("dica custa 10 de HP e não passa dos limites 0–100", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    act(() => result.current.changeHp(-10));
    expect(result.current.hp).toBe(40);

    act(() => result.current.changeHp(+100));
    expect(result.current.hp).toBeLessThanOrEqual(100);

    act(() => result.current.changeHp(-500));
    expect(result.current.hp).toBeGreaterThanOrEqual(0);
  });

  it("vitória ao alcançar 100 de HP", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    act(() => result.current.changeHp(+50));
    await waitFor(() => expect(result.current.hp).toBe(100));
    expect(result.current.gameStatus).toBe("won");
  });

  it("derrota ao chegar a 0 de HP", async () => {
    const { result } = renderHook(() => useSimulation(1, "practice"));
    await waitFor(() => expect(result.current.parameters.length).toBe(3));

    act(() => result.current.changeHp(-50));
    await waitFor(() => expect(result.current.hp).toBe(0));
    expect(result.current.gameStatus).toBe("lost");
  });
});
