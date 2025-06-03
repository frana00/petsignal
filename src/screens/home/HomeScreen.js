import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getAlerts } from '../../services/alerts';
import { COLORS, ALERT_TYPES, PAGINATION } from '../../utils/constants';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const AlertItem = ({ item, onPress }) => {
  const getTypeColor = () => {
    return item.type === ALERT_TYPES.LOST ? COLORS.primary : COLORS.secondary;
  };

  const getTypeText = () => {
    return item.type === ALERT_TYPES.LOST ? 'PERDIDO' : 'ENCONTRADO';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <TouchableOpacity style={styles.alertItem} onPress={() => onPress(item)}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertTypeTag, { backgroundColor: getTypeColor() }]}>
          <Text style={styles.alertTypeText}>{getTypeText()}</Text>
        </View>
        <Text style={styles.alertDate}>{formatDate(item.date)}</Text>
      </View>
      
      <Text style={styles.alertTitle} numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text style={styles.alertDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.alertFooter}>
        <Text style={styles.alertLocation}>
          📍 {item.postalCode}, {item.countryCode}
        </Text>
        {item.breed && (
          <Text style={styles.alertBreed}>🐕 {item.breed}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(null); // null = all, LOST, SEEN
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadAlerts = useCallback(async (pageNum = 0, filterType = null, isRefresh = false) => {
    try {
      if (pageNum === 0) {
        setError(null);
        if (!isRefresh) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const options = {
        page: pageNum,
        size: PAGINATION.DEFAULT_SIZE,
        status: 'ACTIVE', // Only show active alerts
      };

      if (filterType) {
        options.type = filterType;
      }

      const data = await getAlerts(options);
      
      if (pageNum === 0) {
        setAlerts(data);
      } else {
        setAlerts(prev => [...prev, ...data]);
      }

      setHasMore(data.length === PAGINATION.DEFAULT_SIZE);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      if (pageNum === 0) {
        setAlerts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts(0, filter);
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts(0, filter, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAlerts(page + 1, filter);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleAlertPress = (alert) => {
    // TODO: Navigate to alert detail screen
    Alert.alert('Detalle de Alerta', `${alert.title}\n\n${alert.description}`);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>PetSignal</Text>
      <TouchableOpacity 
        onPress={handleProfilePress} 
        style={styles.profileButton}
        accessibilityLabel="Ir a perfil de usuario"
        accessibilityHint="Abre la pantalla de perfil donde puedes ver y editar tu información"
        accessibilityRole="button"
      >
        <Text style={styles.profileButtonText}>👤</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filtrar por:</Text>
      <View style={styles.filterButtons}>
        <Button
          title="Todos"
          onPress={() => handleFilterChange(null)}
          variant={filter === null ? 'primary' : 'outline'}
          style={styles.filterButton}
        />
        <Button
          title="Perdidos"
          onPress={() => handleFilterChange(ALERT_TYPES.LOST)}
          variant={filter === ALERT_TYPES.LOST ? 'primary' : 'outline'}
          style={styles.filterButton}
        />
        <Button
          title="Encontrados"
          onPress={() => handleFilterChange(ALERT_TYPES.SEEN)}
          variant={filter === ALERT_TYPES.SEEN ? 'secondary' : 'outline'}
          style={styles.filterButton}
        />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <Loading message="Cargando más alertas..." />
      </View>
    );
  };

  if (loading && !refreshing) {
    return <Loading message="Cargando alertas..." />;
  }

  if (error && alerts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={error}
          onRetry={() => loadAlerts(0, filter)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AlertItem item={item} onPress={handleAlertPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            message="No hay alertas disponibles"
            icon="🔍"
          />
        }
        contentContainerStyle={alerts.length === 0 ? styles.emptyContainer : null}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileButton: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileButtonText: {
    fontSize: 20,
  },
  filtersContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
  },
  alertItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertTypeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  alertBreed: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingMore: {
    padding: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});

export default HomeScreen;
