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
import { useAuth } from '../../context/AuthContext';
import { uploadToS3 } from '../../services/photos';
import { COLORS } from '../../utils/constants';
import AlertForm from '../../components/forms/AlertForm';
import Button from '../../components/common/Button';

const CreateEditAlertScreen = ({ route, navigation }) => {
  const { alertId, alertData } = route.params || {};
  const { createNewAlert, updateExistingAlert, loading, error } = useAlert();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState(null);

  const isEditing = Boolean(alertId);

  // Debug component removed to save screen space

  useEffect(() => {
    if (alertData) {
      setFormData(alertData);
    }
  }, [alertData]);

  const handleFormSubmit = async (data) => {
    try {
      // Separate photos from form data
      const { photos, ...alertFormData } = data;
      
      // Debug logging to check user context
      console.log('🔍 Debug: user object from context:', user);
      console.log('🔍 Debug: user.username:', user?.username);
      
      // Validate user authentication before proceeding
      if (!user || !user.username) {
        console.error('❌ Error: User not authenticated or username missing');
        Alert.alert(
          'Error de autenticación',
          'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.',
          [
            {
              text: 'Ir al login',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
        return;
      }
      
      // Add username to the alert data (required by backend)
      alertFormData.username = user.username;
      
      // Verify username was added
      console.log('🔍 Debug: username added to form data:', alertFormData.username);
      
      // Log the data being sent for debugging (including postal code status)
      console.log('📝 Form data being submitted:', alertFormData);
      console.log('🏠 Debug: postal code in data?', 'postalCode' in alertFormData ? alertFormData.postalCode : 'NOT INCLUDED');
      console.log('🗝️ Debug: all keys in form data:', Object.keys(alertFormData));
      
      if (isEditing) {
        // Update existing alert
        const updatedAlert = await updateExistingAlert(alertId, alertFormData);
        
        // TODO: Handle photo updates for existing alerts
        Alert.alert('Éxito', 'Alerta actualizada correctamente');
        navigation.goBack();
      } else {
        // Create new alert - use the new flow with photoFilenames
        console.log('📸 Creating alert with photos:', photos?.length || 0);
        
        const newAlert = await createNewAlert(alertFormData);
        console.log('✅ Alert created successfully:', newAlert.id);
        
        // Handle photos using the new S3 presigned URL flow
        if (photos && photos.length > 0) {
          try {
            console.log('📸 Processing', photos.length, 'photos for upload to S3');
            
            // Check if the alert creation response includes photoUrls
            if (newAlert.photoUrls && newAlert.photoUrls.length > 0) {
              console.log('📥 Received', newAlert.photoUrls.length, 'presigned URLs from backend');
              
              // Upload each photo directly to S3 using presigned URLs
              const uploadPromises = photos.map(async (photo, index) => {
                const photoUrl = newAlert.photoUrls[index];
                if (photoUrl && photoUrl.presignedUrl) {
                  console.log(`📤 Uploading photo ${index + 1} to S3...`);
                  await uploadToS3(photo.uri, photoUrl.presignedUrl);
                  return { success: true, s3ObjectKey: photoUrl.s3ObjectKey };
                } else {
                  console.error(`❌ No presigned URL for photo ${index + 1}`);
                  return { success: false, error: 'No presigned URL' };
                }
              });
              
              const uploadResults = await Promise.all(uploadPromises);
              const successCount = uploadResults.filter(r => r.success).length;
              const failureCount = uploadResults.length - successCount;
              
              console.log(`📊 Upload results: ${successCount} success, ${failureCount} failed`);
              
              if (failureCount > 0) {
                Alert.alert(
                  'Alerta creada',
                  `La alerta se creó correctamente. ${successCount} de ${photos.length} foto(s) se subieron exitosamente.`,
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
              } else {
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
              }
            } else {
              console.warn('⚠️ No photoUrls in alert creation response, but photos were provided');
              Alert.alert(
                'Alerta creada',
                'La alerta se creó correctamente, pero las fotos no se pudieron procesar. Puedes intentar subirlas más tarde.',
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        enabled
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
