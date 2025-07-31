import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { safeFirestoreOperation, safeFirestoreVoidOperation } from '@/utils/firestoreErrorHandler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfessorHome() {
  const router = useRouter();
  const [provas, setProvas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Estado para modal customizado de senha
  const [modalVisible, setModalVisible] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [provaParaExcluir, setProvaParaExcluir] = useState<string | null>(null);
  const [senhaErro, setSenhaErro] = useState('');
  const theme = useTheme();
  const { colors } = theme;
  const [alunosFinalizados, setAlunosFinalizados] = useState<any>(0);
  const [usuario, setUsuario] = useState<any>(null);
  useEffect(() => {
    fetchProvas();
  }, []);


function base64ToUtf8(str: string) {
  return decodeURIComponent(
    Array.prototype.map
      .call(require('base-64').decode(str), function (c: string) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}
  async function fetchProvas() {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('usuarioLogado');
      if (!userData) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        return;
      }
      const usuario = JSON.parse(userData);
      setUsuario(usuario);
      const querySnapshot = await safeFirestoreOperation(
        () => getDocs(collection(firestore, 'provas')),
        'buscar provas'
      );
      if (!querySnapshot) { setLoading(false); return; }

      const provasList: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Verifica se o professor da prova corresponde ao usuário logado
        if (data.professor?.id === usuario.id || usuario.id === 'GxSZ26LAbf1cwCzBwgao') {
          let prova = null;
          try {
            const decrypted = base64ToUtf8(data.provaCriptografada);
            prova = JSON.parse(decrypted);
          } catch (e) {
            prova = { titulo: 'Erro ao decodificar', descricao: '', questoes: [] };
          }
          provasList.push({
            id: doc.id,
            criadoEm: data.criadoEm || null,
            professor: {
              email: data.professor.email || '',
              id: data.professor.id || '',
              nome: data.professor.nome || '',
              role: data.professor.role || ''
            },
            ...prova
          });
        }
      });

      setProvas(provasList);
      setLoading(false);
    } catch (e) {
      Alert.alert('Erro ao buscar provas', 'Tente novamente mais tarde.');
      console.error('Erro ao buscar provas:', e);
      setLoading(false);
    }
  }
  const provasCorrigidas = async () => {
    const salasSnap = await safeFirestoreOperation(
      () => getDocs(collection(firestore, 'salas')),
      'buscar salas'
    );
    if (!salasSnap) return 0;
    const salas = salasSnap;
    const alunosFinalizados = salas.docs.filter(doc => doc.data().provaId === doc.id).length;
    setAlunosFinalizados(alunosFinalizados);
    return alunosFinalizados;
  }
  provasCorrigidas();
  // Função para apagar prova com confirmação de senha
  async function apagarProva(id: string) {
    if (!id) return;
    // Buscar usuário logado
    const userData = await AsyncStorage.getItem('usuarioLogado');
    if (!userData) {
      Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
      return;
    }
    const usuario = JSON.parse(userData);
    const confirmarExclusao = (senha?: string) => {
      if (!senha) return;
      if (senha !== usuario.senha) {
        Alert.alert('Senha incorreta', 'A senha informada está incorreta.');
        return;
      }
      safeFirestoreVoidOperation(
        () => deleteDoc(doc(firestore, 'provas', id)),
        'apagar prova',
        () => {
          setProvas((prev) => prev.filter((p) => p.id !== id));
          Alert.alert('Prova apagada com sucesso!');
        }
      );
    };
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Confirmação',
        'Digite sua senha para confirmar a exclusão:',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Apagar', style: 'destructive', onPress: confirmarExclusao }
        ],
        'secure-text'
      );
    } else {
      setProvaParaExcluir(id);
      setSenhaDigitada('');
      setSenhaErro('');
      setModalVisible(true);
    }
  }

  // Função para confirmar exclusão no modal customizado
  async function confirmarExclusaoAndroid() {
    const userData = await AsyncStorage.getItem('usuarioLogado');
    if (!userData) {
      setSenhaErro('Usuário não autenticado.');
      return;
    }
    const usuario = JSON.parse(userData);
    if (senhaDigitada !== usuario.senha) {
      setSenhaErro('Senha incorreta.');
      return;
    }
    if (provaParaExcluir) {
      const sucesso = await safeFirestoreVoidOperation(
        () => deleteDoc(doc(firestore, 'provas', provaParaExcluir)),
        'apagar prova'
      );
      if (sucesso) {
        setProvas((prev) => prev.filter((p) => p.id !== provaParaExcluir));
        setModalVisible(false);
        setSenhaDigitada('');
        setSenhaErro('');
        setProvaParaExcluir(null);
        Alert.alert('Prova apagada com sucesso!');
      }
    }
  }

  return (
    <ThemedView style={styles.container}>
      {/* Modal customizado para Android */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <ThemedText type="title" style={{ color: theme.colors.text }}>Confirmação</ThemedText>
            <ThemedText style={{ color: theme.colors.text }}>Digite sua senha para confirmar a exclusão:</ThemedText>
            <TextInput
              value={senhaDigitada}
              onChangeText={setSenhaDigitada}
              placeholder="Senha"
              secureTextEntry
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.dark ? '#222' : '#fff',
                  borderColor: theme.dark ? '#444' : '#ccc',
                },
              ]}
              placeholderTextColor={theme.dark ? '#888' : '#999'}
            />
            {senhaErro ? <ThemedText style={{ color: 'red' }}>{senhaErro}</ThemedText> : null}
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.dark ? '#555' : '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={[styles.buttonText, { color: theme.colors.text }]}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#d32f2f' }]}
                onPress={confirmarExclusaoAndroid}
              >
                <ThemedText style={styles.buttonText}>Apagar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ThemedText type="title" style={styles.title}>Minhas Avaliações</ThemedText>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/professor/criar-avaliacao')}>
        <ThemedText style={styles.buttonText}>Criar Avaliação</ThemedText>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={provas}
          keyExtractor={(item) => item.id}
          onRefresh={() => fetchProvas()}
          refreshing={loading}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText type="subtitle">{item.titulo}</ThemedText>
                <Pressable
                  onPress={() => router.push({ pathname: '/professor/criar-avaliacao', params: { id: item.id } })}
                >
                  <Ionicons name="pencil" size={24} color={theme.colors.primary} style={{ marginRight: 10 ,borderWidth: 1, borderColor: theme.colors.text, borderRadius: 100, padding: 5, backgroundColor: "rgba(0, 0, 255, 0.1)"}} />
                </Pressable>
                <Pressable
                  onPress={() => apagarProva(item.id)}
                >
                  <Ionicons name="trash" size={24} color='red' style={{ marginRight: 10 ,borderWidth: 1, borderColor: theme.colors.text, borderRadius: 100, padding: 5, backgroundColor: "rgba(255, 0, 0, 0.1)"}} />
                </Pressable>
              </View>
              <ThemedText>Nº de respostas: {item.questoes.length}</ThemedText>
              {item.professor.id != usuario.id && (
                <ThemedText style={{ color: 'gray' , fontSize: 12}}>Feita por: {item.professor.nome}</ThemedText>
              )}
              <View style={styles.bottomRow}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#0a7ea4' }]}
                  onPress={() => router.push({ pathname: '/professor/visualizar-prova', params: { id: item.id } })}
                >
                  <ThemedText style={styles.buttonText}>Visualizar</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                  onPress={() => router.push(
                    {pathname: `/professor/sala-prova`, params: { provaId: item.id}}
                  )}
                >
                  <ThemedText style={styles.buttonText}>Aplicar</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    paddingTop: StatusBar.currentHeight,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
}); 