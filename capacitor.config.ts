import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.narutoclash',
  appName: 'Naruto Clash',
  webDir: 'out',

  // Quando estiver desenvolvendo, aponta para o site ao vivo
  // Remova o "server" abaixo quando for gerar o APK final para distribuição
  server: {
    url: 'https://narutoclash.com.br',
    cleartext: false,
  },

  android: {
    // Cor da barra de status do Android (topo da tela)
    backgroundColor: '#0d0d0d',
    // Permite que o app use a tela toda (esconde barra de navegação)
    allowMixedContent: false,
  },

  plugins: {
    // Configuração das notificações push (Firebase FCM)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Notificações locais agendadas (ex: missão diária disponível)
    LocalNotifications: {
      smallIcon: 'ic_stat_naruto', // ícone da notificação (adicionar em res/drawable)
      iconColor: '#FF6200',        // laranja do Naruto Clash
      sound: 'beep.wav',           // som opcional
    },
  },
};

export default config;
