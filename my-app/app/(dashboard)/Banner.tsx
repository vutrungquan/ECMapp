import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { View, Text, Image, FlatList, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

interface Banner {
  id: number;
  name: string;
  image: string;
}

const BannerManagement = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newBanner, setNewBanner] = useState<Banner>({
    id: 0,
    name: '',
    image: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Yêu cầu quyền truy cập vào thư viện ảnh
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Cần có quyền truy cập thư viện phương tiện!',
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  useEffect(() => {
    requestPermission();
    fetchBanners();
  }, []);

  // Lấy danh sách banner từ backend
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/banners');
      setBanners(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách banner!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chọn ảnh từ thiết bị
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [16, 9], // Tỷ lệ banner là 16:9
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setNewBanner({ ...newBanner, image: result.assets[0].uri });
    }
  };

  // Xử lý upload ảnh lên server
  const uploadImage = async (imageUri: string, name: string): Promise<string | null> => {
    setUploading(true);

    const formData = new FormData();
    const fileExtension = imageUri.split('.').pop();
    const fileName = imageUri.split('/').pop();

    formData.append('name', name);
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileExtension}`,
    } as any);

    try {
      const response = await axios.post('http://192.168.57.150:8080/api/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: 'Banner đã được tạo thành công!',
        position: "top",
        visibilityTime: 1000,
      });

      setNewBanner({ id: 0, name: '', image: '' });
      setSelectedImage(null);
      fetchBanners();
      return response.data.image;
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: 'Không thể tải lên hình ảnh!',
        position: "top",
        visibilityTime: 1000,
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Xử lý thêm banner
  const handleAddBanner = async () => {
    if (!newBanner.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: 'Vui lòng nhập tên banner!',
        position: "top",
        visibilityTime: 1000,
      });
      return;
    }

    if (!selectedImage) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: 'Vui lòng chọn hình ảnh!',
        position: "top",
        visibilityTime: 1000,
      });
      return;
    }

    try {
      await uploadImage(selectedImage, newBanner.name);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: 'Có lỗi xảy ra khi thêm banner!',
        position: "top",
        visibilityTime: 1000,
      });
    }
  };

  // Xử lý xóa banner
  const handleDeleteBanner = async (id: number) => {
    try {
      await axios.delete(`http://192.168.57.150:8080/api/banners/${id}`);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Banner đã được xóa!',
        position: 'top',
        visibilityTime: 1000,
      });
      fetchBanners();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi xóa banner!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const renderItem = ({ item }: { item: Banner }) => (
    <View style={styles.bannerItem}>
      <Image
        source={{ uri: `http://192.168.57.150/images/${item.image}` }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerDetails}>
        <View style={styles.bannerHeader}>
          <Ionicons name="image-outline" size={22} color="#4775EA" />
          <Text style={styles.bannerName}>{item.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBanner(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Xóa</Text>
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchBanners}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Quản lý Banner</Text>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          <Ionicons name="add-circle-outline" size={22} color="#4775EA" />
          <Text> Thêm Banner mới</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="text-outline" size={22} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tên Banner"
            value={newBanner.name}
            onChangeText={(text) => setNewBanner({ ...newBanner, name: text })}
          />
        </View>

        <View style={styles.imagePickerContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setNewBanner({ ...newBanner, image: '' });
                }}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, (!newBanner.name || !selectedImage) && styles.disabledButton]}
          onPress={handleAddBanner}
          disabled={uploading || !newBanner.name || !selectedImage}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Thêm Banner</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Danh sách Banner</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4775EA" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : banners.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có banner nào</Text>
        </View>
      ) : (
        <FlatList
          data={banners}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `defaultKey-${index}`}
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
    backgroundColor: '#4CAF50',
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
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4775EA',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#4775EA',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewImageContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7', // Lighter green
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
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
  bannerItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  bannerDetails: {
    padding: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default BannerManagement;
