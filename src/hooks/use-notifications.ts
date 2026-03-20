import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Verifica se está rodando no app Android (não no navegador)
const isNative = () => Capacitor.isNativePlatform();

// ─── Notificações Push (Firebase FCM) ───────────────────────────────────────

export function useSetupPushNotifications() {
  useEffect(() => {
    if (!isNative()) return; // no navegador não faz nada

    const setup = async () => {
      // Pede permissão ao usuário
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      // Registra no Firebase FCM
      await PushNotifications.register();

      // Salva o token FCM no Supabase para enviar notificações depois
      PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token:', token.value);
        // TODO: salvar token.value na tabela "device_tokens" do Supabase
        // Ex: supabase.from('device_tokens').upsert({ user_id, token: token.value })
      });

      // Notificação recebida com o app aberto
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notificação recebida:', notification);
      });

      // Usuário clicou na notificação
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        console.log('Clicou na notificação:', data);
        // TODO: navegar para a tela correta baseado em data.route
        // Ex: if (data.route === '/batalha') router.push('/batalha')
      });
    };

    setup();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
}

// ─── Notificações Locais (agendadas no celular) ──────────────────────────────

export async function agendarMissaoDiaria() {
  if (!isNative()) return;

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(9, 0, 0, 0); // todo dia às 9h da manhã

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1001,
        title: 'Naruto Clash',
        body: 'Suas missões diárias estão disponíveis! Não perca as recompensas.',
        schedule: { at: amanha, repeats: true, every: 'day' },
        sound: undefined,
        smallIcon: 'ic_stat_naruto',
        iconColor: '#FF6200',
      },
    ],
  });
}

export async function notificarDesafio(nomeJogador: string) {
  if (!isNative()) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 9000) + 1000,
        title: 'Desafio recebido!',
        body: `${nomeJogador} te desafiou para uma batalha!`,
        schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo de delay
        smallIcon: 'ic_stat_naruto',
        iconColor: '#FF6200',
      },
    ],
  });
}

// ─── Vibração (Haptics) ──────────────────────────────────────────────────────

// Use nos momentos de impacto na batalha
export async function vibrarImpacto() {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function vibrarVitoria() {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
  setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 200);
  setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 400);
}

export async function vibrarDerrota() {
  if (!isNative()) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
}
