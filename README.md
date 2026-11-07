# 🧺 CleanWash Lavanderia — Local Notifications

> **PDM II · Aluno 28 · Recursos de Hardware**
> Aplicativo Android com **notificações locais** usando `@capacitor/local-notifications`, construído com React + Vite e empacotado via Capacitor.

---

## 📱 Demonstração

<div align="center">
  <video src="showcaseM.mp4" controls width="320" style="border-radius:12px"></video>

  > *Veja o app em ação: permissão, notificação imediata, agendamento e cancelamento.*
</div>

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🔐 **Permissão Nativa** | Solicita `POST_NOTIFICATIONS` (Android 13+) via diálogo do sistema |
| 🚀 **Notificação Imediata** | Dispara alerta instantâneo na barra de status |
| ⏰ **Agendamento Futuro** | Agenda notificação para +5s / +10s / +15s / +30s ou valor customizado |
| 💡 **Número da Gaveta** | Campo extra incluído no corpo de todas as notificações (Desafio Extra) |
| 📋 **Gerenciar Pendentes** | Lista e cancela todas as notificações agendadas em aberto |
| 🖥️ **Console de Status** | Painel em tempo real com histórico das últimas 8 ações |
| 🌙 / ☀️ **Tema Dark/Light** | Alterna entre tema escuro e claro |

---

## 🛠️ Stack Tecnológica

- **React 19** — interface declarativa
- **Vite 8** — bundler e dev server
- **Capacitor 8** — ponte nativa Web → Android
- **`@capacitor/local-notifications` v8.3.1** — API de notificações locais
- **GitHub Actions** — CI/CD com build de APK de debug automático

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 22+
- Android Studio + Android SDK 36
- Java 21

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Build do projeto web
npm run build

# 3. Sincronizar com o projeto Android
npx cap sync android

# 4. Abrir no Android Studio
npx cap open android
```

> No Android Studio, clique em **▶ Run** para instalar no emulador ou dispositivo físico.

---

## 📦 Build via GitHub Actions

O repositório possui um workflow de CI/CD configurado em [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) que:

1. Instala dependências (`npm ci`)
2. Faz o build Vite (`npm run build`)
3. Instala Android SDK 36 e aceita licenças
4. Executa `npx cap sync android`
5. Compila o APK de debug via Gradle
6. Publica o `.apk` como artefato por **7 dias**

O APK é gerado automaticamente em cada push para `main`/`master`.

---

## 📂 Estrutura do Projeto

```
├── src/
│   ├── App.jsx          # Componente principal com toda a lógica
│   ├── App.css          # Estilos (tema dark/light)
│   └── main.jsx         # Entry point React
├── android/             # Projeto Android nativo (Capacitor)
├── public/              # Assets estáticos
├── .github/workflows/   # Pipeline CI/CD
├── capacitor.config.json
├── vite.config.js
└── showcaseM.mp4        # Vídeo de demonstração
```

---

## 🔔 Como Funcionam as Notificações

```js
// Notificação imediata
await LocalNotifications.schedule({
  notifications: [{
    title: 'CleanWash Lavanderia 🧺',
    body: `Suas 5 camisas estão prontas! Gaveta: ${gaveta}`,
    id: 280,
    extra: { tipo: 'pronto', gaveta, pecas: 5 },
  }]
});

// Notificação agendada
const dataAlvo = new Date(Date.now() + segundos * 1000);
await LocalNotifications.schedule({
  notifications: [{
    title: 'CleanWash Lavanderia ⏰',
    body: `Sua roupa está pronta! Gaveta: ${gaveta}`,
    id: idUnico,
    schedule: { at: dataAlvo },
  }]
});
```

---

## 📋 Permissões Android

O app requer a permissão `POST_NOTIFICATIONS` (obrigatória no Android 13+).  
O botão **"🔔 Ativar Permissão"** abre o diálogo nativo do sistema operacional para concessão em tempo de execução.

---

## 👤 Autor

**Aluno 28** — PDM II  
App ID: `com.aluno28.cleanwash`

---

<div align="center">
  <sub>Feito com ❤️ usando React + Capacitor + Local Notifications</sub>
</div>
