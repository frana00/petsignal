import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { COLORS, ALERT_TYPES, PET_SEX } from '../../utils/constants';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { showImagePicker } from '../../services/photos';

// Note: Temporarily removed react-native-date-picker due to NativeEventEmitter issues
// Will use platform-specific date picker implementations

const AlertForm = ({ 
  initialData = null, 
  onSubmit, 
  loading = false,
  style 
}) => {
  const [formData, setFormData] = useState({
    type: ALERT_TYPES.LOST,
    title: '',
    petName: '',
    breed: '',
    color: '',
    sex: PET_SEX.UNKNOWN,
    age: '',
    size: 'MEDIUM',
    description: '',
    location: '',
    postalCode: '',
    countryCode: 'ES',
    contactPhone: '',
    contactEmail: '',
    date: new Date(),
    reward: '',
    chipNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        date: initialData.date ? new Date(initialData.date) : new Date(),
      });
    }
  }, [initialData]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título de la alerta es requerido';
    }

    if (!formData.petName.trim()) {
      newErrors.petName = 'El nombre de la mascota es requerido';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'La raza es requerida';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'El color es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }

    if (!formData.countryCode.trim()) {
      newErrors.countryCode = 'El código del país es requerido';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'El teléfono de contacto es requerido';
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 0)) {
      newErrors.age = 'La edad debe ser un número válido';
    }

    if (formData.reward && (isNaN(formData.reward) || formData.reward < 0)) {
      newErrors.reward = 'La recompensa debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        // Required backend fields
        title: formData.title,
        type: formData.type,
        description: formData.description,
        breed: formData.breed,
        sex: formData.sex,
        postalCode: formData.postalCode,
        countryCode: formData.countryCode,
        date: formData.date.toISOString(),
        status: 'ACTIVE', // Default status
        
        // Optional fields
        chipNumber: formData.chipNumber || null,
        
        // Custom fields for our app (will be stored in description or handled separately)
        petName: formData.petName,
        color: formData.color,
        age: formData.age ? parseInt(formData.age) : null,
        size: formData.size,
        location: formData.location,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        reward: formData.reward ? parseFloat(formData.reward) : null,
        
        // Photos
        photos: selectedPhotos,
      };
      onSubmit?.(submitData);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddPhoto = async () => {
    try {
      const result = await showImagePicker();
      if (result) {
        setSelectedPhotos(prev => [...prev, result]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Alert Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Alerta</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === ALERT_TYPES.LOST && styles.typeButtonActive,
              { backgroundColor: ALERT_TYPES.LOST === formData.type ? COLORS.primary : COLORS.lightGray }
            ]}
            onPress={() => updateField('type', ALERT_TYPES.LOST)}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === ALERT_TYPES.LOST && styles.typeButtonTextActive
            ]}>
              🔍 PERDIDO
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === ALERT_TYPES.SEEN && styles.typeButtonActive,
              { backgroundColor: ALERT_TYPES.SEEN === formData.type ? COLORS.secondary : COLORS.lightGray }
            ]}
            onPress={() => updateField('type', ALERT_TYPES.SEEN)}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === ALERT_TYPES.SEEN && styles.typeButtonTextActive
            ]}>
              👀 ENCONTRADO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Field */}
        <Input
          label="Título de la alerta *"
          value={formData.title}
          onChangeText={(value) => updateField('title', value)}
          placeholder={formData.type === ALERT_TYPES.LOST ? "Ej: Perro perdido en el centro" : "Ej: Gato encontrado en el parque"}
          error={errors.title}
        />
      </View>

      {/* Pet Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Mascota</Text>
        
        <Input
          label="Nombre de la mascota *"
          value={formData.petName}
          onChangeText={(value) => updateField('petName', value)}
          placeholder="Ej: Max, Luna, etc."
          error={errors.petName}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              label="Raza *"
              value={formData.breed}
              onChangeText={(value) => updateField('breed', value)}
              placeholder="Ej: Golden Retriever"
              error={errors.breed}
            />
          </View>
          
          <View style={styles.halfWidth}>
            <Input
              label="Color *"
              value={formData.color}
              onChangeText={(value) => updateField('color', value)}
              placeholder="Ej: Dorado"
              error={errors.color}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.inputLabel}>Sexo</Text>
            <View style={styles.sexSelector}>
              {Object.values(PET_SEX).map((sex) => (
                <TouchableOpacity
                  key={sex}
                  style={[
                    styles.sexButton,
                    formData.sex === sex && styles.sexButtonActive
                  ]}
                  onPress={() => updateField('sex', sex)}
                >
                  <Text style={[
                    styles.sexButtonText,
                    formData.sex === sex && styles.sexButtonTextActive
                  ]}>
                    {sex === PET_SEX.MALE ? '♂' : sex === PET_SEX.FEMALE ? '♀' : '?'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.halfWidth}>
            <Input
              label="Edad (años)"
              value={formData.age}
              onChangeText={(value) => updateField('age', value)}
              placeholder="Ej: 2"
              keyboardType="numeric"
              error={errors.age}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Tamaño</Text>
        <View style={styles.sizeSelector}>
          {['SMALL', 'MEDIUM', 'LARGE'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                formData.size === size && styles.sizeButtonActive
              ]}
              onPress={() => updateField('size', size)}
            >
              <Text style={[
                styles.sizeButtonText,
                formData.size === size && styles.sizeButtonTextActive
              ]}>
                {size === 'SMALL' ? 'Pequeño' : size === 'MEDIUM' ? 'Mediano' : 'Grande'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Input
          label="Descripción *"
          value={formData.description}
          onChangeText={(value) => updateField('description', value)}
          placeholder="Describe características distintivas, comportamiento, etc."
          multiline
          numberOfLines={4}
          error={errors.description}
        />

        <Input
          label="Número de Chip (opcional)"
          value={formData.chipNumber}
          onChangeText={(value) => updateField('chipNumber', value)}
          placeholder="Ej: 999934234321432"
          keyboardType="numeric"
        />
      </View>

      {/* Location and Date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación y Fecha</Text>
        
        <Input
          label="Ubicación *"
          value={formData.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="Ej: Parque Central, Barrio Norte"
          error={errors.location}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              label="Código Postal *"
              value={formData.postalCode}
              onChangeText={(value) => updateField('postalCode', value)}
              placeholder="Ej: 28001"
              error={errors.postalCode}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.halfWidth}>
            <Input
              label="País *"
              value={formData.countryCode}
              onChangeText={(value) => updateField('countryCode', value)}
              placeholder="Ej: ES"
              error={errors.countryCode}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.inputLabel}>
            Fecha del {formData.type === ALERT_TYPES.LOST ? 'extravío' : 'avistamiento'}
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅 {formatDate(formData.date)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>
        
        <Input
          label="Teléfono *"
          value={formData.contactPhone}
          onChangeText={(value) => updateField('contactPhone', value)}
          placeholder="Ej: +1234567890"
          keyboardType="phone-pad"
          error={errors.contactPhone}
        />

        <Input
          label="Email"
          value={formData.contactEmail}
          onChangeText={(value) => updateField('contactEmail', value)}
          placeholder="email@ejemplo.com"
          keyboardType="email-address"
          error={errors.contactEmail}
        />

        {formData.type === ALERT_TYPES.LOST && (
          <Input
            label="Recompensa ($)"
            value={formData.reward}
            onChangeText={(value) => updateField('reward', value)}
            placeholder="Opcional"
            keyboardType="numeric"
            error={errors.reward}
          />
        )}
      </View>

      {/* Photos Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fotos (opcional)</Text>
        
        <View style={styles.photosContainer}>
          {selectedPhotos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemoveButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Text style={styles.photoRemoveButtonText}>✖</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={handleAddPhoto}
          >
            <Text style={styles.addPhotoButtonText}>+ Agregar Foto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title={initialData ? 'Actualizar Alerta' : 'Crear Alerta'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Seleccionar fecha</Text>
            
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  updateField('date', selectedDate);
                }}
                style={{
                  padding: 10,
                  fontSize: 16,
                  border: '1px solid #ccc',
                  borderRadius: 5,
                  marginVertical: 10,
                  width: '100%',
                }}
              />
            ) : (
              <View style={styles.mobileDateContainer}>
                <Text style={styles.mobileDateText}>
                  {formatDate(formData.date)}
                </Text>
                <Text style={styles.mobileDateHint}>
                  Use los botones de abajo para cambiar la fecha
                </Text>
                <View style={styles.mobileDateButtons}>
                  <TouchableOpacity
                    style={styles.mobileDateButton}
                    onPress={() => {
                      const yesterday = new Date(formData.date);
                      yesterday.setDate(yesterday.getDate() - 1);
                      updateField('date', yesterday);
                    }}
                  >
                    <Text style={styles.mobileDateButtonText}>← Ayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mobileDateButton}
                    onPress={() => {
                      updateField('date', new Date());
                    }}
                  >
                    <Text style={styles.mobileDateButtonText}>Hoy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mobileDateButton}
                    onPress={() => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      updateField('date', weekAgo);
                    }}
                  >
                    <Text style={styles.mobileDateButtonText}>Hace 1 semana</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.cancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.confirmButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    // backgroundColor set dynamically
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  sexSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  sexButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sexButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sexButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },
  sexButtonTextActive: {
    color: COLORS.white,
  },
  sizeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  sizeButtonTextActive: {
    color: COLORS.white,
  },
  dateContainer: {
    marginTop: 16,
  },
  dateButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  submitButton: {
    paddingVertical: 16,
  },
  
  // Date picker styles
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: COLORS.text,
  },
  mobileDateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mobileDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  mobileDateHint: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 15,
  },
  mobileDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  mobileDateButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  mobileDateButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  datePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: COLORS.text,
    fontWeight: '500',
  },
  confirmButtonText: {
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemoveButton: {
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
  photoRemoveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  addPhotoButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 16,
  },
});

export default AlertForm;
