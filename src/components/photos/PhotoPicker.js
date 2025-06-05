import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { showImagePicker, uploadPhoto } from '../../services/photos';
import Button from '../common/Button';
import Loading from '../common/Loading';

const PhotoPicker = ({ 
  alertId, 
  onPhotoUploaded, 
  maxPhotos = 5,
  existingPhotos = [],
  style 
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptions, setDescriptions] = useState([]);

  const canAddMore = existingPhotos.length + selectedImages.length < maxPhotos;

  const handlePickImage = async () => {
    if (!canAddMore) {
      Alert.alert('Límite alcanzado', `Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    try {
      const image = await showImagePicker();
      if (image) {
        setSelectedImages(prev => [...prev, image]);
        setDescriptions(prev => [...prev, '']);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setDescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateDescription = (index, description) => {
    setDescriptions(prev => {
      const newDescriptions = [...prev];
      newDescriptions[index] = description;
      return newDescriptions;
    });
  };

  const openDescriptionModal = (index) => {
    setCurrentImageIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentImageIndex(0);
  };

  const uploadAllPhotos = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Sin fotos', 'Selecciona al menos una foto para subir');
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = selectedImages.map((image, index) =>
        uploadPhoto(image.uri, alertId, descriptions[index] || '')
      );

      const uploadedPhotos = await Promise.all(uploadPromises);
      
      // Clear selected images
      setSelectedImages([]);
      setDescriptions([]);
      
      // Notify parent component
      onPhotoUploaded?.(uploadedPhotos);
      
      Alert.alert('Éxito', 'Fotos subidas correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <View style={[styles.container, style]}>
        <Loading message="Subiendo fotos..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Fotos ({existingPhotos.length + selectedImages.length}/{maxPhotos})
        </Text>
        {canAddMore && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePickImage}
          >
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesList}
        >
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.image}
                resizeMode="cover"
              />
              
              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
              
              {/* Description button */}
              <TouchableOpacity
                style={styles.descriptionButton}
                onPress={() => openDescriptionModal(index)}
              >
                <Text style={styles.descriptionButtonText}>
                  {descriptions[index] ? '📝' : '💬'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload button */}
      {selectedImages.length > 0 && (
        <View style={styles.uploadContainer}>
          <Button
            title={`Subir ${selectedImages.length} foto${selectedImages.length > 1 ? 's' : ''}`}
            onPress={uploadAllPhotos}
            style={styles.uploadButton}
          />
        </View>
      )}

      {/* Empty state */}
      {selectedImages.length === 0 && (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={handlePickImage}
          disabled={!canAddMore}
        >
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>
            {canAddMore ? 'Toca para agregar fotos' : 'Límite de fotos alcanzado'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Description Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Descripción de la foto</Text>
            
            {selectedImages[currentImageIndex] && (
              <Image
                source={{ uri: selectedImages[currentImageIndex].uri }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe esta foto (opcional)"
              value={descriptions[currentImageIndex] || ''}
              onChangeText={(text) => updateDescription(currentImageIndex, text)}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={closeModal}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  imagesList: {
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionButtonText: {
    fontSize: 12,
  },
  uploadContainer: {
    marginTop: 16,
  },
  uploadButton: {
    backgroundColor: COLORS.success,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginVertical: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoPicker;
