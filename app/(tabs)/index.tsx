import { router } from 'expo-router';
import { useEffect } from 'react';

export default function HomeScreen() {
  useEffect(() => {
    // Redireciona para a tela de login
    router.replace('/login');
  }, []);

  return null;
}
