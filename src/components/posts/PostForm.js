import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import Button from '../common/Button';

const PostForm = ({ onSubmit, loading = false, style }) => {
  const [content, setContent] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleContentChange = (text) => {
    setContent(text);
    setIsValid(text.trim().length > 0);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    if (content.trim().length < 5) {
      Alert.alert('Error', 'El comentario debe tener al menos 5 caracteres');
      return;
    }

    onSubmit?.(content.trim());
    setContent(''); // Clear form after submit
    setIsValid(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>💬 Agregar comentario</Text>
      <Text style={styles.subtitle}>
        ¿Viste a esta mascota? ¿Tienes información que pueda ayudar?
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={handleContentChange}
          placeholder="Escribe tu comentario aquí... Por ejemplo: 'Vi a un perro similar en el parque ayer por la tarde'"
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
          editable={!loading}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        <Text style={styles.characterCount}>
          {content.length}/500 caracteres
        </Text>
      </View>

      <Button
        title={loading ? 'Enviando...' : 'Enviar comentario'}
        onPress={handleSubmit}
        loading={loading}
        disabled={!isValid || loading}
        style={styles.submitButton}
        textStyle={styles.submitButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // Ensure container takes minimum space needed
    flex: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8, // Extra space above button
    marginBottom: Platform.OS === 'ios' ? 8 : 0, // Extra space for iOS
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PostForm;
