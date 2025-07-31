import { useTheme } from '@react-navigation/native';
import { collection, getDocs, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { firestore } from '@/utils/firebaseConfig';

interface LogEntry {
  id: string;
  level?: 'info' | 'warning' | 'error' | string;
  message?: string;
  timestamp?: Timestamp;
}

export default function LogsAdmin() {
  const theme = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Escuta em tempo-real aos últimos 100 logs
  useEffect(() => {
    const q = query(
      collection(firestore, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: LogEntry[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<LogEntry, 'id'>) }));
      setLogs(data);
    });
    return unsubscribe;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const q = query(
        collection(firestore, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const data: LogEntry[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<LogEntry, 'id'>) }));
      setLogs(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = ({ item }: { item: LogEntry }) => {
    const color = item.level === 'error' ? '#ff6b6b' : item.level === 'warning' ? '#ffa500' : '#4a90e2';
    const date = item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000) : null;

    return (
      <ThemedView
        style={[
          styles.logCard,
          {
            borderLeftColor: color,
            backgroundColor: theme.dark ? '#1a1a1a' : '#fafafa',
            borderColor: theme.dark ? '#333' : '#ddd',
          },
        ]}
      >
        <ThemedText style={[styles.logMessage, { color: theme.colors.text }]}>{item.message || '-- mensagem vazia ‑-'}</ThemedText>
        {date && (
          <ThemedText style={[styles.logTime, { color: theme.colors.text }]}> {date.toLocaleString()}</ThemedText>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      {logs.length === 0 ? (
        <ThemedView style={styles.placeholderContainer}>
          <ThemedText style={{ color: theme.colors.text }}>Nenhum log disponível.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  logMessage: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
  },
});
