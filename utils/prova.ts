import { encode as btoa } from 'base-64';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from './firebaseConfig';

export async function salvarProva({ prova, professor }: { prova: any, professor: any }) {
  // Apenas codifica em base64 (sem AES)
  const dadosProva = JSON.stringify(prova);

  function utf8ToBase64(str: string) {
    return require('base-64').encode(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }

  const provaCriptografada = utf8ToBase64(dadosProva);

  await addDoc(collection(firestore, 'provas'), {
    provaCriptografada,
    professor,
    criadoEm: new Date()
  });
} 