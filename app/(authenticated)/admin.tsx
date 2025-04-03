import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, DataTable, Paragraph, Title, Searchbar, Chip, Badge, Button, useTheme, Menu, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';

// Admin Dashboard Page
export default function AdminDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPagination, setTransactionsPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  const [usersPagination, setUsersPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user || user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      return;
    }
    
    fetchStatistics();
    fetchUsers(1);
    fetchTransactions(1);
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/statistics');
      setStatistics(response);
    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (page) => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/users', { page, limit: 10 });
      setUsers(response.users);
      setUsersPagination(response.pagination);
      setUsersPage(page);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (page, status = '') => {
    try {
      setIsLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      
      const response = await api.get('/api/admin/transactions', params);
      setTransactions(response.transactions);
      setTransactionsPagination(response.pagination);
      setTransactionsPage(page);
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const applyStatusFilter = (status) => {
    setStatusFilter(status);
    fetchTransactions(1, status);
    setMenuVisible(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      case 'failed': return theme.colors.error;
      case 'processing': return theme.colors.info;
      default: return theme.colors.placeholder;
    }
  };

  const renderDashboard = () => {
    if (!statistics) return <ActivityIndicator color={theme.colors.primary} />;
    
    return (
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Transaction Overview</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Total</Paragraph>
                <Text style={styles.statValue}>{statistics.totalCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Completed</Paragraph>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {statistics.completedCount}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Pending</Paragraph>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {statistics.pendingCount}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Failed</Paragraph>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {statistics.failedCount}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Volume</Title>
            <Text style={styles.volumeText}>
              Total Volume (CAD): {formatCurrency(statistics.totalAmountCAD, 'CAD')}
            </Text>
            <View style={styles.timeStats}>
              <View style={styles.timeStatItem}>
                <Paragraph>Last 24h</Paragraph>
                <Text style={styles.timeStatValue}>{statistics.last24Hours}</Text>
              </View>
              <View style={styles.timeStatItem}>
                <Paragraph>Last 7d</Paragraph>
                <Text style={styles.timeStatValue}>{statistics.last7Days}</Text>
              </View>
              <View style={styles.timeStatItem}>
                <Paragraph>Last 30d</Paragraph>
                <Text style={styles.timeStatValue}>{statistics.last30Days}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Currency Distribution</Title>
            {Object.entries(statistics.currencyDistribution || {}).map(([currency, data]) => (
              <View key={currency} style={styles.distributionRow}>
                <Text style={styles.currencyCode}>{currency}</Text>
                <Text style={styles.currencyCount}>{data.count} transactions</Text>
                <Text style={styles.currencyAmount}>
                  {formatCurrency(data.amount, currency)}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Country Distribution</Title>
            <View style={styles.chipContainer}>
              {Object.entries(statistics.countryDistribution || {}).map(([country, count]) => (
                <Chip key={country} style={styles.chip}>
                  {country} ({count})
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  const renderUsers = () => {
    return (
      <View style={styles.container}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Email</DataTable.Title>
            <DataTable.Title>Joined</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
          </DataTable.Header>

          {users.map((user) => (
            <DataTable.Row key={user.id}>
              <DataTable.Cell>{`${user.firstName} ${user.lastName}`}</DataTable.Cell>
              <DataTable.Cell>{user.email}</DataTable.Cell>
              <DataTable.Cell>{formatDate(user.createdAt)}</DataTable.Cell>
              <DataTable.Cell>
                <Badge
                  size={20}
                  style={{
                    backgroundColor: user.isVerified ? theme.colors.success : theme.colors.warning
                  }}
                >
                  {user.isVerified ? 'Verified' : 'Pending'}
                </Badge>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
        
        <View style={styles.pagination}>
          <Button
            mode="text"
            disabled={usersPagination.page <= 1}
            onPress={() => fetchUsers(usersPagination.page - 1)}
          >
            Previous
          </Button>
          <Text style={styles.paginationText}>
            Page {usersPagination.page} of {usersPagination.pages}
          </Text>
          <Button
            mode="text"
            disabled={usersPagination.page >= usersPagination.pages}
            onPress={() => fetchUsers(usersPagination.page + 1)}
          >
            Next
          </Button>
        </View>
      </View>
    );
  };

  const renderTransactions = () => {
    return (
      <View style={styles.container}>
        <View style={styles.filterRow}>
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setMenuVisible(true)}
                style={styles.filterButton}
                icon="filter-variant"
              >
                {statusFilter || 'All'}
              </Button>
            }
          >
            <Menu.Item onPress={() => applyStatusFilter('')} title="All" />
            <Menu.Item onPress={() => applyStatusFilter('pending')} title="Pending" />
            <Menu.Item onPress={() => applyStatusFilter('completed')} title="Completed" />
            <Menu.Item onPress={() => applyStatusFilter('processing')} title="Processing" />
            <Menu.Item onPress={() => applyStatusFilter('failed')} title="Failed" />
            <Menu.Item onPress={() => applyStatusFilter('cancelled')} title="Cancelled" />
          </Menu>
        </View>
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>ID</DataTable.Title>
            <DataTable.Title>Beneficiary</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
          </DataTable.Header>

          {transactions.map((transaction) => (
            <DataTable.Row key={transaction.id}>
              <DataTable.Cell>{transaction.id.substring(0, 8)}</DataTable.Cell>
              <DataTable.Cell>{transaction.beneficiaryName}</DataTable.Cell>
              <DataTable.Cell numeric>
                {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
              </DataTable.Cell>
              <DataTable.Cell>
                <Badge
                  size={20}
                  style={{
                    backgroundColor: getStatusColor(transaction.status)
                  }}
                >
                  {transaction.status}
                </Badge>
              </DataTable.Cell>
              <DataTable.Cell>{formatDate(transaction.createdAt)}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
        
        <View style={styles.pagination}>
          <Button
            mode="text"
            disabled={transactionsPagination.page <= 1}
            onPress={() => fetchTransactions(transactionsPagination.page - 1, statusFilter)}
          >
            Previous
          </Button>
          <Text style={styles.paginationText}>
            Page {transactionsPagination.page} of {transactionsPagination.pages}
          </Text>
          <Button
            mode="text"
            disabled={transactionsPagination.page >= transactionsPagination.pages}
            onPress={() => fetchTransactions(transactionsPagination.page + 1, statusFilter)}
          >
            Next
          </Button>
        </View>
      </View>
    );
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Header title="Admin Dashboard" />
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
          <Title style={styles.accessDeniedTitle}>Access Denied</Title>
          <Paragraph>You do not have permission to access the admin dashboard.</Paragraph>
        </View>
        <TabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 0 && styles.activeTab]} 
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 1 && styles.activeTab]} 
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 2 && styles.activeTab]} 
          onPress={() => setActiveTab(2)}
        >
          <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContent}>
        {activeTab === 0 && (
          isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
          ) : (
            renderDashboard()
          )
        )}
        
        {activeTab === 1 && (
          isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
          ) : (
            renderUsers()
          )
        )}
        
        {activeTab === 2 && (
          isLoading ? (
            <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
          ) : (
            renderTransactions()
          )
        )}
      </View>
      
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  loader: {
    marginTop: 50,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  volumeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  timeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeStatItem: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
  },
  timeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 60,
  },
  currencyCount: {
    flex: 1,
  },
  currencyAmount: {
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    margin: 4,
  },
  searchBar: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paginationText: {
    fontSize: 14,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
});