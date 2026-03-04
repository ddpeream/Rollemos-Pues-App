import React, { Component } from 'react';
import { View, Text } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default class TrackingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Tracking Error Boundary caught an error:', error, errorInfo);
    
    // Evitar que el error se propague y cause un crash completo
    // Resetear el estado de error después de un tiempo
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 3000);
  }

  render() {
    if (this.state.hasError) {
      const theme = useAppStore();
      
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: theme.colors.background,
        }}>
          <Text style={{
            fontSize: 16,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 10,
          }}>
            Ocurrió un error en el tracking
          </Text>
          <Text style={{
            fontSize: 12,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}>
            La app se está recuperando...
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
