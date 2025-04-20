import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemedView } from '@/components/ThemedView';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/users');
      setUsers(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));

      // Hiển thị thông báo
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Danh sách người dùng đã được tải.',
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      // Hiển thị thông báo lỗi
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Không thể tải danh sách người dùng.',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm xóa người dùng
  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`http://192.168.57.150:8080/api/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));

      // Hiển thị thông báo
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Người dùng với ID ${id} đã được xóa.`,
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      // Hiển thị thông báo lỗi
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể xóa người dùng.',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const openUpdateModal = (user: User) => {
    setSelectedUser(user);
    setForm({ ...user });
    setModalVisible(true);
  };

  // Hàm cập nhật người dùng
  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.put(
        `http://192.168.57.150:8080/api/users/${selectedUser.id}`,
        form
      );
      setUsers(
        users.map((user) => (user.id === selectedUser.id ? response.data : user))
      );
      setModalVisible(false);

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Người dùng đã được cập nhật.',
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật người dùng.',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  // Render từng người dùng
  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userHeader}>
        <Ionicons name="person" size={22} color="#4775EA" />
        <Text style={styles.userName}>{item.name}</Text>
        <View style={styles.genderBadge}>
          <Text style={styles.genderText}>
            {item.gender === 'Nam' ? 'Nam' : 'Nữ'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{item.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>SĐT:</Text>
          <Text style={styles.detailValue}>{item.phone}</Text>
        </View>

        {item.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Địa chỉ:</Text>
            <Text style={[styles.detailValue, styles.addressText]}>
              {item.address}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={() => deleteUser(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionText}>Xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openUpdateModal(item)} style={styles.updateButton}>
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.actionText}>Cập nhật</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchUsers}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Quản lý Người dùng</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4775EA" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có người dùng nào</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              <Ionicons name="create-outline" size={24} color="#4775EA" style={{ marginRight: 10 }} />
              Cập nhật thông tin
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ tên"
                value={form.name || ''}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email || ''}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={form.phone || ''}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                value={form.address || ''}
                onChangeText={(text) => setForm({ ...form, address: text })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelButton}>
                <Text style={styles.actionText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdate} style={styles.modalSaveButton}>
                <Text style={styles.actionText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
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
    backgroundColor: '#4775EA',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
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
    paddingBottom: 20
  },
  userItem: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  genderBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  genderText: {
    fontSize: 14,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  userDetails: {
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
    width: 60,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  addressText: {
    flexWrap: 'wrap',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#ff4d4f',
    padding: 10,
    borderRadius: 8,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#4775EA',
    padding: 10,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    color: '#333'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#ff4d4f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#4775EA',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default UserManagement;
