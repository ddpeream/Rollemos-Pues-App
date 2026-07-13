import React from 'react';
import { Text } from 'react-native';

export default function AuthFeedbackMessageUI({ message, styles, type = 'error' }) {
  return (
    <Text style={type === 'success' ? styles.successText : styles.errorText}>
      {message}
    </Text>
  );
}

