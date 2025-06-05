import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { uploadMultiplePhotos } from '../../services/photos';
import { COLORS } from '../../utils/constants';
import AlertForm from '../../components/forms/AlertForm';
import Button from '../../components/common/Button';

const CreateEditAlertScreen = ({ route, navigation }) => {
  const { alertId, alertData } = route.params || {};
  const { createNewAlert, updateExistingAlert, loading, error } = useAlert();
  const [formData, setFormData] = useState(null);

  const isEditing = Boolean(alertId);

  useEffect(() => {
    if (alertData) {
      setFormData(alertData);
    }
  }, [alertData]);

  const handleFormSubmit = async (data) => {
    try {
      // Separate photos from form data
      const { photos, ...alertFormData } = data;
      
      if (isEditing) {
        // Update existing alert
        const updatedAlert = await updateExistingAlert(alertId, alertFormData);
        
        // TODO: Handle photo updates for existing alerts
        Alert.alert('Éxito', 'Alerta actualizada correctamente');
        navigation.goBack();
      } else {
        // Create new alert
        const newAlert = await createNewAlert(alertFormData);
        
        if (photos && photos.length > 0) {
          // Upload photos after alert creation
          try {
            // Convert photos to the format expected by uploadMultiplePhotos
            const photosToUpload = photos.map((photo, index) => ({
              uri: photo.uri,
              description: photo.description || `Foto ${index + 1}`,
            }));
            
            await uploadMultiplePhotos(photosToUpload, newAlert.id);
            
            Alert.alert(
              'Éxito',
              `Alerta creada correctamente con ${photos.length} foto(s).`,
              [
                {
                  text: 'Ver alerta',
                  onPress: () => navigation.replace('AlertDetail', { alertId: newAlert.id }),
                },
                {
                  text: 'Ir al inicio',
                  onPress: () => navigation.navigate('Home'),
                },
              ]
            );
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            Alert.alert(
              'Alerta creada',
              'La alerta se creó correctamente, pero hubo un error al subir las fotos. Puedes intentar subirlas más tarde.',
              [
                {
                  text: 'Ver alerta',
                  onPress: () => navigation.replace('AlertDetail', { alertId: newAlert.id }),
                },
                {
                  text: 'Ir al inicio', 
                  onPress: () => navigation.navigate('Home'),
                },
              ]
            );
          }
        } else {
          Alert.alert(
            'Éxito',
            'Alerta creada correctamente',
            [
              {
                text: 'Ver alerta',
                onPress: () => navigation.replace('AlertDetail', { alertId: newAlert.id }),
              },
              {
                text: 'Ir al inicio',
                onPress: () => navigation.navigate('Home'),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Form submit error:', error);
      Alert.alert('Error', error.message || 'Error al procesar la alerta');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          title="← Cancelar"
          onPress={() => navigation.goBack()}
          variant="text"
          style={styles.cancelButton}
        />
        
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Alerta' : 'Nueva Alerta'}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <AlertForm
          initialData={formData}
          onSubmit={handleFormSubmit}
          loading={loading}
          style={styles.form}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cancelButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
});

export default CreateEditAlertScreen;
