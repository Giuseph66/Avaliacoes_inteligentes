import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { safeFirestoreOperation } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function RelatoriosAdmin() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProvas: 0,
    totalRespostas: 0,
    totalProfessores: 0,
    totalAlunos: 0,
    novosUsuariosMes: 0,
    novasProvasMes: 0,
    novasRespostasMes: 0,
  });
  const [usuariosPorMes, setUsuariosPorMes] = useState<number[]>([]);
  const [provasPorMes, setProvasPorMes] = useState<number[]>([]);
  const [respostasPorMes, setRespostasPorMes] = useState<number[]>([]);
  const MESES = 6; // últimos 6 meses
  const LABELS = Array.from({ length: MESES }, (_, i) => `${MESES - i}m`);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const provasSnap = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'provas')),
        'buscar provas'
      );
      if (!provasSnap) {
        setLoading(false);
        return;
      }
      const respostasSnap = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'respostas')),
        'buscar respostas'
      );
      if (!respostasSnap) {
        setLoading(false);
        return;
      }

      const usuariosSnap = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'usuarios')),
        'buscar usuarios'
      );
      if (!usuariosSnap) {
        setLoading(false);
        return;
      }

      const totalProvas = provasSnap.docs.length;
      const totalRespostas = respostasSnap.docs.length;

      const totalProfessores = usuariosSnap.docs.filter(d => d.data().role === 'professor').length;
      const totalAlunos = usuariosSnap.docs.filter(d => d.data().role === 'aluno').length;

      // Agrupar por mês
      function initArray() {
        return Array.from({ length: MESES }).map(() => 0);
      }

      const usuariosMesArr = initArray();
      const provasMesArr = initArray();
      const respostasMesArr = initArray();

      const now = new Date();
      function monthDiff(date: Date) {
        return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      }

      usuariosSnap.docs.forEach((d) => {
        const ts: any = d.data().criadoEm;
        if (!ts) return;
        const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        const diff = monthDiff(date);
        if (diff < MESES && diff >= 0) {
          usuariosMesArr[MESES - diff - 1]++;
        }
      });

      provasSnap.docs.forEach((d) => {
        const ts: any = d.data().criadoEm;
        if (!ts) return;
        const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        const diff = monthDiff(date);
        if (diff < MESES && diff >= 0) {
          provasMesArr[MESES - diff - 1]++;
        }
      });

      respostasSnap.docs.forEach((d) => {
        const ts: any = d.data().finalizadoEm || d.data().iniciadoEm;
        if (!ts) return;
        const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        const diff = monthDiff(date);
        if (diff < MESES && diff >= 0) {
          respostasMesArr[MESES - diff - 1]++;
        }
      });

      setUsuariosPorMes(usuariosMesArr);
      setProvasPorMes(provasMesArr);
      setRespostasPorMes(respostasMesArr);

      const novosUsuariosMes = usuariosMesArr[MESES - 1];
      const novasProvasMes = provasMesArr[MESES - 1];
      const novasRespostasMes = respostasMesArr[MESES - 1];

      setStats({
        totalProvas,
        totalRespostas,
        totalProfessores,
        totalAlunos,
        novosUsuariosMes,
        novasProvasMes,
        novasRespostasMes,
      });
    } catch (e) {
      console.error('Erro em fetchStats', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemedText type="title" style={[styles.title, { color: theme.colors.text }]}>Relatórios - Visão Geral</ThemedText>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: 20, paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Estatísticas principais */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}>
              <Ionicons
                name="document-text-outline"
                size={28}
                color={theme.dark ? '#4a90e2' : '#0a7ea4'}
              />
              <ThemedText style={styles.statValue}>{stats.totalProvas}</ThemedText>
              <ThemedText style={styles.statLabel}>Provas Publicadas</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}>
              <Ionicons name="people-outline" size={28} color="#4caf50" />
              <ThemedText style={styles.statValue}>{stats.totalRespostas}</ThemedText>
              <ThemedText style={styles.statLabel}>Provas Respondidas</ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}>
              <Ionicons
                name="bar-chart-outline"
                size={28}
                color={theme.dark ? '#ffd600' : '#0a7ea4'}
              />
              <ThemedText style={styles.statValue}>{stats.totalProfessores}</ThemedText>
              <ThemedText style={styles.statLabel}>Professores</ThemedText>
            </View>
          </View>

          {/* Usuários */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}>
              <Ionicons name="school-outline" size={28} color={theme.dark ? '#ff9800' : '#ff9800'} />
              <ThemedText style={styles.statValue}>{stats.totalAlunos}</ThemedText>
              <ThemedText style={styles.statLabel}>Alunos</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa' }]}>
              <Ionicons name="people-circle-outline" size={28} color={theme.dark ? '#3f51b5' : '#3f51b5'} />
              <ThemedText style={styles.statValue}>{stats.novosUsuariosMes}</ThemedText>
              <ThemedText style={styles.statLabel}>Novos Usuários</ThemedText>
            </View>
          </View>

          {/* Gráfico de novos usuários */}
          <ThemedText
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              marginTop: 8,
              marginBottom: 2,
              color: theme.colors.text,
              textAlign: 'center',
            }}
          >
            Novos Usuários por Mês
          </ThemedText>
          <BarChart
            data={{
              labels: LABELS,
              datasets: [{ data: usuariosPorMes }],
            }}
            width={Dimensions.get('window').width - 48}
            height={240}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            yAxisLabel={''}
            yAxisSuffix={''}
            chartConfig={{
              backgroundColor: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientFrom: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientTo: theme.dark ? '#1a1a1a' : '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) =>
                theme.dark ? `rgba(74,144,226,${opacity})` : `rgba(10,126,164,${opacity})`,
              labelColor: () => theme.colors.text,
              propsForBackgroundLines: { stroke: theme.dark ? '#333' : '#e0e0e0' },
              barPercentage: 0.6,
              fillShadowGradient: theme.dark ? '#4a90e2' : '#0a7ea4',
              fillShadowGradientOpacity: 0.8,
            }}
            style={{ borderRadius: 12, marginBottom: 12, alignSelf: 'center' }}
          />

          {/* Gráfico de novas provas/respostas */}
          <ThemedText
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              marginTop: 8,
              marginBottom: 2,
              color: theme.colors.text,
              textAlign: 'center',
            }}
          >
            Novas Provas/Respostas por Mês
          </ThemedText>
          <BarChart
            data={{
              labels: LABELS,
              datasets: [{ data: provasPorMes }, { data: respostasPorMes }],
            }}
            width={Dimensions.get('window').width - 48}
            height={240}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            yAxisLabel={''}
            yAxisSuffix={''}
            chartConfig={{
              backgroundColor: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientFrom: theme.dark ? '#1a1a1a' : '#fff',
              backgroundGradientTo: theme.dark ? '#1a1a1a' : '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) =>
                theme.dark ? `rgba(74,144,226,${opacity})` : `rgba(10,126,164,${opacity})`,
              labelColor: () => theme.colors.text,
              propsForBackgroundLines: { stroke: theme.dark ? '#333' : '#e0e0e0' },
              barPercentage: 0.6,
              fillShadowGradient: theme.dark ? '#4a90e2' : '#0a7ea4',
              fillShadowGradientOpacity: 0.8,
            }}
            style={{ borderRadius: 12, marginBottom: 12, alignSelf: 'center' }}
          />
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
}); 