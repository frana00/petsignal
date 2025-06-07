import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

const PhotoGallery = ({ 
  photos = [], 
  onDeletePhoto, 
  onEditPhoto, 
  editable = false,
  style 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openPhoto = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setModalVisible(false);
  };

  const handleDeletePhoto = (photo) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            onDeletePhoto?.(photo);
            closeModal();
          },
        },
      ]
    );
  };

  const handleEditPhoto = (photo) => {
    closeModal();
    onEditPhoto?.(photo);
  };

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>📷</Text>
        <Text style={styles.emptySubtext}>No hay fotos disponibles</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {photos.map((photo, index) => (
          <View key={photo.id || index} style={styles.photoItem}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => openPhoto(photo)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: photo.url || photo.uri }}
                style={styles.photo}
                resizeMode="cover"
              />
            </TouchableOpacity>
            
            {/* Descripción y información después de la foto */}
            {photo.description && (
              <View style={styles.photoInfoContainer}>
                <Text style={styles.photoDescriptionText}>
                  {photo.description}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Full screen photo modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={closeModal}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <>
                  <Image
                    source={{ uri: selectedPhoto.url || selectedPhoto.uri }}
                    style={styles.fullPhoto}
                    resizeMode="contain"
                  />
                  
                  {/* Photo info */}
                  <View style={styles.photoInfo}>
                    {selectedPhoto.description && (
                      <Text style={styles.photoDescription}>
                        {selectedPhoto.description}
                      </Text>
                    )}
                    
                    {selectedPhoto.uploadedAt && (
                      <Text style={styles.photoDate}>
                        {new Date(selectedPhoto.uploadedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>

                  {/* Action buttons */}
                  {editable && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditPhoto(selectedPhoto)}
                      >
                        <Text style={styles.actionButtonText}>✏️ Editar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeletePhoto(selectedPhoto)}
                      >
                        <Text style={styles.actionButtonText}>🗑️ Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  photoItem: {
    marginBottom: 24,
  },
  photoContainer: {
    width: width - 32, // Todo el ancho menos márgenes
    height: (width - 32) * 0.75, // Relación de aspecto 4:3
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  photoDescriptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullPhoto: {
    width: '100%',
    height: 300,
  },
  photoInfo: {
    padding: 16,
  },
  photoDescription: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  photoDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default PhotoGallery;
