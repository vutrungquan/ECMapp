import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { ThemedView } from '@/components/ThemedView';
import { Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: number;
  updatedAt: string;
  totalAmount: string;
  status: string;
  address: string;
  orderCode: string;
  userName?: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusOptions] = useState([
    { label: 'Đang chờ xác nhận', value: 'PENDING_CONFIRMATION' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đang chuẩn bị hàng', value: 'PREPARING' },
    { label: 'Lên đơn hàng thành công', value: 'ORDER_SUCCESS' },
    { label: 'Đang vận chuyển', value: 'SHIPPING' },
    { label: 'Giao hàng thành công', value: 'DELIVERED_SUCCESSFULLY' },
    { label: 'Giao thất bại', value: 'DELIVERY_FAILED' },
  ]);

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

  useEffect(() => {
    fetchOrders();
  }, []);

  // Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/orders/excluding-status');
      setOrders(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách đơn hàng!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId: number, status: string) => {
    setUpdatingOrderId(orderId); // Bắt đầu cập nhật - hiển thị loading
    try {
      await axios.put(
        `http://192.168.57.150:8080/api/orders/${orderId}/status?status=${status}`,
        null,
        { timeout: 10000 }
      );
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã cập nhật trạng thái đơn hàng',
        position: 'top',
        visibilityTime: 1000,
      });
      fetchOrders(); // Làm mới danh sách sau khi cập nhật
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Toast.show({
            type: 'error',
            text1: 'Xin lỗi',
            text2: 'Quá thời gian chờ khi cập nhật trạng thái!',
            position: 'top',
            visibilityTime: 1000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Xin lỗi',
            text2: 'Lỗi khi cập nhật trạng thái!',
            position: 'top',
            visibilityTime: 1000,
          });
        }
      }
    } finally {
      setUpdatingOrderId(null); // Kết thúc cập nhật - ẩn loading
    }
  };

  // Lấy màu dựa trên trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return '#FFA500';
      case 'CONFIRMED': return '#28A745';
      case 'PREPARING': return '#007BFF';
      case 'ORDER_SUCCESS': return '#28A745';
      case 'SHIPPING': return '#17A2B8';
      case 'DELIVERED_SUCCESSFULLY': return '#4CAF50';
      case 'DELIVERY_FAILED': return '#DC3545';
      default: return '#6C757D';
    }
  };

  // Lấy tên trạng thái hiển thị
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'Đang chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PREPARING': return 'Đang chuẩn bị hàng';
      case 'ORDER_SUCCESS': return 'Lên đơn hàng thành công';
      case 'SHIPPING': return 'Đang vận chuyển';
      case 'DELIVERED_SUCCESSFULLY': return 'Giao hàng thành công';
      case 'DELIVERY_FAILED': return 'Giao thất bại';
      default: return status;
    }
  };

  // Render từng đơn hàng
  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="receipt-outline" size={18} color="#555" />
          <Text style={styles.orderIdText}>{item.orderCode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusDisplayName(item.status)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Ngày:</Text>
          <Text style={styles.detailValue}>{formatDate(item.updatedAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Tổng tiền:</Text>
          <Text style={styles.detailValuePrice}>
            {parseInt(item.totalAmount).toLocaleString("vi-VN")} ₫
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Địa chỉ:</Text>
          <Text style={[styles.detailValue, styles.addressText]}>{item.address}</Text>
        </View>
      </View>

      <View style={styles.updateContainer}>
        <View style={{ borderWidth: 1, borderColor: '#4775EA', borderRadius: 8, marginVertical: 10, overflow: 'hidden' }}>
          <RNPickerSelect
            onValueChange={(value) => {
              if (value) {
                updateOrderStatus(item.id, value); // Gửi trạng thái mới về backend
              }
            }}
            items={statusOptions}
            value={item.status} // Hiển thị trạng thái hiện tại
            placeholder={{}} // Xóa placeholder, chỉ hiển thị trạng thái
            style={{
              inputAndroid: {
                textAlign: 'center', // Căn giữa chữ trong khung
                height: 40,
                backgroundColor: '#007BFF', // Nền xanh
                color: '#fff', // Chữ màu trắng
                paddingVertical: 10,
                paddingHorizontal: 20,
              },
              inputIOS: {
                textAlign: 'center', // Căn giữa chữ trong khung
                height: 40,
                backgroundColor: '#4775EA', // Nền xanh
                color: '#fff', // Chữ màu trắng
                paddingVertical: 10,
                paddingHorizontal: 20,
              },
              iconContainer: {
                top: 12, // Vị trí icon dropdown
                right: 12,
              },
            }}
            Icon={() => {
              return (
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>▼</Text> // Icon mũi tên trắng
              );
            }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <Link href="/(dashboard)/Home">
          <Text style={styles.headerText}>
            <Text style={{ fontSize: 20 }}>{"⟨ "}</Text> Quay lại
          </Text>
        </Link>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchOrders}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Quản lý Đơn Hàng</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 16
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
    marginRight: 4,
    width: 70,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  detailValuePrice: {
    fontSize: 15,
    color: '#E53935',
    fontWeight: '600',
    flex: 1,
  },
  addressText: {
    flexWrap: 'wrap',
  },
  updateContainer: {
    marginTop: 8,
  },
  updateLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingIndicator: {
    padding: 14,
  },
});

export default OrderManagement;
