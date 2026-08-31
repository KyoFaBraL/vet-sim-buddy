import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VetBalanceLogo } from "./VetBalanceLogo";

/** Domínio em manutenção — os acessos são encaminhados para o domínio ativo. */
const MAINTENANCE_HOSTS = ["vetbalance.app.br", "www.vetbalance.app.br"];
const TARGET_ORIGIN = "https://vetbalance.app";
const REDIRECT_SECONDS = 5;

export const isMaintenanceHost = () =>
  typeof window !== "undefined" &&
  MAINTENANCE_HOSTS.includes(window.location.hostname.toLowerCase());

export const MaintenanceNotice = () => {
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const target = `${TARGET_ORIGIN}${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s - 1), 1000);
    const go = setTimeout(() => window.location.replace(target), REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [target]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="text-center space-y-4">
          <VetBalanceLogo className="mx-auto h-16 w-16 object-contain" />
          <CardTitle className="text-2xl">Site em manutenção</CardTitle>
          <CardDescription>
            O endereço <strong>vetbalance.app.br</strong> está temporariamente em manutenção.
            O simulador continua disponível em <strong>vetbalance.app</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Você será redirecionado automaticamente em {Math.max(seconds, 0)}s.
          </p>
          <Button className="w-full" size="lg" onClick={() => window.location.replace(target)}>
            Ir para vetbalance.app agora
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};
