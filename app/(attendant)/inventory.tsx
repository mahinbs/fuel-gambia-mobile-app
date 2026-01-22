import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore, useAuthStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function InventoryScreen() {
  const { user } = useAuthStore();
  const { inventory, fetchInventory, isLoading } = useAttendantStore();

  useEffect(() => {
    if (user && 'stationId' in user) {
      fetchInventory((user as any).stationId || 'station1');
    }
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (!inventory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No inventory data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLowStock = (stock: number) => stock < 1000;
  const petrolPercentage = (inventory.petrolStock / 10000) * 100;
  const dieselPercentage = (inventory.dieselStock / 10000) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Status</Text>
          <Text style={styles.stationName}>{inventory.stationName}</Text>
        </View>

        <Card style={styles.inventoryCard}>
          <View style={styles.inventoryHeader}>
            <Ionicons name="flame" size={32} color="#FF9500" />
            <View style={styles.inventoryHeaderText}>
              <Text style={styles.fuelTypeLabel}>Petrol</Text>
              <Text style={styles.fuelTypeStock}>
                {inventory.petrolStock.toLocaleString()} L
              </Text>
            </View>
            {isLowStock(inventory.petrolStock) && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low</Text>
              </View>
            )}
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${petrolPercentage}%`,
                  backgroundColor: isLowStock(inventory.petrolStock)
                    ? '#FF3B30'
                    : theme.secondary,
                },
              ]}
            />
          </View>
        </Card>

        <Card style={styles.inventoryCard}>
          <View style={styles.inventoryHeader}>
            <Ionicons name="water" size={32} color={theme.primary} />
            <View style={styles.inventoryHeaderText}>
              <Text style={styles.fuelTypeLabel}>Diesel</Text>
              <Text style={styles.fuelTypeStock}>
                {inventory.dieselStock.toLocaleString()} L
              </Text>
            </View>
            {isLowStock(inventory.dieselStock) && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low</Text>
              </View>
            )}
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${dieselPercentage}%`,
                  backgroundColor: isLowStock(inventory.dieselStock)
                    ? '#FF3B30'
                    : theme.secondary,
                },
              ]}
            />
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Stock</Text>
            <Text style={styles.summaryValue}>
              {(inventory.petrolStock + inventory.dieselStock).toLocaleString()} L
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last Updated</Text>
            <Text style={styles.summaryValue}>
              {new Date(inventory.lastUpdated).toLocaleDateString()}
            </Text>
          </View>
        </Card>

        {isLowStock(inventory.petrolStock) ||
          (isLowStock(inventory.dieselStock) && (
            <Card style={styles.alertCard}>
              <View style={styles.alertContent}>
                <Ionicons name="warning" size={24} color="#FF9500" />
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Low Stock Warning</Text>
                  <Text style={styles.alertMessage}>
                    Some fuel types are running low. Please restock soon.
                  </Text>
                </View>
              </View>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    color: '#8E8E93',
  },
  inventoryCard: {
    marginBottom: 16,
    padding: 20,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inventoryHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  fuelTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  fuelTypeStock: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  lowStockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryCard: {
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  alertCard: {
    backgroundColor: '#FFF4E6',
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
