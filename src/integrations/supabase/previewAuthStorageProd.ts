/**
 * Substituto de produção para o adaptador de armazenamento de sessão usado
 * apenas no ambiente de pré-visualização/edição.
 *
 * Em produção não existe janela hospedeira com a qual negociar a sessão, então
 * o cliente de autenticação usa o armazenamento padrão do navegador
 * (localStorage). Retornar `undefined` faz o SDK aplicar esse padrão.
 */
export function brokeredPreviewStorage(): undefined {
  return undefined;
}
