import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore, useAuthStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function AttendantDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { inventory, fetchInventory, recentTransactions, fetchRecentTransactions, isLoading } =
    useAttendantStore();

  useEffect(() => {
    const stationId = (user && 'stationId' in user && (user as any).stationId) 
      ? (user as any).stationId 
      : 'station1';
    
    fetchInventory(stationId);
    fetchRecentTransactions();
  }, [user, fetchInventory, fetchRecentTransactions]);

  if (isLoading || !inventory) {
    return <Loading />;
  }

  const isLowStock = (stock: number) => stock < 1000;
  const petrolPercentage = (inventory.petrolStock / 10000) * 100;
  const dieselPercentage = (inventory.dieselStock / 10000) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerGradient, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.userName}>{user?.name || 'Attendant'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(attendant)/profile')}
            >
              <Ionicons name="person-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.stationInfo}>
            <Ionicons name="storefront" size={16} color="#FFFFFF" />
            <Text style={styles.stationName}>{inventory.stationName}</Text>
          </View>
        </View>

        {/* Scanner Card */}
        <View style={styles.scannerContainer}>
          <Card style={[styles.scannerCard, { backgroundColor: '#5856D6' }]}>
            <View style={styles.scannerContent}>
              <View style={styles.scannerIconContainer}>
                <Ionicons name="qr-code" size={48} color="#FFFFFF" />
              </View>
              <View style={styles.scannerText}>
                <Text style={styles.scannerTitle}>Scan QR Code</Text>
                <Text style={styles.scannerSubtitle}>
                  Scan customer QR code to validate and dispense fuel
                </Text>
              </View>
            </View>
            <Button
              title="Open Scanner"
              onPress={() => router.push('/(attendant)/scanner')}
              style={styles.scannerButton}
              textStyle={styles.scannerButtonText}
            />
          </Card>
        </View>

        {/* Inventory Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Status</Text>
          <View style={styles.inventoryContainer}>
            <Card style={[styles.inventoryCard, isLowStock(inventory.petrolStock) && styles.lowStockCard]}>
              <View style={styles.inventoryHeader}>
                <View style={[styles.inventoryIconContainer, { backgroundColor: '#FFF4E6' }]}>
                  <Ionicons name="flame" size={28} color="#FF9500" />
                </View>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.inventoryLabel}>Petrol</Text>
                  <Text style={styles.inventoryStock}>
                    {inventory.petrolStock.toLocaleString()} L
                  </Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(petrolPercentage, 100)}%`,
                        backgroundColor: isLowStock(inventory.petrolStock) ? '#FF3B30' : theme.secondary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {petrolPercentage.toFixed(0)}% capacity
                </Text>
              </View>
              {isLowStock(inventory.petrolStock) && (
                <View style={styles.lowStockBadge}>
                  <Ionicons name="warning" size={14} color="#FF3B30" />
                  <Text style={styles.lowStockText}>Low Stock</Text>
                </View>
              )}
            </Card>

            <Card style={[styles.inventoryCard, isLowStock(inventory.dieselStock) && styles.lowStockCard]}>
              <View style={styles.inventoryHeader}>
                <View style={[styles.inventoryIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="water" size={28} color={theme.primary} />
                </View>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.inventoryLabel}>Diesel</Text>
                  <Text style={styles.inventoryStock}>
                    {inventory.dieselStock.toLocaleString()} L
                  </Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(dieselPercentage, 100)}%`,
                        backgroundColor: isLowStock(inventory.dieselStock) ? '#FF3B30' : theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {dieselPercentage.toFixed(0)}% capacity
                </Text>
              </View>
              {isLowStock(inventory.dieselStock) && (
                <View style={styles.lowStockBadge}>
                  <Ionicons name="warning" size={14} color="#FF3B30" />
                  <Text style={styles.lowStockText}>Low Stock</Text>
                </View>
              )}
            </Card>
          </View>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                onPress={() => router.push('/(attendant)/transactions')}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.transactionsList}>
              {recentTransactions.slice(0, 3).map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        {
                          backgroundColor:
                            transaction.fuelType === 'PETROL'
                              ? '#FFF4E6'
                              : '#E3F2FD',
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={transaction.fuelType === 'PETROL' ? '#FF9500' : theme.primary}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionAmount}>
                        {transaction.amount} GMD
                      </Text>
                      <Text style={styles.transactionDetails}>
                        {transaction.fuelType} • {transaction.liters.toFixed(2)}L
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(attendant)/scanner')}
          >
            <Ionicons name="scan" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>Scanner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(attendant)/transactions')}
          >
            <Ionicons name="receipt" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(attendant)/inventory')}
          >
            <Ionicons name="cube" size={24} color={theme.primary} />
            <Text style={styles.quickLinkText}>Inventory</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  stationName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scannerContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  scannerCard: {
    padding: 24,
    borderRadius: 20,
  },
  scannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scannerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scannerText: {
    flex: 1,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  scannerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  scannerButtonText: {
    color: '#000000',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inventoryContainer: {
    gap: 12,
  },
  inventoryCard: {
    padding: 20,
    borderRadius: 16,
  },
  lowStockCard: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inventoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  inventoryStock: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 6,
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
