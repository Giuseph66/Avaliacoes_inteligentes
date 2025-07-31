import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { handleFirestoreError } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StatusBar, StyleSheet } from 'react-native';

interface Livro {
  id: string;
  titulo: string;
  autor?: string;
  progresso?: number; // 0-100
  concluido?: boolean;
  ultimaLeitura?: Date;
  pdfUri?: string;
}

export default function LivrosDeEstudoScreen() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState<any>(null);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    let unsub: any;
    (async () => {
      const data = await AsyncStorage.getItem('usuarioLogado');
      if (!data) { setLoading(false); return; }
      const user = JSON.parse(data);
      setAluno(user);

      const q = query(
        collection(firestore, 'livros'),
        where('usuarioId', '==', user.id)
      );

      unsub = onSnapshot(
        q,
        snap => {
          const arr: Livro[] = snap.docs.map(d => {
            const rd: any = d.data();
            return {
              id: d.id,
              titulo: rd.titulo || 'Sem título',
              autor: rd.autor || 'Desconhecido',
              progresso: rd.progresso ?? 0,
              concluido: rd.concluido ?? false,
              pdfUri: rd.pdfUri,
              ultimaLeitura: rd.ultimaLeitura ? rd.ultimaLeitura.toDate() : undefined
            };
          });
          setLivros(arr);
          setLoading(false);
        },
        error => handleFirestoreError(error, 'ouvir livros de estudo')
      );
    })();
    return () => unsub && unsub();
  }, []);

  if (loading) {
    return (
      <ThemedView style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }]}>        
        <ActivityIndicator size="large" color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
        <ThemedText style={[styles.loadingText, { color: theme.colors.text }]}>Carregando livros...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#e0e0e0' }]}>        
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <ThemedText type="title" style={[styles.headerTitle, { color: theme.colors.text }]}>Livros de Estudo
        </ThemedText>
        <Pressable onPress={() => router.push({ pathname: '/aluno/cadas_livros' } as any)}>
          <Ionicons name="add-circle" size={24} color={theme.colors.text} />
        </Pressable>
      </ThemedView>

      <FlatList
        data={livros}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={[styles.emptyState, { backgroundColor: theme.dark ? '#1a1a1a' : '#fafafa' }]}>            
            <Ionicons name="book-outline" size={48} color={theme.dark ? '#666' : '#999'} />
            <ThemedText style={[styles.emptyText, { color: theme.dark ? '#aaa' : '#666' }]}>Nenhum livro cadastrado</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.dark ? '#888' : '#999' }]}>Adicione livros para começar seus estudos</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.pdfUri) {
                router.push({
                  pathname: '/aluno/pdf-viewer',
                  params: { uri: item.pdfUri }
                } as any);
              } else {
                // Mostrar alerta se não houver PDF
                Alert.alert('Erro', 'PDF não disponível para este livro');
              }
            }}
          >
            <ThemedView style={[styles.card, { backgroundColor: theme.dark ? '#1a1a1a' : '#fafafa', borderColor: theme.dark ? '#333' : '#e0e0e0' }]}>              
              <ThemedView style={styles.cardHeader}>
                <Ionicons name="book" size={20} color={theme.colors.primary} />
                <ThemedText style={[styles.cardTitle, { color: theme.colors.text }]}>{item.titulo}</ThemedText>
              </ThemedView>
              <ThemedText style={[styles.cardAuthor, { color: theme.dark ? '#aaa' : '#666' }]}>{item.autor}</ThemedText>
              <ThemedView style={styles.cardFooter}>
                <ThemedText style={[styles.cardProgress, { color: theme.dark ? '#ccc' : '#444' }]}>                  {item.concluido ? 'Concluído' : `${item.progresso}% concluído`}                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </ThemedView>
            </ThemedView>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardAuthor: { fontSize: 14, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardProgress: { fontSize: 14, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ddd' },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '500', textAlign: 'center' },
  emptySubtext: { marginTop: 8, fontSize: 14, textAlign: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});
