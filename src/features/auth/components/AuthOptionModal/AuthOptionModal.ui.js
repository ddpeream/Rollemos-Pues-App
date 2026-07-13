import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function AuthOptionModalUI({
  onClose,
  onSelect,
  options,
  selectedId,
  styles,
  title,
  visible,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item.id)}
                style={[
                  styles.optionItem,
                  selectedId === item.id && styles.optionItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedId === item.id && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

