# Prova Inteligente 📚🤖

Aplicativo mobile desenvolvido com Expo/React Native que auxilia professores e alunos durante todo o ciclo de aplicação de avaliações. Ele permite desde a criação automática de questões com IA até a correção e geração de relatórios, entregando uma experiência completa e segura de provas digitais.

## Sumário
- [Demonstração](#demonstração)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Primeiros passos](#primeiros-passos)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Builds com EAS](#builds-com-eas)
- [Configuração do Firebase](#configuração-do-firebase)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## Demonstração
Um APK de release (v1.0.2) já está incluído no repositório (`Prova Inteligente - 1_0_2.apk`). Basta transferir para o seu dispositivo Android e instalar manualmente para testar.

## Funcionalidades

### Professor
- Criar avaliações personalizadas
- Gerar questões automaticamente utilizando IA (OpenAI)
- Compartilhar sala de prova com QR-Code
- Corrigir respostas de forma automática e manual
- Visualizar resultados em tempo real e exportar PDF
- Emitir relatórios estatísticos

### Aluno
- Entrar na sala de prova de forma segura
- Responder questões objetivas e discursivas
- Ver histórico de avaliações e notas
- Receber feedback imediato após correção

## Tecnologias
- React Native 0.79 + Expo SDK 53
- TypeScript
- Expo Router 5 (rotas baseadas em arquivos)
- Firebase (Auth, Firestore, Storage, Realtime DB)
- Zustand (state management)
- React Navigation (pilha, abas e drawer)
- Expo Modules (Camera, Image Picker, Haptics, Web Browser, etc.)
- EAS Build & Submit

## Primeiros passos

1. Instale o `expo-cli` caso ainda não possua:
   ```bash
   npm install -g expo-cli
   ```

2. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/<seu-usuario>/Prova_AI.git
   cd Prova_AI
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm start            # ou npm run android / npm run ios / npm run web
   ```

4. Escaneie o QR-Code gerado com o aplicativo Expo Go (Android/iOS) ou execute em um emulador conforme o script utilizado.

## Scripts disponíveis

| Script                | Descrição                                      |
| --------------------- | ---------------------------------------------- |
| `npm start`           | Inicia o Metro bundler com Expo                |
| `npm run android`     | Compila e instala no emulador/dispositivo ADB  |
| `npm run ios`         | Executa a build no simulador iOS               |
| `npm run web`         | Abre o projeto na web                          |
| `npm run lint`        | Executa o ESLint                               |
| `npm run reset-project` | Restaura caches e limpa o projeto            |

## Estrutura de pastas (resumida)

```text
.
├── app/                  # Rotas (Expo Router)
│   ├── login.tsx
│   ├── cadastro.tsx
│   ├── professor/        # Fluxo do professor
│   └── aluno/            # Fluxo do aluno
├── components/           # Componentes reutilizáveis
├── utils/                # Funções auxiliares (Firebase, IA, PDF, etc.)
├── hooks/                # Hooks personalizados
├── assets/               # Imagens e fontes
├── scripts/              # Scripts utilitários (reset-project)
├── android/              # Projeto nativo Android (EAS)
├── ios/                  # Projeto nativo iOS (EAS)
└── ...
```

## Builds com EAS

Este projeto já contém um arquivo `eas.json` com três perfis de build:

- **development** – build com Dev Client
- **preview** – distribuição interna
- **production** – builds de loja com auto incremento de versão

Para gerar uma build, basta executar:

```bash
eas build --profile production --platform android
```

e seguir as instruções do EAS CLI.

## Configuração do Firebase

O arquivo `utils/firebaseConfig.js` contém as chaves de um projeto de demonstração. 
Para utilizar o seu próprio backend, crie um projeto no Firebase e substitua as chaves:

```js
// utils/firebaseConfig.js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Commit suas alterações: `git commit -m "feat: minha nova feature"`
4. Envie sua branch: `git push origin feature/sua-feature`
5. Abra um Pull Request

## Licença
Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
