// Camada de abstração do provedor de autenticação social.
// A UI deve importar apenas `authProvider` deste módulo — a dependência concreta
// de infraestrutura fica isolada aqui, facilitando substituição futura.

import { lovable as managedAuth } from "../lovable/index";

export type OAuthProvider = "google" | "apple" | "microsoft";

export type OAuthSignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const authProvider = {
  /**
   * Inicia o fluxo OAuth gerenciado. Quando o navegador é redirecionado,
   * retorna `{ redirected: true }`; caso contrário a sessão já foi definida.
   */
  signInWithOAuth: (provider: OAuthProvider, options?: OAuthSignInOptions) =>
    managedAuth.auth.signInWithOAuth(provider, options),
};

export default authProvider;
