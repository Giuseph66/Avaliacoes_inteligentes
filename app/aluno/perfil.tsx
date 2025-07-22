import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { safeFirestoreOperation } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

export default function PerfilAluno() {
  const router = useRouter();
  const theme = useTheme();
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    media: '0',
    avaliacoes: 0,
    concluidas: 0,
    pendentes: 0,
    corrigidasIA: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await AsyncStorage.getItem('usuarioLogado');
      if (!data) {
        setLoading(false);
        router.replace('/login');
        return;
      }
      const user = JSON.parse(data);
      setAluno(user);

      // Buscar respostas do aluno
      const q = query(
        collection(firestore, 'respostas'),
        where('alunoId', '==', user.id)
      );
      const snap = await safeFirestoreOperation(() => getDocs(q), 'buscar respostas do aluno');
      if (!snap) {
        setLoading(false);
        return;
      }
      let somaNotas = 0;
      let totalNotas = 0;
      let concluidas = 0;
      let pendentes = 0;
      let corrigidasIA = 0;

      snap.docs.forEach((doc) => {
        const d: any = doc.data();
        if (d.notaGeral !== undefined && d.notaGeral !== null) {
          somaNotas += d.notaGeral;
          totalNotas++;
          concluidas++;
          if (d.corrigidoPorIA) corrigidasIA++;
        } else {
          pendentes++;
        }
      });

      setEstatisticas({
        media: totalNotas > 0 ? (somaNotas / totalNotas).toFixed(2) : '-',
        avaliacoes: snap.size,
        concluidas,
        pendentes,
        corrigidasIA,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !aluno) {
    return (
      <ThemedView style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
        <ThemedText style={[styles.loadingText, { color: theme.colors.text }]}>
          Carregando perfil...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Avatar e nome */}
        <View style={styles.avatarBox}>
          {aluno.avatar ? (
            <Image source={{ uri: aluno.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: theme.dark ? '#0a7ea4' : '#e0e0e0' }]}>
              <ThemedText style={[styles.avatarInitials, { color: theme.dark ? '#fff' : '#0a7ea4' }]}>
                {aluno.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </ThemedText>
            </View>
          )}
          <ThemedText style={[styles.nome, { color: theme.colors.text }]}>{aluno.nome}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.dark ? '#aaa' : '#666' }]}>{aluno.email}</ThemedText>
        </View>

        {/* Dados principais */}
        <View style={styles.infoBox}>
          <Ionicons name="school" size={20} color={theme.dark ? '#4a90e2' : '#0a7ea4'} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.infoText, { color: theme.colors.text }]}>
            Turma: <ThemedText style={styles.infoValue}>{aluno.turma || 'Não informado'}</ThemedText>
          </ThemedText>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={22} color="#ff9800" />
            <ThemedText style={styles.statValue}>{estatisticas.media}</ThemedText>
            <ThemedText style={styles.statLabel}>Média Geral</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={22} color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
            <ThemedText style={styles.statValue}>{estatisticas.avaliacoes}</ThemedText>
            <ThemedText style={styles.statLabel}>Avaliações</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-done" size={22} color="#4caf50" />
            <ThemedText style={styles.statValue}>{estatisticas.concluidas}</ThemedText>
            <ThemedText style={styles.statLabel}>Finalizadas</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={22} color="#ff9800" />
            <ThemedText style={styles.statValue}>{estatisticas.pendentes}</ThemedText>
            <ThemedText style={styles.statLabel}>Pendentes</ThemedText>
          </View>
        </View>

        {/* Correção por IA */}
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Ionicons name="sparkles" size={22} color="#7c4dff" />
            <ThemedText style={styles.statValue}>{estatisticas.corrigidasIA}</ThemedText>
            <ThemedText style={styles.statLabel}>Corrigidas por IA</ThemedText>
          </View>
        </View>

        {/* Preferências */}
        <View style={styles.prefBox}>
          <ThemedText type="subtitle" style={styles.prefTitle}>Preferências</ThemedText>
          <View style={styles.prefItem}>
            <Ionicons name={theme.dark ? 'moon' : 'sunny'} size={18} color={theme.dark ? '#ffd600' : '#0a7ea4'} />
            <ThemedText style={styles.prefLabel}>Modo {theme.dark ? 'Escuro' : 'Claro'}</ThemedText>
          </View>
          <View style={styles.prefItem}>
            <Ionicons name={aluno.notificacoes ? 'notifications' : 'notifications-off'} size={18} color={aluno.notificacoes ? '#4caf50' : '#e53935'} />
            <ThemedText style={styles.prefLabel}>Notificações por e-mail: {aluno.notificacoes ? 'Ativadas' : 'Desativadas'}</ThemedText>
          </View>
        </View>

        {/* Acesso rápido */}
        <View style={styles.quickBox}>
          <ThemedText type="subtitle" style={styles.quickTitle}>Acesso rápido</ThemedText>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickButton} onPress={() => router.push('/aluno/historico')}>
              <Ionicons name="time-outline" size={22} color="#0a7ea4" />
              <ThemedText style={styles.quickButtonText}>Histórico</ThemedText>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => router.push('/aluno')}>
              <Ionicons name="home-outline" size={22} color="#0a7ea4" />
              <ThemedText style={styles.quickButtonText}>Início</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Sobre o app */}
        <View style={styles.aboutBox}>
          <ThemedText type="subtitle" style={styles.aboutTitle}>Sobre o app</ThemedText>
          <ThemedText style={styles.aboutText}>Versão: <ThemedText style={{ fontWeight: 'bold' }}>{Constants.expoConfig?.version || 'N/A'}</ThemedText></ThemedText>
          <ThemedText style={styles.aboutText}>Powered by Neurelix</ThemedText>
        </View>

        {/* Botão de sair */}
        <Pressable style={styles.primaryButton} onPress={async () => {
          await AsyncStorage.removeItem('usuarioLogado');
          router.replace('/login');
        }}>
          <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <ThemedText style={styles.buttonText}>Sair</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  avatarBox: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  email: {
    fontSize: 15,
    marginBottom: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  statsBox: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  prefBox: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
  },
  prefTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  prefLabel: {
    fontSize: 15,
  },
  quickBox: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
  },
  quickTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  quickButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
    fontSize: 15,
  },
  aboutBox: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
  },
  aboutTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  aboutText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '90%',
    alignSelf: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});