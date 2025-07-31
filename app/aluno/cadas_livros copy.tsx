import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ActivityIndicator, TextInput, Pressable, StyleSheet, StatusBar, Alert } from 'react-native';
import { firestore } from '@/utils/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function CadastrarLivroScreen() {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
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

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'O título é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'livros'), {
        usuarioId: userId,
        titulo: titulo.trim(),
        autor: autor.trim() || 'Desconhecido',
        progresso: 0,
        concluido: false,
        ultimaLeitura: null,
        criadoEm: serverTimestamp(),
      });
      router.back();
    } catch (error: any) {
      console.error('Erro ao cadastrar livro:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o livro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }]}>        
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.colors.text }]}>Salvando livro...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      <ThemedView style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#e0e0e0' }]}>        
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </Pressable>
        <ThemedText type="title" style={[styles.title, { color: theme.colors.text }]}>Cadastrar Livro</ThemedText>
      </ThemedView>

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
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
