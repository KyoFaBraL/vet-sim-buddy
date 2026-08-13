/**
 * ISTQB Princípio 3 — Testes antecipados economizam tempo e dinheiro.
 * Validações estáticas de conteúdo clínico e configuração, executáveis sem backend.
 */
import { describe, it, expect } from "vitest";
import { parameterDescriptions } from "@/constants/parameterDescriptions";

describe("P3 — Teste antecipado (validação estática)", () => {
  it("todo parâmetro descrito tem descrição, faixa normal e nota clínica", () => {
    const keys = Object.keys(parameterDescriptions);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const key of keys) {
      const p = parameterDescriptions[key];
      expect(p.description.trim().length, `${key}.description`).toBeGreaterThan(10);
      expect(p.normal.trim().length, `${key}.normal`).toBeGreaterThan(3);
      expect(p.clinical.trim().length, `${key}.clinical`).toBeGreaterThan(10);
    }
  });

  it("faixa de pH segue o padrão clínico do projeto (7.35–7.45)", () => {
    expect(parameterDescriptions.pH.normal).toContain("7.35");
    expect(parameterDescriptions.pH.normal).toContain("7.45");
  });

  it("não há descrições duplicadas entre parâmetros distintos", () => {
    const descriptions = Object.values(parameterDescriptions).map(p => p.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
