import { vi } from "vitest";

/**
 * Minimal chainable mock of the backend client, sufficient for the
 * simulation hook (select/eq/is/order/insert/update/single + auth.getUser).
 */
export const mockTables: Record<string, any[]> = {};

function builder(table: string) {
  const result = () => ({ data: mockTables[table] ?? [], error: null });
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    is: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    maybeSingle: async () => ({ data: (mockTables[table] ?? [])[0] ?? null, error: null }),
    single: async () => ({ data: (mockTables[table] ?? [])[0] ?? null, error: null }),
    then: (resolve: any) => Promise.resolve(result()).then(resolve),
  };
  return chain;
}

export const supabaseMock = {
  from: vi.fn((table: string) => builder(table)),
  rpc: vi.fn(async () => ({ data: null, error: null })),
  auth: {
    getUser: vi.fn(async () => ({ data: { user: { id: "user-test-1" } }, error: null })),
  },
};

export function seedDefaultCase() {
  mockTables["casos_clinicos"] = [
    { id: 1, nome: "Acidose metabólica", especie: "Canino", condicoes: { nome: "Acidose", descricao: "x" } },
  ];
  mockTables["parametros"] = [
    { id: 1, nome: "pH", unidade: "", valor_minimo: 7.35, valor_maximo: 7.45, descricao: null },
    { id: 2, nome: "PaCO2", unidade: "mmHg", valor_minimo: 35, valor_maximo: 45, descricao: null },
    { id: 3, nome: "SemFaixa", unidade: null, valor_minimo: null, valor_maximo: null, descricao: null },
  ];
  mockTables["valores_iniciais_caso"] = [
    { id_caso: 1, id_parametro: 1, valor: 7.2 },
    { id_caso: 1, id_parametro: 2, valor: 30 },
  ];
  mockTables["parametros_secundarios_caso"] = [];
  mockTables["tratamentos_caso"] = [];
  mockTables["simulation_sessions"] = [{ id: "session-test-1" }];
  mockTables["session_history"] = [];
  mockTables["session_decisions"] = [];
}
