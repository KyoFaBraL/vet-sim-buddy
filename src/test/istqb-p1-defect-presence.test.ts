/**
 * ISTQB Princípio 1 — Testes mostram a presença de defeitos (não sua ausência).
 * Alvo: tradução de erros de autenticação (crítico durante o uso em turma).
 */
import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "@/lib/authErrors";

describe("P1 — Teste mostra a presença de defeitos", () => {
  it("traduz limite de acessos simultâneos (HTTP 429)", () => {
    expect(getAuthErrorMessage({ status: 429 })).toMatch(/acessos simultâneos/i);
    expect(getAuthErrorMessage({ message: "Request rate limit reached" })).toMatch(/aguarde/i);
  });

  it("traduz email já cadastrado", () => {
    expect(getAuthErrorMessage({ message: "User already registered" })).toMatch(/já está cadastrado/i);
  });

  it("traduz credenciais inválidas", () => {
    expect(getAuthErrorMessage({ message: "Invalid login credentials" })).toMatch(/incorretos/i);
  });

  it("traduz email não confirmado", () => {
    expect(getAuthErrorMessage({ message: "Email not confirmed" })).toMatch(/Confirme seu email/i);
  });

  it("traduz falha de rede", () => {
    expect(getAuthErrorMessage({ message: "Failed to fetch" })).toMatch(/conexão/i);
  });

  it("nunca retorna string vazia (fallback garantido)", () => {
    expect(getAuthErrorMessage({}).length).toBeGreaterThan(0);
    expect(getAuthErrorMessage(null).length).toBeGreaterThan(0);
  });
});
