import apiClient from './api';
import { Alert, Platform } from 'react-native';

// Conditional imports to avoid NativeEventEmitter errors on web
let ImagePicker = null;
let ImageManipulator = null;

// Initialize native modules only on mobile platforms
if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('expo-image-picker');
    ImageManipulator = require('expo-image-manipulator');
  } catch (error) {
    console.warn('Failed to load native image modules:', error);
  }
} else {
  // On web, we'll use a different approach
  try {
    ImagePicker = require('expo-image-picker');
    ImageManipulator = require('expo-image-manipulator');
  } catch (error) {
    console.warn('Image picker not available on web:', error);
  }
}

// Image configuration
const IMAGE_CONFIG = {
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  QUALITY: 0.8,
  THUMBNAIL_SIZE: 300,
  THUMBNAIL_QUALITY: 0.6,
};

// Request camera and gallery permissions
export const requestPermissions = async () => {
  try {
    // On web, permissions are handled by the browser
    if (Platform.OS === 'web') {
      return { camera: true, gallery: true };
    }
    
    // Check if ImagePicker is available
    if (!ImagePicker) {
      console.warn('ImagePicker not available');
      return { camera: false, gallery: false };
    }
    
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      gallery: galleryPermission.status === 'granted',
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return { camera: false, gallery: false };
  }
};

// Show image picker options
export const showImagePicker = () => {
  return new Promise((resolve) => {
    // On web, show simplified options
    if (Platform.OS === 'web') {
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una imagen de tu dispositivo',
        [
          {
            text: 'Seleccionar Archivo',
            onPress: () => pickImage('gallery').then(resolve),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    } else {
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una opción',
        [
          {
            text: 'Cámara',
            onPress: () => pickImage('camera').then(resolve),
          },
          {
            text: 'Galería',
            onPress: () => pickImage('gallery').then(resolve),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    }
  });
};

// Web-specific image picker fallback
const webImagePicker = () => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            uri: e.target.result,
            width: 800,
            height: 600,
            type: file.type,
            fileSize: file.size,
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
};

// Pick image from camera or gallery
export const pickImage = async (source = 'gallery') => {
  try {
    // Handle web platform with fallback
    if (Platform.OS === 'web') {
      const webResult = await webImagePicker();
      if (webResult) {
        return webResult;
      }
      return null;
    }

    // Check if ImagePicker is available for mobile platforms
    if (!ImagePicker) {
      Alert.alert(
        'Funcionalidad no disponible',
        'La selección de imágenes no está disponible en este entorno.'
      );
      return null;
    }

    const permissions = await requestPermissions();
    
    if (source === 'camera' && !permissions.camera) {
      Alert.alert('Permiso Requerido', 'Se necesita acceso a la cámara');
      return null;
    }
    
    if (source === 'gallery' && !permissions.gallery) {
      Alert.alert('Permiso Requerido', 'Se necesita acceso a la galería');
      return null;
    }

    const options = {
      mediaTypes: ImagePicker?.MediaTypeOptions?.Images || 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };

    let result;
    
    if (source === 'camera') {
      result = await ImagePicker?.launchCameraAsync?.(options);
    } else {
      result = await ImagePicker?.launchImageLibraryAsync?.(options);
    }

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    
    if (error.message && error.message.includes('NativeEventEmitter')) {
      Alert.alert(
        'Funcionalidad no disponible',
        'La selección de imágenes no está disponible en este entorno.'
      );
    } else {
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
    
    return null;
  }
};

// Process and resize image
export const processImage = async (imageUri) => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('ImageManipulator not available, returning original image');
      return { uri: imageUri };
    }

    const result = await ImageManipulator?.manipulateAsync?.(
      imageUri,
      [
        {
          resize: {
            width: IMAGE_CONFIG.MAX_WIDTH,
            height: IMAGE_CONFIG.MAX_HEIGHT,
          },
        },
      ],
      {
        compress: IMAGE_CONFIG.QUALITY,
        format: ImageManipulator?.SaveFormat?.JPEG || 'jpeg',
        base64: false,
      }
    );

    return result || { uri: imageUri };
  } catch (error) {
    console.error('Error processing image:', error);
    // Return original image if processing fails
    return { uri: imageUri };
  }
};

// Generate thumbnail
export const generateThumbnail = async (imageUri) => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('ImageManipulator not available, returning original image as thumbnail');
      return { uri: imageUri };
    }

    const result = await ImageManipulator?.manipulateAsync?.(
      imageUri,
      [
        {
          resize: {
            width: IMAGE_CONFIG.THUMBNAIL_SIZE,
            height: IMAGE_CONFIG.THUMBNAIL_SIZE,
          },
        },
      ],
      {
        compress: IMAGE_CONFIG.THUMBNAIL_QUALITY,
        format: ImageManipulator?.SaveFormat?.JPEG || 'jpeg',
        base64: false,
      }
    );

    return result || { uri: imageUri };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    // Return original image if thumbnail generation fails
    return { uri: imageUri };
  }
};

// Upload photo to backend
export const uploadPhoto = async (imageUri, alertId, description = '') => {
  try {
    const processedImage = await processImage(imageUri);
    const thumbnail = await generateThumbnail(imageUri);

    const formData = new FormData();
    formData.append('photo', {
      uri: processedImage.uri,
      type: 'image/jpeg',
      name: `photo_${Date.now()}.jpg`,
    });
    formData.append('thumbnail', {
      uri: thumbnail.uri,
      type: 'image/jpeg',
      name: `thumb_${Date.now()}.jpg`,
    });
    formData.append('alertId', alertId);
    formData.append('description', description);

    const response = await apiClient.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error(error.response?.data?.message || 'Error al subir foto');
  }
};

// Get photos for an alert
export const getAlertPhotos = async (alertId) => {
  try {
    const response = await apiClient.get(`/photos/alert/${alertId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting alert photos:', error);
    throw new Error('Error al obtener fotos');
  }
};

// Update photo description
export const updatePhotoDescription = async (photoId, description) => {
  try {
    const response = await apiClient.put(`/photos/${photoId}`, {
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating photo description:', error);
    throw new Error('Error al actualizar descripción');
  }
};

// Delete photo
export const deletePhoto = async (photoId) => {
  try {
    await apiClient.delete(`/photos/${photoId}`);
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw new Error('Error al eliminar foto');
  }
};

// Batch upload multiple photos
export const uploadMultiplePhotos = async (images, alertId) => {
  try {
    const uploadPromises = images.map((image, index) => 
      uploadPhoto(image.uri, alertId, image.description || `Foto ${index + 1}`)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple photos:', error);
    throw new Error('Error al subir fotos');
  }
};

// Export photo service object
export const photoService = {
  requestPermissions,
  showImagePicker,
  pickImage,
  processImage,
  generateThumbnail,
  uploadPhoto,
  getAlertPhotos,
  updatePhotoDescription,
  deletePhoto,
  uploadMultiplePhotos,
};
