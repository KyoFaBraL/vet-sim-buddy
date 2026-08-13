/**
 * Traduz erros de autenticação para mensagens claras em português.
 * Importante em turmas grandes: quando muitos alunos criam conta ao mesmo tempo
 * na mesma rede Wi-Fi, o backend aplica limite anti-abuso (HTTP 429) e é preciso
 * orientar o aluno a aguardar em vez de mostrar um erro técnico.
 */
export function getAuthErrorMessage(error: any): string {
  const status = error?.status ?? error?.code;
  const raw: string = error?.message ?? "";
  const msg = raw.toLowerCase();

  if (status === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitos acessos simultâneos nesta rede. Aguarde cerca de 1 minuto e tente novamente, ou use os dados móveis do celular.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Este email já está cadastrado. Por favor, faça login.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Email ou senha incorretos. Verifique os dados e tente novamente.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  }
  if (msg.includes("password should be at least")) {
    return "A senha deve ter no mínimo 6 caracteres.";
  }
  if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  return raw || "Ocorreu um erro inesperado. Tente novamente.";
}
