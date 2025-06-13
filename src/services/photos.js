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

// Request presigned URLs for photo uploads
export const requestPresignedUrls = async (photoFilenames, alertId = null) => {
  try {
    let url, payload;
    
    if (alertId) {
      // For existing alerts: POST /alerts/{id}/photos
      url = `/alerts/${alertId}/photos`;
      payload = { photoFilenames };
      console.log('📤 EXISTING ALERT: Requesting presigned URLs for alert:', alertId);
    } else {
      // For new alerts, we'll use a generic endpoint
      url = '/photos/presigned-urls';
      payload = { photoFilenames };
      console.log('📤 NEW ALERT: Requesting presigned URLs');
    }
    
    console.log('📤 Request details:', {
      url: url,
      payload: payload,
      alertId: alertId,
      photoFilenames: photoFilenames
    });
    
    const response = await apiClient.post(url, payload);
    
    // Response should be array of {s3ObjectKey, presignedUrl}
    console.log('📥 Received presigned URLs response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      length: response.data ? response.data.length : 0
    });
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.error('❌ Invalid presigned URLs response:', response.data);
      throw new Error('Invalid presigned URLs response from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error requesting presigned URLs:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response available'
    });
    throw new Error(error.response?.data?.message || 'Error al solicitar URLs de subida');
  }
};

// Upload photo directly to S3 using presigned URL
export const uploadToS3 = async (imageUri, presignedUrl, contentType = 'image/jpeg') => {
  try {
    console.log('📤 Starting S3 upload:', {
      imageUri: imageUri,
      presignedUrlLength: presignedUrl ? presignedUrl.length : 0,
      presignedUrlStart: presignedUrl ? presignedUrl.substring(0, 100) + '...' : 'null',
      contentType: contentType
    });
    
    // Process image before uploading
    console.log('🔄 Processing image...');
    const processedImage = await processImage(imageUri);
    console.log('✅ Image processed:', {
      originalUri: imageUri,
      processedUri: processedImage.uri,
      uriType: typeof processedImage.uri
    });
    
    let uploadBody;
    
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform: Converting to blob...');
      // On web, convert data URL to blob
      const response = await fetch(processedImage.uri);
      uploadBody = await response.blob();
      console.log('✅ Blob created:', { size: uploadBody.size, type: uploadBody.type });
    } else {
      console.log('📱 Mobile platform: Using FormData format...');
      // On React Native, for S3 presigned URLs we need to send raw binary data
      // Read the image file as binary data
      uploadBody = {
        uri: processedImage.uri,
        type: contentType,
        name: 'photo.jpg',
      };
      console.log('✅ Upload body prepared:', uploadBody);
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': contentType,
    };
    console.log('📋 Upload headers:', headers);
    
    // Upload directly to S3
    console.log('🚀 Sending PUT request to S3...');
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: headers,
      body: uploadBody,
    });
    
    console.log('📡 S3 response received:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok,
      headers: Object.fromEntries(uploadResponse.headers.entries())
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText: errorText
      });
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    console.log('✅ Successfully uploaded to S3');
    return true;
  } catch (error) {
    console.error('❌ Error uploading to S3:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Error al subir foto a S3: ${error.message}`);
  }
};

// Upload photo using the full presigned URL flow
export const uploadPhoto = async (imageUri, alertId, description = '', filename = null) => {
  try {
    // Generate filename if not provided
    const photoFilename = filename || `photo_${Date.now()}.jpg`;
    
    // Request presigned URL
    const presignedData = await requestPresignedUrls([photoFilename], alertId);
    
    if (!presignedData || presignedData.length === 0) {
      throw new Error('No presigned URL received');
    }
    
    const { s3ObjectKey, presignedUrl } = presignedData[0];
    
    // Upload to S3
    await uploadToS3(imageUri, presignedUrl);
    
    return {
      s3ObjectKey,
      description,
      uploaded: true,
    };
  } catch (error) {
    console.error('Error in photo upload flow:', error);
    throw new Error(error.message || 'Error al subir foto');
  }
};

// Get photos for an alert
export const getAlertPhotos = async (alertId) => {
  try {
    console.log('📥 Getting photos for alert:', alertId);
    const response = await apiClient.get(`/alerts/${alertId}`);
    
    // According to the backend documentation, photos should come with presigned URLs
    // in the AlertResponse.photoUrls field
    if (response.data && response.data.photoUrls) {
      console.log('📸 Found', response.data.photoUrls.length, 'photos with presigned URLs');
      
      // Transform photoUrls to the format expected by PhotoGallery
      const photos = response.data.photoUrls.map((photoUrl, index) => ({
        id: photoUrl.s3ObjectKey || index,
        url: photoUrl.presignedUrl, // This should be a GET presigned URL
        s3ObjectKey: photoUrl.s3ObjectKey,
        description: photoUrl.description || '',
        uploadedAt: photoUrl.uploadedAt || new Date().toISOString(),
      }));
      
      return photos;
    }
    
    // Fallback: try the direct photos endpoint
    console.log('📸 No photoUrls in alert response, trying direct photos endpoint');
    const photosResponse = await apiClient.get(`/photos/alert/${alertId}`);
    return photosResponse.data || [];
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

// Batch upload multiple photos using presigned URLs
export const uploadMultiplePhotos = async (images, alertId = null) => {
  try {
    console.log('🚀 BATCH UPLOAD START:', {
      imageCount: images.length,
      alertId: alertId,
      alertIdType: typeof alertId,
      images: images.map((img, i) => ({
        index: i,
        uri: img.uri,
        description: img.description,
        filename: img.filename
      }))
    });
    
    // Prepare filenames
    const photoFilenames = images.map((_, index) => `photo_${Date.now()}_${index}.jpg`);
    
    console.log('� Generated photo filenames:', photoFilenames);
    
    // Request presigned URLs for all photos
    console.log('📤 Requesting presigned URLs...');
    const presignedData = await requestPresignedUrls(photoFilenames, alertId);
    console.log('📥 Presigned URLs received:', presignedData);
    
    if (!presignedData || presignedData.length !== images.length) {
      const errorMsg = `Mismatch between requested (${images.length}) and received (${presignedData ? presignedData.length : 0}) presigned URLs`;
      console.error('❌ URL count mismatch:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Upload each photo to S3
    console.log('📤 Starting individual photo uploads...');
    const uploadPromises = images.map(async (image, index) => {
      const { s3ObjectKey, presignedUrl } = presignedData[index];
      
      console.log(`📸 Uploading photo ${index + 1}/${images.length}:`, {
        imageUri: image.uri,
        s3ObjectKey: s3ObjectKey,
        description: image.description
      });
      
      try {
        await uploadToS3(image.uri, presignedUrl);
        console.log(`✅ Photo ${index + 1} uploaded successfully`);
        return {
          s3ObjectKey,
          description: image.description || `Foto ${index + 1}`,
          uploaded: true,
        };
      } catch (error) {
        console.error(`❌ Photo ${index + 1} upload failed:`, error.message);
        return {
          s3ObjectKey,
          description: image.description || `Foto ${index + 1}`,
          uploaded: false,
          error: error.message,
        };
      }
    });
    
    console.log('⏳ Waiting for all uploads to complete...');
    const results = await Promise.all(uploadPromises);
    
    // Log results
    const successCount = results.filter(r => r.uploaded).length;
    const failureCount = results.length - successCount;
    
    console.log('📊 BATCH UPLOAD RESULTS:', {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results: results
    });
    
    if (failureCount > 0) {
      console.warn('⚠️ Some photos failed to upload:', results.filter(r => !r.uploaded));
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error in batch photo upload:', {
      message: error.message,
      stack: error.stack,
      alertId: alertId,
      imageCount: images ? images.length : 0
    });
    throw new Error(error.message || 'Error al subir fotos');
  }
};

// Export photo service object
export const photoService = {
  requestPermissions,
  showImagePicker,
  pickImage,
  processImage,
  generateThumbnail,
  requestPresignedUrls,
  uploadToS3,
  uploadPhoto,
  getAlertPhotos,
  updatePhotoDescription,
  deletePhoto,
  uploadMultiplePhotos,
};
