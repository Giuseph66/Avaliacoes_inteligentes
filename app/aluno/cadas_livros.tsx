import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export default function CadastrarLivroScreen() {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [pdfDoc, setPdfDoc] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('usuarioLogado');
      if (data) {
        const user = JSON.parse(data);
        setUserId(user.id);
      }
    })();
  }, []);

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (res.canceled === false) {
      setPdfDoc(res.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'O título é obrigatório.');
      return;
    }
    
    if (!pdfDoc) {
      Alert.alert('Atenção', 'É necessário selecionar um arquivo PDF.');
      return;
    }
    
    setLoading(true);
    try {
      // Salvar PDF em storage local do app e obter URI
      const dir = FileSystem.documentDirectory + 'livros/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const fileName = `${userId}_${Date.now()}.pdf`;
      const destUri = dir + fileName;
      await FileSystem.copyAsync({ from: pdfDoc.uri, to: destUri });

      // Grava no Firestore
      await addDoc(collection(firestore, 'livros'), {
        usuarioId: userId,
        titulo: titulo.trim(),
        autor: autor.trim() || 'Desconhecido',
        progresso: 0,
        concluido: false,
        ultimaLeitura: null,
        pdfUri: destUri,
        criadoEm: serverTimestamp(),
      });
      
      Alert.alert('Sucesso', 'Livro cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro ao cadastrar livro:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o livro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView
        style={[
          styles.container,
          { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.colors.text }]}>Salvando livro...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      <View style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#e0e0e0' }]}>        
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <ThemedText type="title" style={[styles.title, { color: theme.colors.text }]}>Cadastrar Livro</ThemedText>
      </View>

      <ThemedText style={[styles.label, { color: theme.colors.text }]}>Título*</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: theme.dark ? '#555' : '#ccc', color: theme.colors.text }]}
        placeholder="Digite o título"
        placeholderTextColor={theme.dark ? '#888' : '#999'}
        value={titulo}
        onChangeText={setTitulo}
      />

      <ThemedText style={[styles.label, { color: theme.colors.text }]}>Autor</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: theme.dark ? '#555' : '#ccc', color: theme.colors.text }]}
        placeholder="Digite o autor"
        placeholderTextColor={theme.dark ? '#888' : '#999'}
        value={autor}
        onChangeText={setAutor}
      />

      <ThemedText style={[styles.label, { color: theme.colors.text }]}>PDF do Livro*</ThemedText>
      <Pressable onPress={pickPdf} style={[styles.pdfButton, { borderColor: theme.colors.primary, backgroundColor: pdfDoc ? (theme.dark ? '#1a1a1a' : '#f8f9fa') : 'transparent' }]}>        
        <ThemedView style={styles.pdfButtonContent}>
          <Ionicons name={pdfDoc ? "document" : "document-outline"} size={20} color={theme.colors.primary} />
          <ThemedText style={[styles.pdfButtonText, { color: theme.colors.primary }]}>
            {pdfDoc?.name || 'Selecionar PDF'}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleSubmit}
      >
        <ThemedText style={styles.buttonText}>Salvar</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pdfButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  pdfButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
