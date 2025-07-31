// Tipos para a funcionalidade de IA
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { firestore } from './firebaseConfig';

interface Message {
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
    };
  };
  transcription?: string;
  key?: {
    fromMe?: boolean;
  };
}

interface QuestaoIA {
  texto: string;
  tipo: 'objetiva' | 'discursiva';
  alternativas?: Array<{
    texto: string;
    correta: boolean;
  }>;
  respostaCorreta?: string;
}

interface RespostaIA {
  questoes: QuestaoIA[];
}

interface UsageMeta {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}
async function verifica_se_pode_usar_ia(key_google: string): Promise<boolean> {
  const ref = doc(firestore, 'config', 'l2I9QyMBvi9uUx2dpeNo');
  const snap = await getDoc(ref);
  const data = snap.data();

  const iaToken: any = data?.iaToken?.[key_google];
  if (!iaToken) return false;

  const now = Date.now();

  // --- Tokens por minuto ---
  const lastTpmReset   = Number(iaToken.lastTpmReset) || 0;
  const currentTpm     = (now - lastTpmReset < 60_000) ? Number(iaToken.tpm) || 0 : 0;

  // --- Requisições por minuto ---
  const lastRpmReset   = Number(iaToken.lastRpmReset) || 0;
  const currentRpm     = (now - lastRpmReset < 60_000) ? Number(iaToken.rpm) || 0 : 0;

  // --- Requisições por dia ---
  const lastRpdReset   = Number(iaToken.lastRpdReset) || 0;
  const currentRpd     = (now - lastRpdReset < 86_400_000) ? Number(iaToken.rpd) || 0 : 0;

  const dentroLimites = currentTpm < 1_000_000 && currentRpm < 15 && currentRpd < 1_500;
  return dentroLimites;
}

// --- NOVO: devolve uma key que esteja dentro dos limites, priorizando a fornecida ---
async function getAvailableKey(preferred?: string): Promise<string | null> {
  const ref = doc(firestore, 'config', 'l2I9QyMBvi9uUx2dpeNo');
  const snap = await getDoc(ref);
  const data = snap.data();
  const iaObj: any = data?.iaToken || {};

  const now = Date.now();

  const keys = Object.keys(iaObj);
  console.log('IA keys disponíveis:', keys);
  if (preferred && keys.includes(preferred)) {
    keys.sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : 0));
  }

  for (const k of keys) {
    const tok = iaObj[k];
    if (!tok) continue;

    const lastTpmReset = Number(tok.lastTpmReset) || 0;
    const currentTpm = (now - lastTpmReset < 60_000) ? Number(tok.tpm) || 0 : 0;

    const lastRpmReset = Number(tok.lastRpmReset) || 0;
    const currentRpm = (now - lastRpmReset < 60_000) ? Number(tok.rpm) || 0 : 0;

    const lastRpdReset = Number(tok.lastRpdReset) || 0;
    const currentRpd = (now - lastRpdReset < 86_400_000) ? Number(tok.rpd) || 0 : 0;

    const within = currentTpm < 1_000_000 && currentRpm < 15 && currentRpd < 1_500;
    console.log(`Avaliação key ${k} -> tpm:${currentTpm} rpm:${currentRpm} rpd:${currentRpd} dentroLimites:${within}`);
    if (within) {
      console.log('Key selecionada:', k);
      return k;
    }
  }

  console.log('Nenhuma key disponível dentro dos limites');
  return null; // nenhuma disponível
}
async function salvarToken(key_google: string, usage: UsageMeta) {
  const ref = doc(firestore,'config','l2I9QyMBvi9uUx2dpeNo');
  const snap = await getDoc(ref);

  const tokensUsed = usage.totalTokenCount ?? 0;

  const update = (prev: any = {}) => {
    const now = Date.now();

    // Lógica para Tokens Por Minuto (tpm)
    const lastTpmReset = Number(prev.lastTpmReset) || 0;
    let currentTpm = tokensUsed;
    if (now - lastTpmReset < 60_000) { // Se ainda estiver no mesmo minuto (60 segundos)
      currentTpm += Number(prev.tpm) || 0;
    }

    // Lógica para Requisições Por Minuto (rpm) - NOVO CAMPO
    const lastRpmReset = Number(prev.lastRpmReset) || 0;
    let currentRpm = 1; // A requisição atual conta como 1
    if (now - lastRpmReset < 60_000) { // Se ainda estiver no mesmo minuto (60 segundos)
      currentRpm += Number(prev.rpm) || 0;
    }

    // Lógica para Requisições Por Dia (rpd) - COM RESET DIÁRIO
    const lastRpdReset = Number(prev.lastRpdReset) || 0;
    let currentRpd = 1; // A requisição atual conta como 1
    // Verifica se 24 horas (1 dia) se passaram desde o último reset
    if (now - lastRpdReset < 86_400_000) { // 24 horas * 60 minutos * 60 segundos * 1000 milissegundos
      currentRpd += Number(prev.rpd) || 0;
    }

    return {
      tpm: currentTpm,
      lastTpmReset: now, // Atualiza o timestamp para a requisição atual
      rpm: currentRpm, // Novo campo para requisições por minuto
      lastRpmReset: now, // Atualiza o timestamp para a requisição atual
      ttotal: (Number(prev.ttotal) || 0) + tokensUsed,
      rpd: currentRpd,
      lastRpdReset: now, // Atualiza o timestamp para a requisição atual
      rtotal: (Number(prev.rtotal) || 0) + 1,
    };
  };

  // Atualiza / cria métricas no Firestore
  let data: any = {};
  if (snap.exists()) data = snap.data();

  const iaObj: any = data.iaToken || {};
  iaObj[key_google] = update(iaObj[key_google]);

  await setDoc(ref, { iaToken: iaObj }, { merge: true });
}
// Função para gerar questões usando IA
async function gerarQuestoesIA(
  materia: string,
  tema: string,
  nivel: 'facil' | 'medio' | 'dificil',
  quantidade: number,
  tipoQuestao: 'objetiva' | 'discursiva' | 'mista',
  instrucoes?: string,
  key_google?: string
): Promise<QuestaoIA[]> {
  try {
    // 1. Selecionar chave válida
    let maybeKey: string | null | undefined = key_google || (await AsyncStorage.getItem('iaKey')) || undefined;

    if (maybeKey && !(await verifica_se_pode_usar_ia(maybeKey))) {
      maybeKey = null;
    }

    if (!maybeKey) {
      maybeKey = await getAvailableKey();
    }

    if (!maybeKey) {
      Alert.alert('Limite atingido', 'Nenhuma chave de IA disponível no momento.');
      throw new Error('No available key');
    }

    console.log('Usando IA key:', maybeKey);
    // Salva chave escolhida para reutilização
    const apiKey = maybeKey as string;

    await AsyncStorage.setItem('iaKey', apiKey);

    const prompt = `Você é uma IA especialista na elaboração de avaliações escolares.

Objetivo:
Crie exatamente ${quantidade} questões de ${materia} sobre ${tema} no nível de dificuldade ${nivel}.

Regras de composição:
${tipoQuestao === 'objetiva' ? 
`• Todas as questões DEVEM ser objetivas.
• Cada questão deve conter exatamente 4 alternativas.
• NÃO inclua letras, números ou quaisquer rótulos (ex.: "A)", "B)", "1.") antes do texto das alternativas.
• Apenas UMA alternativa deve ter "correta": true.` : ''}
${tipoQuestao === 'discursiva' ? 
'• Todas as questões DEVEM ser discursivas.' : ''}
${tipoQuestao === 'mista' ? 
'• Produza uma mistura equilibrada entre questões objetivas (com 4 alternativas) e discursivas, seguindo as regras acima.' : ''}
${instrucoes ? `• Instruções adicionais do professor: ${instrucoes}` : ''}

Formato de saída:
• Retorne APENAS um objeto JSON válido, sem explicações antes ou depois.
• Utilize exatamente a estrutura abaixo, mantendo nomes de chaves em português e em minúsculas.
• Certifique-se de que o JSON esteja bem-formado (sem vírgulas pendentes, aspas incorretas, etc.).

Estrutura esperada:
{
  "questoes": [
    {
      "texto": "Texto da questão",
      "tipo": "objetiva|discursiva",
      "alternativas": [
        { "texto": "Texto da alternativa 1", "correta": true },
        { "texto": "Texto da alternativa 2", "correta": false },
        { "texto": "Texto da alternativa 3", "correta": false },
        { "texto": "Texto da alternativa 4", "correta": false }
      ],
      "respostaCorreta": "Resposta esperada (apenas para discursivas)"
    }
  ]
}

Observações:
• Para questões discursivas, deixe "alternativas": [] e preencha "respostaCorreta".
• Não inclua rótulos (A, B, C, D, 1, 2, 3, 4) nos textos das alternativas.

IMPORTANTE: Responda SOMENTE com o JSON final, nada mais.`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resposta.json();
    if (!resposta.ok || data.error) {
      Alert.alert('Erro', 'Falha na requisição da IA, tente novamente mais tarde');
    }

    const usotoken = data?.usageMetadata;
    if (usotoken) {
      salvarToken(apiKey, usotoken);
    }
    console.log('usage', usotoken);
    const textoResposta = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoResposta) {
      Alert.alert('IA em manutenção, tente novamente mais tarde');
    }

    // Tentar extrair JSON da resposta
    const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      Alert.alert('IA em manutenção, tente novamente mais tarde');
    }

    const respostaIA: RespostaIA = JSON.parse(jsonMatch[0]);
    return respostaIA.questoes || [];

  } catch (error) {
    console.error('Erro ao gerar questões com IA:', error);
    throw error;
  }
}

// Função para corrigir questões discursivas usando IA
interface DiscursivaCorrigir {
  id: string;
  texto: string;
  respostaCorreta: string;
  respostaAluno: string;
}

interface ResultadoCorrecao {
  id: string;
  nota: number; // 0-10
  comentario?: string;
}

async function corrigirDiscursivasIA(questoes: DiscursivaCorrigir[], key_google?: string): Promise<ResultadoCorrecao[]> {
  // Selecionar chave válida
  let maybeKey: string | null | undefined = key_google || (await AsyncStorage.getItem('iaKey')) || undefined;

  if (maybeKey && !(await verifica_se_pode_usar_ia(maybeKey))) {
    maybeKey = null;
  }

  if (!maybeKey) {
    maybeKey = await getAvailableKey();
  }

  if (!maybeKey) {
    Alert.alert('Limite atingido', 'Nenhuma chave de IA disponível no momento.');
    throw new Error('No available key');
  }

  const apiKey = maybeKey as string;
  await AsyncStorage.setItem('iaKey', apiKey);

  const prompt = `Você é um corretor de provas. Avalie cada questão discursiva atribuindo uma nota de 0 a 10, onde 0 significa totalmente incorreto e 10 totalmente correto. Considere parcialmente correto se a resposta contiver elementos corretos. Responda no formato JSON conforme exemplo.

Exemplo de formato de resposta:
{
  "resultados": [
    { "id": "q1", "nota": 8, "comentario": "Resposta boa, mas faltou citar X." },
    { "id": "q2", "nota": 10 }
  ]
}

Questões a corrigir:
${questoes.map(q=>`ID: ${q.id}\nEnunciado: ${q.texto}\nGabarito: ${q.respostaCorreta}\nResposta do aluno: ${q.respostaAluno}`).join('\n---\n')}`;

  const payload = {
    contents: [ { parts: [ { text: prompt } ] } ]
  };

  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await resposta.json();
  const usotoken = data?.usageMetadata;
  if (usotoken) {
    salvarToken(apiKey, usotoken);
  }
  console.log('usage', usotoken);
  if (!resposta.ok || data.error) {
    Alert.alert('Erro', 'Falha na requisição da IA, tente novamente mais tarde');
  }
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) Alert.alert('IA em manutenção, tente novamente mais tarde');
  const jsonMatch = texto.match(/\{[\s\S]*\}/);
  if (!jsonMatch) Alert.alert('IA em manutenção, tente novamente mais tarde');
  const obj = JSON.parse(jsonMatch[0]);
  return obj.resultados||[];
}

export { corrigirDiscursivasIA, gerarQuestoesIA };
export type { DiscursivaCorrigir, QuestaoIA, RespostaIA, ResultadoCorrecao };

