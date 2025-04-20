import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { Colors } from '@/constants/Colors';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useUser } from '../(auth)/UserContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Order = {
  id: number;
  status: string;
  totalAmount: string;
  orderDate: string;
  updatedAt: string;
  orderCode: string;
};

type OrderItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedImagePath?: string;
};

// Status configuration with icons and colors
const STATUS_CONFIG = {
  'PENDING_CONFIRMATION': {
    label: 'Đang chờ xác nhận',
    icon: 'time-outline',
    color: '#FFA500'  // Orange
  },
  'CONFIRMED': {
    label: 'Đã xác nhận',
    icon: 'checkmark-circle-outline',
    color: '#4775EA'  // Blue
  },
  'PREPARING': {
    label: 'Đang chuẩn bị hàng',
    icon: 'cube-outline',
    color: '#9C27B0'  // Purple
  },
  'ORDER_SUCCESS': {
    label: 'Lên đơn hàng thành công',
    icon: 'cart-outline',
    color: '#2196F3'  // Blue
  },
  'SHIPPING': {
    label: 'Đang vận chuyển',
    icon: 'car-outline',
    color: '#3F51B5'  // Indigo
  },
  'DELIVERED_SUCCESSFULLY': {
    label: 'Giao hàng thành công',
    icon: 'checkmark-done-circle-outline',
    color: '#4CAF50'  // Green
  },
  'DELIVERY_FAILED': {
    label: 'Giao hàng thất bại',
    icon: 'close-circle-outline',
    color: '#F44336'  // Red
  },
};

export default function OrderScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { userInfo } = useUser();

  // Fetch orders from API
  const fetchOrders = async () => {
    setOrders([]);
    if (!userInfo || !userInfo.id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy thông tin người dùng',
        position: 'top',
        visibilityTime: 2000,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://192.168.57.150:8080/api/orders/user/${userInfo.id}`);
      if (response.data.length === 0) {
        // No orders found
      } else {
        // Sort orders by updatedAt
        const sortedOrders = response.data.sort(
          (a: Order, b: Order) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách đơn hàng',
        position: 'top',
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset data and fetch new orders when screen is focused
  useFocusEffect(
    useCallback(() => {
      setOrders([]);
      setLoading(true);
      fetchOrders();
    }, [userInfo])
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Handle delete/cancel order
  const handleDeleteOrder = async (orderId: number, orderStatus: string) => {
    if (orderStatus !== 'PENDING_CONFIRMATION') {
      Toast.show({
        type: 'info',
        text1: 'Không thể huỷ',
        text2: 'Chỉ có thể huỷ đơn hàng đang chờ xác nhận',
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    try {
      await axios.delete(`http://192.168.57.150:8080/api/orders/delete/${orderId}`);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Đã huỷ đơn hàng #${orderId}`,
        position: 'top',
        visibilityTime: 2000,
      });

      // Update the list after deletion
      setOrders(orders.filter((order) => order.id !== orderId));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể xóa đơn hàng',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  // Show order details
  const handleShowDetails = async (order: Order) => {
    try {
      setSelectedOrder(order);
      const response = await axios.get(`http://192.168.57.150:8080/api/orders/${order.id}`);
      setSelectedOrderItems(response.data.orderItems);
      setModalVisible(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải chi tiết đơn hàng',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  // Status order for tracking progress
  const statusOrder = [
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'PREPARING',
    'ORDER_SUCCESS',
    'SHIPPING',
    'DELIVERED_SUCCESSFULLY',
    'DELIVERY_FAILED',
  ];

  // Check if a status is completed in the order flow
  const isCompleted = (currentStatus: string, statusKey: string) => {
    if (currentStatus === 'DELIVERY_FAILED' && statusKey === 'DELIVERED_SUCCESSFULLY') {
      return false;
    }

    return statusOrder.indexOf(currentStatus) >= statusOrder.indexOf(statusKey);
  };

  // Get status display info (label, icon, color)
  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: 'Không xác định',
      icon: 'help-circle-outline',
      color: '#757575'
    };
  };

  // Calculate total items and amount in order details
  const calculateOrderSummary = (items: OrderItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { totalItems, totalAmount };
  };

  // Status progress bar component
  const StatusProgressBar = ({ currentStatus }: { currentStatus: string }) => {
    // Filter statuses based on current status
    // Don't show "Delivery Failed" if status is "Delivered Successfully" and vice versa
    const filteredStatuses = statusOrder.filter(status => {
      if (currentStatus === 'DELIVERED_SUCCESSFULLY' && status === 'DELIVERY_FAILED') return false;
      if (currentStatus === 'DELIVERY_FAILED' && status === 'DELIVERED_SUCCESSFULLY') return false;
      return true;
    });

    return (
      <View style={styles.statusProgressContainer}>
        {filteredStatuses.map((status, index) => {
          const completed = isCompleted(currentStatus, status);
          const isActive = currentStatus === status;
          const statusInfo = getStatusInfo(status);

          // Last item doesn't need connector
          const showConnector = index < filteredStatuses.length - 1;

          return (
            <React.Fragment key={status}>
              <View style={styles.statusStep}>
                <View
                  style={[
                    styles.statusDot,
                    completed ? { backgroundColor: statusInfo.color } : { backgroundColor: '#e0e0e0' }
                  ]}
                >
                  {completed && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>

                <View style={styles.statusTextContainer}>
                  <Ionicons
                    name={statusInfo.icon as any}
                    size={16}
                    color={isActive ? statusInfo.color : (completed ? '#4CAF50' : '#9e9e9e')}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isActive && { color: statusInfo.color, fontWeight: 'bold' },
                      completed && !isActive && { color: '#4CAF50' }
                    ]}
                  >
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              {showConnector && (
                <View
                  style={[
                    styles.statusConnector,
                    isCompleted(currentStatus, filteredStatuses[index + 1])
                      ? { backgroundColor: '#4CAF50' }
                      : { backgroundColor: '#e0e0e0' }
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Render each order item
  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={styles.orderCard}>
        {/* Order Header - Modified to ensure status badge doesn't get cut off */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Ionicons name="receipt-outline" size={18} color="#4775EA" />
            <Text style={styles.orderTitle} numberOfLines={1} ellipsizeMode="tail">
              Đơn hàng #{item.orderCode}
            </Text>
          </View>
        </View>

        {/* Status Badge - Moved outside the header for better visibility */}
        <View style={[styles.statusBadgeContainer]}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon as any} size={16} color="#fff" style={styles.statusIcon} />
            <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.orderInfoItem}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.orderInfoText}>
              <Text style={styles.orderInfoLabel}>Tổng tiền: </Text>
              <Text style={styles.orderAmount}>{parseInt(item.totalAmount).toLocaleString("vi-VN")}đ</Text>
            </Text>
          </View>

          <View style={styles.orderInfoItem}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.orderInfoText}>
              <Text style={styles.orderInfoLabel}>Ngày đặt: </Text>
              {formatDate(item.orderDate)}
            </Text>
          </View>

          <View style={styles.orderInfoItem}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.orderInfoText}>
              <Text style={styles.orderInfoLabel}>Cập nhật: </Text>
              {formatDate(item.updatedAt)}
            </Text>
          </View>
        </View>

        {/* Status Progress Display */}
        <StatusProgressBar currentStatus={item.status} />

        <View style={styles.buttonContainer}>
          {item.status === 'PENDING_CONFIRMATION' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleDeleteOrder(item.id, item.status)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.detailButton,
              item.status === 'PENDING_CONFIRMATION' ? { flex: 1 } : { flex: 2 }
            ]}
            onPress={() => handleShowDetails(item)}
          >
            <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Chi tiết đơn hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4775EA" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Ionicons name="document-text" size={24} color="#4775EA" />
        <Text style={styles.headerText}>Đơn hàng của bạn</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
          <Text style={styles.emptySubtext}>Các đơn hàng của bạn sẽ hiển thị ở đây</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchOrders();
                setRefreshing(false);
              }}
              colors={['#4775EA']}
              tintColor="#4775EA"
            />
          }
        />
      )}

      {/* Order Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Chi tiết đơn hàng</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.orderSummary}>
                <Text style={styles.orderCodeText}>Mã đơn hàng: #{selectedOrder.orderCode}</Text>
                <Text style={styles.orderDateText}>Ngày đặt: {formatDate(selectedOrder.orderDate)}</Text>

                {getStatusInfo(selectedOrder.status) && (
                  <View style={[
                    styles.modalStatusBadge,
                    { backgroundColor: getStatusInfo(selectedOrder.status).color }
                  ]}>
                    <Ionicons
                      name={getStatusInfo(selectedOrder.status).icon as any}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.modalStatusText}>
                      {getStatusInfo(selectedOrder.status).label}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>

            <ScrollView style={styles.orderItemsContainer}>
              {selectedOrderItems.map((item, index) => (
                <View key={`${item.productId}-${index}`} style={styles.orderItemCard}>
                  <View style={styles.productInfo}>
                    <Ionicons name="cube-outline" size={20} color="#4775EA" />
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{item.productName}</Text>

                      <View style={styles.productMetaRow}>
                        <Text style={styles.productMeta}>
                          <Text style={styles.metaLabel}>Đơn giá: </Text>
                          {item.price.toLocaleString('vi-VN')}₫
                        </Text>
                        <Text style={styles.productMeta}>
                          <Text style={styles.metaLabel}>SL: </Text>
                          {item.quantity}
                        </Text>
                      </View>

                      {item.selectedColor && (
                        <View style={styles.productMetaRow}>
                          <Text style={styles.productMeta}>
                            <Text style={styles.metaLabel}>Màu: </Text>
                            {item.selectedColor}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.itemTotal}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            {selectedOrderItems.length > 0 && (
              <View style={styles.orderSummaryFooter}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Số lượng sản phẩm:</Text>
                  <Text style={styles.summaryValue}>
                    {calculateOrderSummary(selectedOrderItems).totalItems}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng tiền:</Text>
                  <Text style={styles.totalAmount}>
                    {calculateOrderSummary(selectedOrderItems).totalAmount.toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },

  // Order Card Styles
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTitle: {
    flex: 1, // Allow text to take available space but truncate if needed
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  orderContent: {
    marginBottom: 12,
  },
  orderInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  orderInfoLabel: {
    fontWeight: '600',
  },
  orderAmount: {
    fontWeight: 'bold',
    color: '#E53935',
  },

  // Status Progress Bar
  statusProgressContainer: {
    marginVertical: 16,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  statusConnector: {
    width: 2,
    height: 16,
    marginLeft: 9,
    marginBottom: 8,
  },

  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4775EA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  orderSummary: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  orderCodeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 4,
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  orderItemsContainer: {
    maxHeight: 300,
  },
  orderItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  productDetails: {
    marginLeft: 8,
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  productMeta: {
    fontSize: 13,
    color: '#666',
    marginRight: 10,
  },
  metaLabel: {
    color: '#888',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  orderSummaryFooter: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  closeModalButton: {
    backgroundColor: '#4775EA',
    padding: 14,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
