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
import { getAlertPhotos } from '../../services/photos';
import { COLORS, ALERT_TYPES, PET_SEX } from '../../utils/constants';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import PhotoGallery from '../../components/photos/PhotoGallery';
import Button from '../../components/common/Button';

const AlertDetailScreen = ({ route, navigation }) => {
  const { alertId } = route.params;
  const { loadAlertById, currentAlert, loading, error, removeAlert } = useAlert();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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
    const url = `mailto:${email}?subject=Consulta sobre ${currentAlert.petName}`;
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

${currentAlert.petName || 'Sin nombre'}
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
        title: `${currentAlert.type === ALERT_TYPES.LOST ? 'Mascota Perdida' : 'Mascota Encontrada'} - ${currentAlert.petName}`,
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

  const getSizeText = (size) => {
    switch (size) {
      case 'SMALL': return 'Pequeño';
      case 'MEDIUM': return 'Mediano';
      case 'LARGE': return 'Grande';
      default: return 'No especificado';
    }
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
        {/* Alert Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
          <Text style={styles.typeBadgeText}>
            {currentAlert.type === ALERT_TYPES.LOST ? '🔍' : '👀'} {getTypeText()}
          </Text>
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.petName}>
            {currentAlert.petName || 'Sin nombre'}
          </Text>
          
          <View style={styles.petDetails}>
            <Text style={styles.petBreed}>
              {currentAlert.breed} • {currentAlert.color}
            </Text>
            <Text style={styles.petInfo}>
              {getSexIcon(currentAlert.sex)} {getSizeText(currentAlert.size)}
              {currentAlert.age && ` • ${currentAlert.age} años`}
            </Text>
          </View>
        </View>

        {/* Photos */}
        {(photos.length > 0 || loadingPhotos) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos</Text>
            {loadingPhotos ? (
              <Loading message="Cargando fotos..." />
            ) : (
              <PhotoGallery photos={photos} />
            )}
          </View>
        )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 20,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
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
});

export default AlertDetailScreen;
