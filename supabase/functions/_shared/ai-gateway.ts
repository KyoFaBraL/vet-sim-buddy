// Camada de abstração do gateway de IA.
// Todas as edge functions devem consumir o modelo de linguagem apenas por aqui,
// nunca referenciando diretamente a URL ou o nome do provedor de infraestrutura.

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Modelo padrão usado nas camadas explicativas do simulador. */
export const AI_DEFAULT_MODEL = "google/gemini-2.5-flash";

/** Lê a credencial do gateway de IA a partir do ambiente do servidor. */
export function getAiGatewayKey(): string | undefined {
  return Deno.env.get("LOVABLE_API_KEY") ?? undefined;
}

/** Igual a getAiGatewayKey(), mas falha explicitamente quando não configurada. */
export function requireAiGatewayKey(): string {
  const key = getAiGatewayKey();
  if (!key) throw new Error("AI gateway key is not configured");
  return key;
}

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AiChatOptions {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  apiKey?: string;
}

/**
 * Executa uma chamada de chat completion no gateway de IA.
 * Retorna a resposta HTTP crua para que cada função trate erros/streams como precisar.
 */
export function aiChatRequest({
  messages,
  model = AI_DEFAULT_MODEL,
  temperature,
  apiKey,
}: AiChatOptions): Promise<Response> {
  const key = apiKey ?? requireAiGatewayKey();
  return fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(temperature !== undefined ? { temperature } : {}),
    }),
  });
}

/** Extrai o conteúdo textual da primeira escolha de uma resposta de chat completion. */
export function extractAiText(data: unknown): string {
  // deno-lint-ignore no-explicit-any
  return (data as any)?.choices?.[0]?.message?.content ?? "";
}

/** Extrai o primeiro objeto JSON contido em um texto gerado pelo modelo. */
export function extractAiJson<T = unknown>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response does not contain valid JSON");
  return JSON.parse(match[0]) as T;
}
