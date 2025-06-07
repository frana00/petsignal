import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { getAlertPhotos, uploadMultiplePhotos } from '../../services/photos';
import { COLORS, ALERT_TYPES, PET_SEX, PET_SIZE } from '../../utils/constants';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import PhotoGallery from '../../components/photos/PhotoGallery';
import PhotoPicker from '../../components/photos/PhotoPicker';
import Button from '../../components/common/Button';

const AlertDetailScreen = ({ route, navigation }) => {
  const { alertId } = route.params;
  const { loadAlertById, currentAlert, loading, error, removeAlert } = useAlert();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (alertId) {
      loadAlert();
      loadPhotos();
    }
  }, [alertId]);

  const loadAlert = async () => {
    try {
      await loadAlertById(alertId);
    } catch (error) {
      console.error('Error loading alert:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const alertPhotos = await getAlertPhotos(alertId);
      setPhotos(alertPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede realizar la llamada');
        }
      })
      .catch(() => Alert.alert('Error', 'No se puede realizar la llamada'));
  };

  const handleEmail = (email) => {
    const url = `mailto:${email}?subject=Consulta sobre ${currentAlert.title}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede enviar el email');
        }
      })
      .catch(() => Alert.alert('Error', 'No se puede enviar el email'));
  };

  const handleShare = async () => {
    try {
      const message = `${currentAlert.type === ALERT_TYPES.LOST ? '🔍 MASCOTA PERDIDA' : '👀 MASCOTA ENCONTRADA'}

${currentAlert.title || 'Sin nombre'}
${currentAlert.breed} - ${currentAlert.color}
Ubicación: ${currentAlert.location}
Fecha: ${new Date(currentAlert.date).toLocaleDateString('es-ES')}

${currentAlert.description}

Contacto: ${currentAlert.contactPhone}
${currentAlert.contactEmail ? `Email: ${currentAlert.contactEmail}` : ''}
${currentAlert.reward ? `Recompensa: $${currentAlert.reward}` : ''}

Comparte para ayudar! 🐾`;

      await Share.share({
        message,
        title: `${currentAlert.type === ALERT_TYPES.LOST ? 'Mascota Perdida' : 'Mascota Encontrada'} - ${currentAlert.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEdit = () => {
    // Check if user owns this alert
    if (!isAlertOwner()) {
      Alert.alert(
        'Sin permisos',
        'Solo puedes editar alertas que tú creaste.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('CreateEditAlert', { 
      alertId: currentAlert.id,
      alertData: currentAlert 
    });
  };

  const handlePhotoUpload = async (selectedPhotos) => {
    if (!selectedPhotos || selectedPhotos.length === 0) {
      return;
    }

    try {
      setUploadingPhotos(true);
      
      // Upload photos using the batch upload function
      const uploadResults = await uploadMultiplePhotos(selectedPhotos, alertId);
      
      const successCount = uploadResults.filter(r => r.uploaded).length;
      const failureCount = uploadResults.length - successCount;
      
      if (failureCount > 0) {
        Alert.alert(
          'Fotos subidas parcialmente',
          `${successCount} de ${selectedPhotos.length} foto(s) se subieron exitosamente.`
        );
      } else {
        Alert.alert('Éxito', `${successCount} foto(s) subidas correctamente.`);
      }
      
      // Reload photos to show the new ones
      await loadPhotos();
      
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'No se pudieron subir las fotos. Inténtalo de nuevo.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDelete = () => {
    // Check if user owns this alert
    if (!isAlertOwner()) {
      Alert.alert(
        'Sin permisos',
        'Solo puedes eliminar alertas que tú creaste.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Eliminar Alerta',
      '¿Estás seguro de que quieres eliminar esta alerta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAlert(currentAlert.id);
              navigation.goBack();
              Alert.alert('Éxito', 'Alerta eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la alerta');
            }
          },
        },
      ]
    );
  };

  // Check if current user is the owner of the alert
  const isAlertOwner = () => {
    if (!user || !user.username || !currentAlert || !currentAlert.username) {
      return false;
    }
    return user.username === currentAlert.username;
  };

  const getTypeColor = () => {
    return currentAlert?.type === ALERT_TYPES.LOST ? COLORS.primary : COLORS.secondary;
  };

  const getTypeText = () => {
    return currentAlert?.type === ALERT_TYPES.LOST ? 'PERDIDO' : 'ENCONTRADO';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getSexIcon = (sex) => {
    switch (sex) {
      case PET_SEX.MALE: return '♂️';
      case PET_SEX.FEMALE: return '♀️';
      default: return '❓';
    }
  };

  const getSexText = (sexValue) => {
    const upperSex = typeof sexValue === 'string' ? sexValue.trim().toUpperCase() : '';
    switch (upperSex) {
      case PET_SEX.MALE:
        return 'Macho';
      case PET_SEX.FEMALE:
        return 'Hembra';
      case PET_SEX.UNKNOWN:
        return 'No sé / No especificado';
      default:
        return 'No especificado';
    }
  };

  const getSizeText = (size, description) => {
    // Primero intentar usar el campo size si está disponible
    if (size) {
      const sizeValue = typeof size === 'string' ? size.toLowerCase() : size;
      
      switch (sizeValue) {
        case PET_SIZE.SMALL:
        case 'pequeño':
        case 'pequeno': // Sin ñ para compatibilidad
          return 'Pequeño';
        case PET_SIZE.MEDIUM:
        case 'mediano':
          return 'Mediano';
        case PET_SIZE.LARGE:
        case 'grande':
          return 'Grande';
        default:
          return size;
      }
    }
    
    // Si no hay size, intentar extraer del description
    if (description) {
      const sizeMatch = description.match(/Tamaño:\s*([^\n]+)/i);
      if (sizeMatch) {
        const extractedSize = sizeMatch[1].trim().toLowerCase();
        
        switch (extractedSize) {
          case 'pequeño':
          case 'pequeno':
          case 'small':
            return 'Pequeño';
          case 'mediano':
          case 'medium':
            return 'Mediano';
          case 'grande':
          case 'large':
            return 'Grande';
          default:
            // Capitalizar la primera letra del valor extraído
            return extractedSize.charAt(0).toUpperCase() + extractedSize.slice(1);
        }
      }
    }
    
    return 'No especificado';
  };

  if (loading && !currentAlert) {
    return <Loading message="Cargando alerta..." />;
  }

  if (error && !currentAlert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <ErrorMessage message={error} />
      </SafeAreaView>
    );
  }

  if (!currentAlert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <ErrorMessage message="Alerta no encontrada" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
          
          {/* Only show edit button if user owns the alert */}
          {isAlertOwner() && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Alert Type Badge is now inside photosSection if photos exist */}

        {/* Photos */}
        <View style={styles.photosSection}>
          {loadingPhotos ? (
            <Loading message="Cargando fotos..." />
          ) : (
            <>
              {photos.length > 0 ? (
                <>
                  {/* Alert Type Badge */}
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
                    <Text style={styles.typeBadgeText}>
                      {currentAlert.type === ALERT_TYPES.LOST ? '🔍' : '👀'} {getTypeText()}
                    </Text>
                  </View>
                  <PhotoGallery photos={photos} style={styles.photoGallery} />
                </>
              ) : (
                <Text style={styles.noPhotosText}>
                  {isAlertOwner() 
                    ? "No has agregado fotos aún. Agrega algunas para ayudar a identificar a tu mascota." 
                    : "No hay fotos disponibles para esta alerta."
                  }
                </Text>
              )}
            </>
          )}
        </View>

        {/* Alert Title and Pet Name */}
        <View style={styles.section}>
          <Text style={styles.alertTitle}>
            {currentAlert.title}
          </Text>
          {currentAlert.petName && currentAlert.petName !== currentAlert.title && (
            <Text style={styles.petNameDetailScreen}>
              Nombre de la mascota: {currentAlert.petName}
            </Text>
          )}
        </View>

        {/* Pet Details */}
        <View style={styles.section}>
          <View style={styles.petDetails}>
            <Text style={styles.petBreed}>
              {currentAlert.breed} • {currentAlert.color}
            </Text>
            <Text style={styles.petInfo}>
              {getSexText(currentAlert.sex)} {getSizeText(currentAlert.size, currentAlert.description)}
              {currentAlert.age && ` • ${currentAlert.age} años`}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {currentAlert.description}
          </Text>
        </View>

        {/* Location and Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación y Fecha</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              📍 {currentAlert.location}
            </Text>
            <Text style={styles.dateText}>
              📅 {formatDate(currentAlert.date)}
            </Text>
          </View>
        </View>

        {/* Photo Upload Controls */}
        {isAlertOwner() && (
          <View style={styles.photoManagementSection}>
            <Text style={styles.photoManagementTitle}>
              {photos.length > 0 ? "Agregar más fotos" : "Agregar fotos"}
            </Text>
            <PhotoPicker
              alertId={alertId}
              onPhotosSelected={handlePhotoUpload}
              maxPhotos={5}
              existingPhotos={photos}
              uploadImmediately={true}
              style={styles.photoPickerContainer}
            />
            {uploadingPhotos && (
              <View style={styles.uploadingContainer}>
                <Loading message="Subiendo fotos..." />
              </View>
            )}
          </View>
        )}

        {/* Reward */}
        {currentAlert.reward && (
          <View style={styles.section}>
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>
                💰 Recompensa: ${currentAlert.reward}
              </Text>
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCall(currentAlert.contactPhone)}
          >
            <Text style={styles.contactButtonText}>
              📞 Llamar: {currentAlert.contactPhone}
            </Text>
          </TouchableOpacity>

          {currentAlert.contactEmail && (
            <TouchableOpacity
              style={[styles.contactButton, styles.emailButton]}
              onPress={() => handleEmail(currentAlert.contactEmail)}
            >
              <Text style={styles.contactButtonText}>
                ✉️ Email: {currentAlert.contactEmail}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={[
            styles.statusContainer,
            { 
              backgroundColor: currentAlert.status === 'ACTIVE' 
                ? getTypeColor() + '20' 
                : COLORS.gray + '20' 
            }
          ]}>
            <Text style={[
              styles.statusText,
              { 
                color: currentAlert.status === 'ACTIVE' 
                  ? getTypeColor() 
                  : COLORS.gray 
              }
            ]}>
              {currentAlert.status === 'ACTIVE' ? 'ACTIVA' : 'RESUELTA'}
            </Text>
          </View>
        </View>

        {/* Creator Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Creador</Text>
          <View style={styles.creatorContainer}>
            <Text style={styles.creatorText}>
              👤 Creado por: {currentAlert.username || 'Usuario desconocido'}
            </Text>
            {isAlertOwner() && (
              <Text style={styles.ownerBadge}>
                ✅ Esta es tu alerta
              </Text>
            )}
          </View>
        </View>

        {/* Delete Button - Only show if user owns the alert */}
        {isAlertOwner() && (
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>🗑️ Eliminar Alerta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 5,
    marginLeft: 10,
  },
  shareButtonText: {
    fontSize: 20, // Larger icon for share
    color: COLORS.primary,
  },
  editButton: {
    padding: 5,
    marginLeft: 10,
  },
  editButtonText: {
    fontSize: 20, // Larger icon for edit
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photosSection: {
    marginBottom: 5, // Reduced margin
    alignItems: 'center', // Center content like PhotoGallery or noPhotosText
    position: 'relative', // Needed for absolute positioning of the badge
  },
  photoGallery: {
    // Styles for the photo gallery itself, if needed
    // e.g., height, width, etc.
  },
  noPhotosText: {
    textAlign: 'center',
    color: COLORS.gray,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    marginBottom: 15, // Consistent spacing for sections
  },
  alertTitle: { // New style for the main alert title
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4, // Space between title and pet name if shown
    textAlign: 'center',
  },
  petNameDetailScreen: { // New style for pet name on detail screen
    fontSize: 18,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  petName: { // Existing style, now primarily for pet name if different from title or as fallback
    fontSize: 26, // Keep original styling for now, can be adjusted
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  petDetails: {
    marginBottom: 8,
  },
  petBreed: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  petInfo: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  locationContainer: {
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  rewardContainer: {
    backgroundColor: COLORS.warning + '20',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.warning,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  emailButton: {
    backgroundColor: COLORS.secondary,
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  creatorContainer: {
    backgroundColor: COLORS.lightGray + '40',
    padding: 12,
    borderRadius: 8,
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ownerBadge: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: 24,
    marginBottom: 32,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  noPhotosText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  photoManagementSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 6,
  },
  photoManagementContainer: {
    marginTop: 12,
    marginHorizontal: 16, // Restaurar márgenes para los controles
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 6,
  },
  photoManagementTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  photoPickerContainer: {
    marginTop: 4,
  },
  uploadingContainer: {
    marginTop: 8,
    padding: 4,
  },
});

export default AlertDetailScreen;
