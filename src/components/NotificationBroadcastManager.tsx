import { useEffect, useState } from 'react';
import { Megaphone, Send, XCircle, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SUS_DEADLINE_LABEL } from '@/constants/susItems';

interface BroadcastRow {
  id: string;
  titulo: string;
  mensagem: string;
  url: string | null;
  criado_em: string;
}

const DEFAULT_TITULO = 'VetBalance — Questionário SUS';
const DEFAULT_MENSAGEM = `Falta preencher o questionário de satisfação (SUS) do VetBalance. Prazo: ${SUS_DEADLINE_LABEL}. Toque para responder agora.`;

export const NotificationBroadcastManager = () => {
  const [titulo, setTitulo] = useState(DEFAULT_TITULO);
  const [mensagem, setMensagem] = useState(DEFAULT_MENSAGEM);
  const [url, setUrl] = useState('https://vetbalance.app.br/app');
  const [horas, setHoras] = useState('72');
  const [ativo, setAtivo] = useState<BroadcastRow | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from('notification_broadcasts')
      .select('id, titulo, mensagem, url, criado_em')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    setAtivo((data as BroadcastRow) ?? null);
  };

  useEffect(() => {
    load();
  }, []);

  const publicar = async () => {
    setEnviando(true);
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      const { data, error } = await supabase.rpc('create_notification_broadcast', {
        p_titulo: titulo,
        p_mensagem: mensagem,
        p_url: url.trim() || null,
        p_duracao_horas: Number(horas) || 72,
      });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string } | null;
      if (!result?.success) throw new Error(result?.error ?? 'falha');
      toast({
        title: 'Aviso publicado',
        description:
          'Todos os usuários que abrirem o VetBalance receberão a notificação do navegador (uma vez por dispositivo).',
      });
      await load();
    } catch (err) {
      console.error('Erro ao publicar aviso:', err);
      toast({
        title: 'Erro ao publicar aviso',
        description: 'Verifique se você está autenticado como administrador e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  const encerrar = async () => {
    setEnviando(true);
    try {
      const { error } = await supabase.rpc('deactivate_notification_broadcasts');
      if (error) throw error;
      toast({ title: 'Aviso encerrado', description: 'Novos acessos não receberão mais a notificação.' });
      await load();
    } catch (err) {
      console.error('Erro ao encerrar aviso:', err);
      toast({ title: 'Erro ao encerrar aviso', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Aviso global por notificação do navegador
        </CardTitle>
        <CardDescription>
          Publica um aviso para <strong>todos</strong> os usuários que acessarem vetbalance.app.br. A
          notificação do navegador é exibida na primeira visita após a publicação (em quem já autorizou
          notificações); quem não autorizou vê o aviso dentro do aplicativo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ativo && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Bell className="h-3 w-3" />
                Aviso ativo
              </Badge>
              <span className="text-xs text-muted-foreground">
                publicado em {new Date(ativo.criado_em).toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="mt-2 font-semibold">{ativo.titulo}</p>
            <p className="text-muted-foreground">{ativo.mensagem}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="broadcast-titulo">Título</Label>
            <Input
              id="broadcast-titulo"
              value={titulo}
              maxLength={120}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="broadcast-msg">Mensagem</Label>
            <Textarea
              id="broadcast-msg"
              rows={3}
              maxLength={400}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="broadcast-url">Link ao clicar (opcional)</Label>
            <Input
              id="broadcast-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vetbalance.app.br/app"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="broadcast-horas">Validade (horas)</Label>
            <Input
              id="broadcast-horas"
              type="number"
              min={1}
              max={720}
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={publicar} disabled={enviando || !titulo.trim() || !mensagem.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {enviando ? 'Publicando...' : 'Publicar aviso para todos'}
          </Button>
          {ativo && (
            <Button variant="outline" onClick={encerrar} disabled={enviando}>
              <XCircle className="h-4 w-4 mr-2" />
              Encerrar aviso ativo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
