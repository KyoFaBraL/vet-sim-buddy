import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Parâmetro authorization_id ausente.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {error ? (
          <>
            <CardHeader>
              <CardTitle>Não foi possível continuar</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </>
        ) : !details ? (
          <CardHeader>
            <CardTitle>Carregando…</CardTitle>
            <CardDescription>Verificando a solicitação de autorização.</CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <CardTitle>
                Conectar {details.client?.name ?? "aplicativo"} à sua conta VetBalance
              </CardTitle>
              <CardDescription>
                Isso permite que {details.client?.name ?? "o aplicativo"} acesse seus casos,
                simulações e desempenho no VetBalance em seu nome.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                Aprovar
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => decide(false)}
                className="flex-1"
              >
                Negar
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
