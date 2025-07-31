import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function EstudarIAScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#e0e0e0' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <ThemedText type="title" style={[styles.title, { color: theme.colors.text }]}>
          Estudar com IA
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <ThemedView style={[styles.card, { backgroundColor: theme.dark ? '#1a1a1a' : '#fafafa', borderColor: theme.dark ? '#333' : '#e0e0e0' }]}>
          <Ionicons name="school-outline" size={48} color={theme.colors.primary} />
          <ThemedText style={[styles.cardTitle, { color: theme.colors.text }]}>
            Em Desenvolvimento
          </ThemedText>
          <ThemedText style={[styles.cardText, { color: theme.dark ? '#aaa' : '#666' }]}>
            Esta funcionalidade estará disponível em breve.
          </ThemedText>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 300,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
