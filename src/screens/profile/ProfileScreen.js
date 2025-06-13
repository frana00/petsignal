import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUserById, updateUser } from '../../services/users';
import { getCredentials, saveUserData, getUserData } from '../../utils/storage';
import { validateProfileForm, hasFormErrors } from '../../utils/validation';
import { COLORS, SUCCESS_MESSAGES } from '../../utils/constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser: updateAuthUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Profile screen focused, reloading data...');
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get stored user data
      const storedUserData = await getUserData();
      const credentials = await getCredentials();
      
      console.log('📱 ProfileScreen - Loading user data:');
      console.log('  - Stored data:', storedUserData);
      console.log('  - Credentials:', credentials ? { username: credentials.username } : 'None');
      console.log('  - Context user:', user);
      
      if (!credentials) {
        throw new Error('No se encontraron credenciales');
      }

      // Use stored user data if available, otherwise use data from AuthContext
      let currentUserData;
      if (storedUserData) {
        // Verify the stored data belongs to the current user
        if (storedUserData.username === credentials.username) {
          currentUserData = {
            id: storedUserData.id || 1,
            username: credentials.username,
            email: storedUserData.email || '',
            phoneNumber: storedUserData.phoneNumber || '',
            subscriptionEmail: storedUserData.subscriptionEmail || '',
            role: storedUserData.role || 'USER',
            createdAt: storedUserData.createdAt || new Date().toISOString(),
          };
        } else {
          console.log('⚠️ Stored data username mismatch! Stored:', storedUserData.username, 'Current:', credentials.username);
          // Create fresh user data for this user
          currentUserData = {
            id: 1,
            username: credentials.username,
            email: '',
            phoneNumber: '',
            subscriptionEmail: '',
            role: 'USER',
            createdAt: new Date().toISOString(),
          };
        }
      } else {
        // Fallback to context data or create minimal user data (no mock emails)
        currentUserData = {
          id: 1,
          username: credentials.username,
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          subscriptionEmail: user?.subscriptionEmail || '',
          role: 'USER',
          createdAt: new Date().toISOString(),
        };
      }

      console.log('📱 Loaded user data for profile:', currentUserData);

      setUserData(currentUserData);
      setEditData({
        email: currentUserData.email,
        phoneNumber: currentUserData.phoneNumber || '',
        subscriptionEmail: currentUserData.subscriptionEmail,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setEditData({
        email: userData.email,
        phoneNumber: userData.phoneNumber || '',
        subscriptionEmail: userData.subscriptionEmail,
      });
      setFormErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSave = async () => {
    // Validate form
    const errors = validateProfileForm(editData);
    
    if (hasFormErrors(errors)) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});

    try {
      // Create updated user object
      const updatedUser = {
        ...userData,
        ...editData,
        updatedAt: new Date().toISOString(),
      };

      console.log('💾 Saving updated user data:', updatedUser);

      // Update local storage
      await saveUserData(updatedUser);
      
      // Update auth context with the relevant fields
      updateAuthUser({
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        subscriptionEmail: editData.subscriptionEmail,
      });
      
      // Update local state
      setUserData(updatedUser);
      setIsEditing(false);

      console.log('✅ Profile updated successfully');
      Alert.alert('Éxito', SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      Alert.alert('Error', err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthContext
            } catch (err) {
              Alert.alert('Error', 'Error al cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  if (loading) {
    return <Loading message="Cargando perfil..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={loadUserData}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
          <Text style={styles.subtitle}>Gestiona tu información personal</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
            <Text style={styles.username}>@{userData?.username}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Usuario"
              value={userData?.username || ''}
              editable={false}
              style={styles.disabledField}
            />

            <Input
              label="Email"
              value={isEditing ? editData.email : userData?.email || ''}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="tu@email.com"
              error={formErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
            />

            <Input
              label="Teléfono"
              value={isEditing ? editData.phoneNumber : userData?.phoneNumber || ''}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="+34123456789"
              error={formErrors.phoneNumber}
              keyboardType="phone-pad"
              editable={isEditing}
            />

            <Input
              label="Email de Notificaciones"
              value={isEditing ? editData.subscriptionEmail : userData?.subscriptionEmail || ''}
              onChangeText={(value) => handleInputChange('subscriptionEmail', value)}
              placeholder="notificaciones@email.com"
              error={formErrors.subscriptionEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
            />

            <View style={styles.metadataContainer}>
              <Text style={styles.metadataLabel}>Miembro desde:</Text>
              <Text style={styles.metadataValue}>
                {formatDate(userData?.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {isEditing ? (
              <View style={styles.editingButtons}>
                <Button
                  title="Cancelar"
                  onPress={handleEditToggle}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <Button
                  title="Guardar"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  style={styles.saveButton}
                />
              </View>
            ) : (
              <Button
                title="Editar Perfil"
                onPress={handleEditToggle}
                style={styles.editButton}
              />
            )}

            {/* Development button - Only in development mode */}
            {__DEV__ && (
              <Button
                title="🛠️ Desarrollo"
                onPress={() => navigation.navigate('Dev')}
                variant="text"
                style={styles.devButton}
              />
            )}

            <Button
              title="Cerrar Sesión"
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
            />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    fontSize: 64,
    marginBottom: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    marginBottom: 24,
  },
  disabledField: {
    opacity: 0.6,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginTop: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metadataValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  editingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    marginBottom: 8,
  },
  devButton: {
    marginBottom: 8,
  },
  logoutButton: {
    borderColor: COLORS.error,
  },
});

export default ProfileScreen;
