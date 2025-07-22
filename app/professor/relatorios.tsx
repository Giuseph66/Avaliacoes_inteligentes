import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { safeFirestoreOperation } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function RelatoriosScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mediaGeral: 0,
    provasCriadas: 0,
    provasCorrigidas: 0,
    sugestaoIA: 'Continue acompanhando o desempenho das turmas!'
  });
  const [faixasNotas, setFaixasNotas] = useState([0, 0, 0, 0]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('usuarioLogado');
      if (!userData) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }
      const user = JSON.parse(userData);

      // Busca provas do professor
      const provasSnap = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'provas')),
        'buscar provas'
      );
      if (!provasSnap) { setLoading(false); return; }
      const minhasProvas = provasSnap.docs.filter(doc => doc.data().professor?.id === user.id);

      // Busca respostas das provas
      const respostasSnap = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'respostas')),
        'buscar respostas'
      );
      if (!respostasSnap) { setLoading(false); return; }
      const respostasMinhasProvas = respostasSnap.docs.filter(doc => minhasProvas.map(p => p.id).includes(doc.data().provaId));

      // Média geral
      const notas = respostasMinhasProvas.map(doc => doc.data().notaGeral).filter((n: any) => typeof n === 'number');
      const mediaGeral = notas.length ? (notas.reduce((a: number, b: number) => a + b, 0) / notas.length) : 0;

      // Distribuição por faixa
      const faixas = [0, 0, 0, 0];
      notas.forEach((nota: number) => {
        if (nota < 5) faixas[0]++;
        else if (nota < 7) faixas[1]++;
        else if (nota < 9) faixas[2]++;
        else faixas[3]++;
      });
      setFaixasNotas(faixas);

      // Sugestão IA
      let sugestaoIA = 'Continue acompanhando o desempenho das turmas!';
      if (mediaGeral < 6) sugestaoIA = 'Atenção: média das turmas está baixa, revise conteúdos!';
      else if (mediaGeral > 8) sugestaoIA = 'Parabéns! Suas turmas estão indo muito bem!';

      setStats({
        mediaGeral: Number(mediaGeral.toFixed(1)),
        provasCriadas: minhasProvas.length,
        provasCorrigidas: respostasMinhasProvas.length,
        sugestaoIA
      });
    } catch (error) {
      console.error('Erro em fetchStats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ThemedText type="title" style={styles.title}>Dashboard do Professor</ThemedText>
      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 20, paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
          {/* Estatísticas principais */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}> 
              <Ionicons name="document-text" size={28} color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
              <ThemedText style={styles.statValue}>{stats.provasCriadas}</ThemedText>
              <ThemedText style={styles.statLabel}>Provas Criadas</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}> 
              <Ionicons name="checkmark-done" size={28} color="#4caf50" />
              <ThemedText style={styles.statValue}>{stats.provasCorrigidas}</ThemedText>
              <ThemedText style={styles.statLabel}>Provas Corrigidas</ThemedText>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}> 
              <Ionicons name="bar-chart" size={28} color={theme.dark ? '#ffd600' : '#0a7ea4'} />
              <ThemedText style={styles.statValue}>{stats.mediaGeral}</ThemedText>
              <ThemedText style={styles.statLabel}>Média Geral</ThemedText>
            </View>
          </View>

          {/* Gráfico de distribuição de notas */}
          <ThemedText style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8, marginBottom: 2, color: theme.colors.text, textAlign: 'center' }}>
            Distribuição das Notas das Provas Corrigidas
          </ThemedText>
          <ThemedText style={{ fontSize: 13, color: theme.dark ? '#aaa' : '#666', marginBottom: 8, textAlign: 'center' }}>
            Faixas: 0-4 | 5-6 | 7-8 | 9-10
          </ThemedText>
          <BarChart
            data={{
              labels: ['0-4', '5-6', '7-8', '9-10'],
              datasets: [
                {
                  data: faixasNotas,
                },
              ],
            }}
            width={Dimensions.get('window').width - 48}
            height={240}
            yAxisLabel={''}
            yAxisSuffix={' provas'}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundColor: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientFrom: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientTo: theme.dark ? '#1a1a1a' : '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => theme.dark ? `rgba(74,144,226,${opacity})` : `rgba(10,126,164,${opacity})`,
              labelColor: (opacity = 1) => theme.colors.text,
              style: { borderRadius: 16 },
              propsForBackgroundLines: { stroke: theme.dark ? '#333' : '#e0e0e0' },
              barPercentage: 0.6,
              fillShadowGradient: theme.dark ? '#4a90e2' : '#0a7ea4',
              fillShadowGradientOpacity: 0.8,
            }}
            style={{ borderRadius: 12, marginBottom: 12, alignSelf: 'center' }}
          />

          {/* Sugestão da IA */}
          <View style={[styles.iaBox, { backgroundColor: theme.dark ? '#2a2a2a' : '#e3f2fd' }]}> 
            <Ionicons name="sparkles" size={22} color={theme.dark ? '#9c27b0' : '#9c27b0'} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.iaText, { color: theme.colors.text }]}>{stats.sugestaoIA}</ThemedText>
          </View>

        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  iaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  iaText: {
    fontSize: 16,
    fontStyle: 'italic',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 