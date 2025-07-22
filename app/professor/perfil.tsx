import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { safeFirestoreOperation } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StatusBar, StyleSheet, View } from 'react-native';

export default function PerfilProfessor() {
  const router = useRouter();
  const theme = useTheme();
  // Mock de dados do professor (substitua por dados reais se desejar)
  const profMock = {
    nome: 'Prof. João Silva',
    email: 'joao.silva@example.com',
    departamento: 'Ciências Exatas',
    avatar: null,
    notificacoes: true,
    modoEscuro: theme.dark,
  };
  const [prof, setProf] = useState<any>(profMock);
  const [provas, setProvas] = useState<any>([]);
  const [respostas, setRespostas] = useState<any>([]);
  useEffect(() => {
    const fetchProf = async () => {
      const userData = await AsyncStorage.getItem('usuarioLogado');
      if (!userData) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        router.replace('/login');
        return;
      }
      const user = JSON.parse(userData);
      const prof = {
        id: user.id,
        nome: 'Prof. ' + user.nome,
        email: user.email,
        departamento: user.departamento || 'Não informado',
        avatar: user.avatar || null,
        notificacoes: user.notificacoes,
        modoEscuro: theme.dark,
      }
      setProf(prof);
    }
    fetchProf();
  }, []);
  const provasCriadas = async () => {
    const userData = await AsyncStorage.getItem('usuarioLogado');
    if (!userData) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return [];
    }
    const user = JSON.parse(userData);

    const provasSnap = await safeFirestoreOperation(
      () => getDocs(collection(firestore, 'provas')),
      'buscar provas'
    );
    if (!provasSnap) return [];

    const provasFiltradas = provasSnap.docs.filter(doc => doc.data().professor?.id === user.id);
    setProvas(provasFiltradas);
    return provasFiltradas;
  }
  const provasCorrigidas = async () => {
    const userData = await AsyncStorage.getItem('usuarioLogado');
    if (!userData) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return [];
    }
    const provas = await provasCriadas();
    if (!provas.length) return [];

    const respostasSnap = await safeFirestoreOperation(
      () => getDocs(collection(firestore, 'respostas')),
      'buscar respostas'
    );
    if (!respostasSnap) return [];

    const respostasFiltradas = respostasSnap.docs.filter(doc => provas.map((prova: any) => prova.id).includes(doc.data().provaId));
    setRespostas(respostasFiltradas);
    return respostasFiltradas;
  }
  provasCriadas();
  provasCorrigidas();
  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {/* Avatar e nome */}
      <View style={styles.avatarBox}>
        {prof?.avatar ? (
          <Image source={{ uri: prof.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarCircle, { backgroundColor: theme.dark ? '#0a7ea4' : '#e0e0e0' }]}>
            <ThemedText style={[styles.avatarInitials, { color: theme.dark ? '#fff' : '#000' }]}>{prof?.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</ThemedText>
          </View>
        )}
        <ThemedText style={[styles.nome, { color: theme.colors.text }]}>{prof?.nome}</ThemedText>
        <ThemedText style={[styles.email, { color: theme.dark ? '#aaa' : '#666' }]}>{prof?.email}</ThemedText>
      </View>

      {/* Dados principais */}
      <View style={styles.infoBox}>
        <Ionicons name="business" size={20} color={theme.dark ? '#4a90e2' : '#0a7ea4'} style={{ marginRight: 8 }} />
        <ThemedText style={[styles.infoText, { color: theme.colors.text }]}>Departamento: <ThemedText style={styles.infoValue}>{prof?.departamento}</ThemedText></ThemedText>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsBox}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={22} color="#ff9800" />
          <ThemedText style={styles.statValue}>{provas.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Provas Criadas</ThemedText>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-done" size={22} color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
            <ThemedText style={styles.statValue}>{respostas.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Provas Corrigidas</ThemedText>
        </View>
      </View>

      {/* Preferências */}
      <View style={styles.prefBox}>
        <ThemedText type="subtitle" style={styles.prefTitle}>Preferências</ThemedText>
        <View style={styles.prefItem}>
          <Ionicons name={prof?.modoEscuro ? 'moon' : 'sunny'} size={18} color={theme.dark ? '#ffd600' : '#0a7ea4'} />
          <ThemedText style={styles.prefLabel}>Modo {prof?.modoEscuro ? 'Escuro' : 'Claro'}</ThemedText>
        </View>
        <View style={styles.prefItem}>
          <Ionicons name={prof.notificacoes ? 'notifications' : 'notifications-off'} size={18} color={prof.notificacoes ? '#4caf50' : '#e53935'} />
          <ThemedText style={styles.prefLabel}>Notificações por e-mail: {prof.notificacoes ? 'Ativadas' : 'Desativadas'}</ThemedText>
        </View>
      </View>

      {/* Sobre o app */}
      <View style={styles.aboutBox}>
        <ThemedText type="subtitle" style={styles.aboutTitle}>Sobre o app</ThemedText>
        <ThemedText style={styles.aboutText}>Versão: <ThemedText style={{ fontWeight: 'bold' }}>{Constants.expoConfig?.version || 'N/A'}</ThemedText></ThemedText>
        <ThemedText style={styles.aboutText}>Powered by Neurelix</ThemedText>
      </View>

      {/* Botão de sair */}
      <Pressable style={styles.primaryButton} onPress={() => {
        AsyncStorage.removeItem('usuarioLogado');
        router.replace('/login');
      }}>
        <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <ThemedText style={styles.buttonText}>Sair</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: StatusBar.currentHeight,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarBox: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight/2 : 0,
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  prefBox: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'transparent',
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
  aboutBox: {
    width: '100%',
    marginBottom: 32,
    backgroundColor: 'transparent',
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
    width: '100%',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 