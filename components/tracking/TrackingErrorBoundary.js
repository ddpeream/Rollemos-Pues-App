import React, { Component } from 'react';
import { View, Text } from 'react-native';

export default class TrackingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🚨 Error caught by Tracking Error Boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Tracking Error Boundary componentDidCatch:', error, errorInfo);
    
    // Loggear el stack trace completo para debugging
    if (errorInfo?.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }
    
    // Resetear el estado de error después de un tiempo para intentar recuperarse
    this.resetTimeout = setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 5000);
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      
      // Fallback si theme no está disponible
      const bgColor = theme?.colors?.background || '#f5f5f5';
      const textColor = theme?.colors?.text || '#333333';
      const secondaryColor = theme?.colors?.textSecondary || '#666666';
      
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: bgColor,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: textColor,
            textAlign: 'center',
            marginBottom: 10,
          }}>
            ⚠️ Error en Tracking
          </Text>
          <Text style={{
            fontSize: 12,
            color: secondaryColor,
            textAlign: 'center',
            marginBottom: 10,
          }}>
            {this.state.error?.message || 'Ocurrió un error inesperado'}
          </Text>
          <Text style={{
            fontSize: 11,
            color: secondaryColor,
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            La aplicación se está recuperando...
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
