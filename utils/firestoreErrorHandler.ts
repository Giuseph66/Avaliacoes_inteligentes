import { Alert } from 'react-native';

export interface FirestoreError {
  code: string;
  message: string;
}

export function handleFirestoreError(error: any, operation: string) {
  console.error(`Erro no Firestore durante ${operation}:`, error);
  
  let userMessage = 'Ocorreu um erro inesperado.';
  
  if (error?.code) {
    switch (error.code) {
      case 'unavailable':
        userMessage = 'Serviço indisponível. Verifique sua conexão com a internet.';
        break;
      case 'permission-denied':
        userMessage = 'Permissão negada. Verifique suas credenciais.';
        break;
      case 'not-found':
        userMessage = 'Dados não encontrados.';
        break;
      case 'already-exists':
        userMessage = 'Dados já existem.';
        break;
      case 'resource-exhausted':
        userMessage = 'Limite de recursos excedido. Tente novamente mais tarde.';
        break;
      case 'failed-precondition':
        userMessage = 'Operação não pode ser executada no estado atual.';
        break;
      case 'aborted':
        userMessage = 'Operação foi cancelada.';
        break;
      case 'out-of-range':
        userMessage = 'Dados fora do intervalo permitido.';
        break;
      case 'unimplemented':
        userMessage = 'Operação não implementada.';
        break;
      case 'internal':
        userMessage = 'Erro interno do servidor. Tente novamente.';
        break;
      case 'data-loss':
        userMessage = 'Perda de dados. Verifique sua conexão.';
        break;
      case 'unauthenticated':
        userMessage = 'Usuário não autenticado. Faça login novamente.';
        break;
      default:
        userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
  } else if (error?.message) {
    if (error.message.includes('network') || error.message.includes('connection')) {
      userMessage = 'Problema de conexão. Verifique sua internet.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Tempo limite excedido. Verifique sua conexão.';
    }
  }
  
  Alert.alert('Erro de Conexão', userMessage);
}

// Wrapper para operações do Firestore com tratamento de erro
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  onSuccess?: (result: T) => void,
  onError?: (error: any) => void
): Promise<T | null> {
  try {
    const result = await operation();
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    handleFirestoreError(error, operationName);
    if (onError) onError(error);
    return null;
  }
}

// Wrapper específico para operações que não retornam dados
export async function safeFirestoreVoidOperation(
  operation: () => Promise<void>,
  operationName: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<boolean> {
  try {
    await operation();
    if (onSuccess) onSuccess();
    return true;
  } catch (error) {
    handleFirestoreError(error, operationName);
    if (onError) onError(error);
    return false;
  }
} 