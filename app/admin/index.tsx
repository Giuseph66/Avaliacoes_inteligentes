import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';

export default function AdminConfigScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  type TokenInfo = { key: string; tpm: string; ttotal: string; rpd: string; rtotal: string; rpm: string };
  const [config, setConfig] = useState<{ version: string; iaTokens: TokenInfo[] }>({
    version: '',
    iaTokens: [],
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Carrega config ao montar
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const ref = doc(firestore, 'config', 'l2I9QyMBvi9uUx2dpeNo');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          console.log(snap.data());
          const raw = snap.data();
          const tokensRaw: any = raw.iaToken || raw.iaTokens || {};
          const tokensArr: TokenInfo[] = Object.entries(tokensRaw).map(([k, info]: any) => ({
            key: k,
            tpm:    String(info?.tpm    ?? 0), // tokens per minute
            rpm:    String(info?.rpm    ?? 0), // requests per minute
            ttotal: String(info?.ttotal ?? 0), // tokens total
            rpd:    String(info?.rpd    ?? 0), // requests per day
            rtotal: String(info?.rtotal ?? 0), // requests total
          }));
          setConfig({
            version: raw.version || '',
            iaTokens: tokensArr,
          });
        }
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível carregar configurações.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  async function salvarConfig() {
    setSaving(true);
    try {
      const ref = doc(firestore, 'config', 'l2I9QyMBvi9uUx2dpeNo');
      const tokenObj: any = {};
      config.iaTokens.forEach((t) => {
        if (t.key.trim()) tokenObj[t.key.trim()] = {
          tpm: Number(t.tpm) || 0,
          ttotal: Number(t.ttotal) || 0,
          rpd: Number(t.rpd) || 0,
          rtotal: Number(t.rtotal) || 0,
          rpm: Number(t.rpm) || 0,
        };
      });
      await setDoc(ref, { version: config.version, iaToken: tokenObj }, { merge: true });
      Alert.alert('Sucesso', 'Configurações salvas com êxito.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      {/* Cabeçalho */}
      <ThemedView style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#e0e0e0' }]}>        
        <ThemedText type="title" style={[styles.headerTitle, { color: theme.colors.text }]}>Configurações do Sistema</ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.placeholderContainer}>
          <ThemedText style={{ color: theme.colors.text }}>Carregando configurações...</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <ThemedView style={{ marginBottom: 16 }}>
            <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Versão Atual</ThemedText>
            <TextInput
              value={config.version}
              onChangeText={(text) => setConfig((prev) => ({ ...prev, version: text }))}
              placeholder="Versão Atual"
              style={[
                styles.configInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#444' : '#ccc', 
                  backgroundColor: theme.dark ? '#1a1a1a' : '#fff',
                },
              ]}
              placeholderTextColor="#888"
            />
          </ThemedView>

          {/* Lista de Tokens */}
          <ThemedText style={[styles.configLabel, { color: theme.colors.text, marginTop: 8 }]}>Tokens da IA</ThemedText>
          {config.iaTokens.map((tok, idx) => {
            const isExpanded = expanded.has(idx);
            return (
              <View key={idx}>
                <View style={[styles.tokenCard, { backgroundColor: theme.dark ? '#1a1a1a' : '#f8f9fa', borderColor: theme.dark ? '#444' : '#ccc' }]}>
                  <TextInput
                    value={tok.key}
                    onChangeText={(text) =>
                      setConfig(prev => {
                        const arr = [...prev.iaTokens];
                        arr[idx].key = text;
                        return { ...prev, iaTokens: arr };
                      })}
                    placeholder="Token"
                    style={[styles.tokenInput, { color: theme.colors.text }]}
                    placeholderTextColor="#888"
                  />
                  <Pressable
                    onPress={() =>
                      setExpanded(prev => {
                        const n = new Set(prev);
                        n.has(idx) ? n.delete(idx) : n.add(idx);
                        return n;
                      })
                    }
                  >
                    <Ionicons name={isExpanded ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.dark ? '#4a90e2' : '#0a7ea4'} style={{ padding: 4 }} />
                  </Pressable>
                  <Pressable onPress={() => {
                    setConfig((prev) => ({ ...prev, iaTokens: prev.iaTokens.filter((_, i) => i !== idx) }));
                    setExpanded(prev => { const n=new Set(prev); n.delete(idx); return n; });
                  }}>
                    <Ionicons name="trash-outline" size={22} color="#e53935" style={{ padding: 4 }} />
                  </Pressable>
                </View>
                {isExpanded && (
                  <View style={[styles.tokenDetails, { backgroundColor: theme.dark ? '#1a1a1a' : '#fafafa', borderColor: theme.dark ? '#444' : '#ccc'}]}>
                      {/* Seção de Tokens */}
                      <View style={styles.metricBox}>
                          <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Tokens/min</ThemedText>
                          <TextInput
                              value={tok.tpm}
                              onChangeText={(text) => setConfig(prev => { const arr=[...prev.iaTokens]; arr[idx].tpm=text; return {...prev, iaTokens: arr}; })}
                              placeholder="Tokens/min"
                              keyboardType="numeric"
                              editable={false}
                              style={[styles.smallInput, { color: theme.colors.text, width: '100%' }]}
                              placeholderTextColor="#888"
                          />
                      </View>

                      <View style={styles.metricBox}>
                          <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Tokens total</ThemedText>
                          <TextInput
                              value={tok.ttotal}
                              onChangeText={(text) => setConfig(prev => { const arr=[...prev.iaTokens]; arr[idx].ttotal=text; return {...prev, iaTokens: arr}; })}
                              placeholder="Tokens total"
                              keyboardType="numeric"
                              editable={false}
                              style={[styles.smallInput, { color: theme.colors.text, width: '100%' }]}
                              placeholderTextColor="#888"
                          />
                      </View>

                      {/* Seção de Requisições */}

                      <View style={styles.metricBox}>
                          <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Req/dia</ThemedText>
                          <TextInput
                              value={tok.rpd}
                              onChangeText={(text) => setConfig(prev => { const arr=[...prev.iaTokens]; arr[idx].rpd=text; return {...prev, iaTokens: arr}; })}
                              placeholder="Req/dia"
                              keyboardType="numeric"
                              editable={false}
                              style={[styles.smallInput, { color: theme.colors.text, width: '100%' }]}
                              placeholderTextColor="#888"
                          />
                      </View>

                      <View style={styles.metricBox}>
                          <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Req total</ThemedText>
                          <TextInput
                              value={tok.rtotal}
                              onChangeText={(text) => setConfig(prev => { const arr=[...prev.iaTokens]; arr[idx].rtotal=text; return {...prev, iaTokens: arr}; })}
                              placeholder="Req total"
                              keyboardType="numeric"
                              editable={false}
                              style={[styles.smallInput, { color: theme.colors.text, width: '100%' }]}
                              placeholderTextColor="#888"
                          />
                      </View> 
                      <View style={styles.metricBox}>
                          <ThemedText style={[styles.configLabel, { color: theme.colors.text }]}>Req/min</ThemedText>
                          <TextInput
                              value={tok.rpm}
                              onChangeText={(text) => setConfig(prev => { const arr=[...prev.iaTokens]; arr[idx].rpm=text; return {...prev, iaTokens: arr}; })}
                              placeholder="Req/min"
                              keyboardType="numeric"
                              editable={false}
                              style={[styles.smallInput, { color: theme.colors.text, width: '100%' }]}
                              placeholderTextColor="#888"
                          />
                      </View>
                  </View>
                )}
              </View>
            );
          })}

          <Pressable
            onPress={() => setConfig((prev) => ({ ...prev, iaTokens: [...prev.iaTokens, { key: '', tpm: '0', ttotal: '0', rpd: '0', rtotal: '0', rpm: '0' }] }))}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.dark ? '#4a90e2' : '#0a7ea4'} />
            <ThemedText style={{ marginLeft: 6, color: theme.dark ? '#4a90e2' : '#0a7ea4' }}>Adicionar Token</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: theme.dark ? '#4a90e2' : '#0a7ea4' },
              saving && styles.disabledButton,
            ]}
            onPress={salvarConfig}
            disabled={saving}
          >
            <ThemedText style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Configurações'}</ThemedText>
          </Pressable>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  configInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    gap: 6,
  },
  tokenInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
  },
  smallInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  tokenDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  metricBox: {
    width: '48%',
  },
}); 