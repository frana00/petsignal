import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS, ALERT_TYPES } from '../../utils/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const AlertCard = ({ alert, onPress, style }) => {
  const getTypeColor = () => {
    return alert.type === ALERT_TYPES.LOST ? COLORS.primary : COLORS.secondary;
  };

  const getTypeText = () => {
    return alert.type === ALERT_TYPES.LOST ? 'PERDIDO' : 'ENCONTRADO';
  };

  const getStatusColor = () => {
    return alert.status === 'ACTIVE' ? getTypeColor() : COLORS.gray;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Sin ubicación';
    if (location.length > 25) {
      return location.substring(0, 25) + '...';
    }
    return location;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(alert)}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {alert.photoUrl ? (
          <Image
            source={{ uri: alert.photoUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: getTypeColor() + '20' }]}>
            <Text style={[styles.imagePlaceholderText, { color: getTypeColor() }]}>
              {alert.type === ALERT_TYPES.LOST ? '🐕' : '👀'}
            </Text>
          </View>
        )}
        
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
          <Text style={styles.typeBadgeText}>{getTypeText()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {alert.petName || 'Sin nombre'}
        </Text>
        
        <Text style={styles.breed} numberOfLines={1}>
          {alert.breed || 'Raza no especificada'}
        </Text>
        
        <Text style={styles.location} numberOfLines={1}>
          📍 {formatLocation(alert.location)}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>
            {formatDate(alert.date || alert.createdAt)}
          </Text>
          
          {alert.status !== 'ACTIVE' && (
            <View style={[styles.statusBadge, { backgroundColor: COLORS.gray }]}>
              <Text style={styles.statusBadgeText}>RESUELTO</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  breed: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
});

export default AlertCard;
