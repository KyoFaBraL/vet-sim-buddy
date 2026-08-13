/**
 * Bateria 2 — Teste de UNIDADE
 * Unidades isoladas, sem backend e sem UI.
 */
import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { parameterDescriptions } from "@/constants/parameterDescriptions";

describe("Unidade — getAuthErrorMessage", () => {
  it("é uma função pura: mesma entrada, mesma saída", () => {
    const erro = { message: "Invalid login credentials" };
    expect(getAuthErrorMessage(erro)).toBe(getAuthErrorMessage(erro));
  });

  it("nunca retorna string vazia", () => {
    const entradas = [undefined, null, {}, { message: "" }, { status: 500 }];
    for (const e of entradas) {
      expect(getAuthErrorMessage(e).length).toBeGreaterThan(0);
    }
  });

  it("prioriza o status 429 sobre a mensagem original", () => {
    const msg = getAuthErrorMessage({ status: 429, message: "Invalid login credentials" });
    expect(msg).toContain("Muitos acessos simultâneos");
  });
});

describe("Unidade — constantes clínicas", () => {
  const entradas = Object.entries(parameterDescriptions);

  it("possui descrições cadastradas", () => {
    expect(entradas.length).toBeGreaterThan(0);
  });

  it.each(entradas)("%s tem conteúdo textual utilizável", (_nome, valor: any) => {
    const texto = typeof valor === "string" ? valor : JSON.stringify(valor);
    expect(texto.trim().length).toBeGreaterThan(10);
  });
});
