import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { Link, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';

interface Order {
  id: string;
  updatedAt: string;
  totalAmount: string;
  status: string;
  address: string;
  userName: string;
}
const RevenueChart = ({ chartData }: { chartData: any }) => {
  const { labels, datasets } = chartData;

  return (
    <View style={styles.chartCardContainer}>
      <BarChart
        data={{
          labels: labels,
          datasets: [
            {
              data: datasets[0].data,
              color: (opacity = 1) => `rgba(71, 117, 234, ${opacity})`, // Màu xanh dương hiện đại
              strokeWidth: 2 // Độ dày của đường viền
            },
          ],
        }}
        width={350}
        height={320}
        yAxisLabel=""
        yAxisSuffix=" tr₫"
        fromZero
        showValuesOnTopOfBars={true}
        segments={5} // Số lượng phân đoạn hiển thị trên trục Y
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(71, 117, 234, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
          propsForBackgroundLines: {
            strokeDasharray: '6, 4',
            strokeWidth: 1,
            stroke: '#E0E0E0',
          },
          propsForLabels: {
            fontSize: 12,
            fontWeight: 'bold',
          },
          // Chỉ hiển thị số chẵn trên trục Y
          formatYLabel: (yValue) => {
            const value = parseInt(yValue);
            // Làm tròn đến hàng nghìn gần nhất và chuyển về string
            return String(Math.round(value / 1000) * 1000);
          },
        }}
        style={styles.chartStyle}
        withInnerLines={true}
        withHorizontalLabels={true}
        withVerticalLabels={true}
        verticalLabelRotation={0}
        flatColor={true}
        showBarTops={true}
      />
    </View>
  );
};



const Dashboard = () => {
  const [revenue, setRevenue] = useState<number | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalProduct, setTotalProduct] = useState<number>(0);
  const [totalProductDay, setTotalProductDay] = useState<number>(0);
  const [totalSuccessfulOrders, setTotalSuccessfulOrders] = useState<number>(0);
  const [totalUser, setTotalUser] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const today = new Date();
  const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: { data: number[] }[] }>({
    labels: [],
    datasets: [
      {
        data: [],
      },
    ],
  });
  const processWeeklyRevenueData = (data: any[]) => {
    const labels = data.map((item: { week: number }) => `Tuần ${item.week}`);
    const revenues = data.map((item: { revenue: number }) => item.revenue);

    return {
      labels,
      datasets: [
        {
          data: revenues,
        },
      ],
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format using a more compact layout: DD/MM/YY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString(); // Get last 2 digits of year
    return `${day}/${month}/${year}`;
  };

  const fetchRevenue = async () => {
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/orders/revenue');
      setRevenue(response.data); // Gán giá trị doanh thu
    } catch (error) {
      console.error('Lỗi khi lấy tổng doanh thu:', error);
    }
  };

  // Fetch tổng số lượng đơn hàng
  const fetchTotalOrders = async () => {
    try {
      const response = await fetch('http://192.168.57.150:8080/api/orders/total');
      if (response.ok) {
        const data = await response.json();
        setTotalOrders(data); // Cập nhật tổng số lượng đơn hàng
      } else {
        throw new Error('Không thể lấy tổng số lượng đơn hàng');
      }
    } catch (err) {

    }
  };
  const fetchTotalUser = async () => {
    try {
      const response = await fetch('http://192.168.57.150:8080/api/users/count-today');
      if (response.ok) {
        const data = await response.json();
        setTotalUser(data); // Cập nhật tổng số lượng đơn hàng
      } else {
        throw new Error('Không thể lấy tổng số lượng user');
      }
    } catch (err) {

    }
  };

  // Fetch tổng số lượng đơn hàng có trạng thái DELIVERED_SUCCESSFULLY
  const fetchTotalSuccessfulOrders = async () => {
    try {
      const response = await fetch('http://192.168.57.150:8080/api/orders/total-successful');
      if (response.ok) {
        const data = await response.json();
        setTotalSuccessfulOrders(data); // Cập nhật tổng số lượng đơn hàng thành công
      } else {
        throw new Error('Không thể lấy tổng số lượng đơn hàng thành công');
      }
    } catch (err) {

    }
  };

  const fetchTotalProduct = async () => {
    try {
      const response = await fetch('http://192.168.57.150:8080/api/products/count');
      if (response.ok) {
        const data = await response.json();
        setTotalProduct(data); // Cập nhật tổng số lượng đơn hàng
      } else {
        throw new Error('Không thể lấy tổng số lượng sản phẩm');
      }
    } catch (err) {

    }
  };
  const fetchTotalProductDay = async () => {
    try {
      const response = await fetch('http://192.168.57.150:8080/api/count-today');
      if (response.ok) {
        const data = await response.json();
        setTotalProductDay(data); // Cập nhật tổng số lượng đơn hàng
      } else {
        throw new Error('Không thể lấy tổng số lượng sản phẩm');
      }
    } catch (err) {

    }
  };
  const fetchOrders = async () => {
    try {
      // Lấy tất cả đơn hàng và lọc ở client-side
      const response = await axios.get('http://192.168.57.150:8080/api/orders');

      // Lấy ngày hiện tại (bắt đầu từ 00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Lọc ra những đơn hàng có status là DELIVERED_SUCCESSFULLY VÀ được tạo/cập nhật ngày hôm nay
      const successfulOrdersToday = response.data
        .filter((order: Order) => {
          // Kiểm tra status
          const isSuccessful = order.status === "DELIVERED_SUCCESSFULLY";

          // Kiểm tra ngày
          const orderDate = new Date(order.updatedAt);
          const isToday = orderDate >= today;

          return isSuccessful && isToday;
        })
        .sort((a: { id: number; }, b: { id: number; }) => b.id - a.id);

      setOrders(successfulOrdersToday);

      // Log số lượng đơn hàng đã lọc
      console.log(`Đã lọc ${successfulOrdersToday.length} đơn hàng thành công của ngày hôm nay`);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách đơn hàng!',
        position: 'top',
        visibilityTime: 1000,
      });
      console.error('Lỗi khi lấy danh sách đơn hàng', error);
      setOrders([]);
    }
  };
  const fetchWeeklyRevenue = async (year: number, month: number) => {
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/revenue-by-week', {
        params: { year, month },
      });
      const processedData = processWeeklyRevenueData(response.data);
      setChartData(processedData);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu doanh thu theo tuần:', error);
    }
  };

  // Sử dụng useEffect để fetch dữ liệu khi component load
  useEffect(() => {
    fetchOrders();
    fetchTotalProduct();
    fetchRevenue();
    fetchTotalOrders();
    fetchTotalSuccessfulOrders();
    fetchTotalProductDay();
    fetchTotalUser();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Lấy tháng hiện tại
    fetchWeeklyRevenue(year, month); // Gọi API khi component được load
  }, []);

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.tableRow}>
      {/* <Text style={[styles.tableCell, { flex: 1 }]}>{item.id}</Text> */}
      <Text style={[styles.tableCell, { flex: 3.5 }]}>{item.userName}</Text>
      <Text style={[styles.tableCell, { flex: 2.5 }]}>{formatDate(item.updatedAt)}</Text>
      <Text style={[styles.tableCell, { flex: 3 }]}>{parseInt(item.totalAmount).toLocaleString("vi-VN")}</Text>
    </View>
  );

  return (
    <ThemedView style={styles.container} >
      <View style={styles.next}>
        <Link href="/">
          <Text style={styles.headerText}>
            <Text style={{ fontSize: 20, }}>{"⟨ "}</Text>Quay lại
          </Text>
        </Link>
      </View>
      <Text style={styles.header}>Dashboard</Text>

      {/* Button để mở menu */}
      <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu-outline" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal hiển thị menu */}
      <Modal visible={menuVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Menu</Text>
            <ScrollView contentContainerStyle={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/Product');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name={'cube-outline'} size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý sản phẩm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/Order');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name={'cart-outline'} size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/User');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="people-outline" size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý khách hàng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/Banner');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="images-outline" size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý banner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/Category');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="list-outline" size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý danh mục</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  router.push('/(dashboard)/Brand');
                  setMenuVisible(false);
                }}
              >
                <Ionicons name="business-outline" size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Quản lý nhà cung cấp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setMenuVisible(false)
                }
              >
                <Ionicons name="settings-outline" size={24} color="black" style={styles.menuIcon} />
                <Text style={styles.menuText}>Cài đặt</Text>
              </TouchableOpacity>

            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <Ionicons name="close-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.statisticsContainer}>
          <Text style={styles.statisticsHeader}>Doanh thu bán hàng hôm nay ({formattedDate})</Text>
          <View style={styles.statisticsRow}>
            <View style={styles.statisticsCard}>
              {revenue !== null ? (
                <Text style={styles.statisticsValue}>{revenue.toLocaleString()}đ</Text>
              ) : (
                <Text style={styles.loadingText}>Đang tải...</Text>
              )}
              <Text style={styles.statisticsLabel}>Tổng doanh thu</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsValue}>{totalOrders}</Text>
              <Text style={styles.statisticsLabel}>Đơn hàng</Text>
            </View>
          </View>
          <View style={styles.statisticsRow}>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsValue}>{totalSuccessfulOrders}</Text>
              <Text style={styles.statisticsLabel}>Đơn hàng hoàn thành</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsValue}>{totalProduct}</Text>
              <Text style={styles.statisticsLabel}>Tổng sản phẩm trong kho</Text>
            </View>
          </View>
          <View style={styles.statisticsRow}>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsValue}>{totalUser}</Text>
              <Text style={styles.statisticsLabel}>Khác hàng đăng kí tài khoản</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsValue}>{totalProductDay}</Text>
              <Text style={styles.statisticsLabel}>Sản phẩm đã nhập</Text>
            </View>
          </View>
        </View>

        {/* Biểu đồ doanh thu */}
        <View style={styles.revenueSection}>
          <Text style={styles.sectionTitle}>Doanh thu theo tháng</Text>
          <View style={styles.chartWrapper}>
            <RevenueChart chartData={chartData} />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4775EA' }]} />
                <Text style={styles.legendText}>Doanh thu (triệu đồng)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <Text style={styles.tableHeader}>Thông tin đơn hàng hoàn thành hôm nay</Text>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableCellHeader, { flex: 3.5 }]}>Khách hàng</Text>
            <Text style={[styles.tableCellHeader, { flex: 2.5 }]}>Ngày</Text>
            <Text style={[styles.tableCellHeader, { flex: 3 }]}>Tổng tiền</Text>
          </View>
          <FlatList
            data={orders} // Hiển thị các đơn hàng đã giao thành công
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyTableText}>Không có đơn hàng hoàn thành hôm nay</Text>
            }
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statisticsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  statisticsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statisticsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    elevation: 2,
  },
  statisticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statisticsLabel: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center'
  },
  menuContainer: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  revenueSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 13,
  },
  menuButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF5252',
    padding: 10,
    borderRadius: 8,
  },
  next: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  tableContainer: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyOrdersText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  viewOrdersButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewOrdersButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
    paddingBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  loadingText: {
    fontSize: 18,
    color: 'gray',
  },
  emptyTableText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20
  },
});

export default Dashboard;
