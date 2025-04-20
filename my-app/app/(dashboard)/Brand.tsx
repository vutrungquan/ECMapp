import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import { Link } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from '@expo/vector-icons';

interface Brand {
  id: number;
  name: string;
  image: string;
  categoryId: string;
}

interface Category {
  id: number;
  name: string;
  image: string;
}

const BrandManagement = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [newBrand, setNewBrand] = useState<Brand>({
    id: 0,
    name: "",
    image: "",
    categoryId: "",
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  // Lấy danh sách brand từ backend
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://192.168.57.150:8080/api/brands");
      setBrands(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách thương hiệu!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://192.168.57.150:8080/api/categories"
      );
      setCategories(response.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  // Xử lý chọn ảnh từ thiết bị
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (editingBrand) {
        setEditingImage(result.assets[0].uri);
      } else {
        setSelectedImage(result.assets[0].uri);
        setNewBrand({ ...newBrand, image: result.assets[0].uri });
      }
    }
  };

  // Xử lý thêm brand
  const handleAddBrand = async () => {
    if (!newBrand.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập tên thương hiệu!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    if (!newBrand.categoryId) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    if (!selectedImage) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn hình ảnh!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", newBrand.name);
      formData.append("categoryId", newBrand.categoryId);

      if (selectedImage) {
        const fileExtension = selectedImage.split(".").pop();
        const fileName = selectedImage.split("/").pop();
        formData.append("file", {
          uri: selectedImage,
          name: fileName,
          type: `image/${fileExtension}`,
        } as any);
      }

      await axios.post("http://192.168.57.150:8080/api/brands", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã thêm thương hiệu mới!",
        position: "top",
        visibilityTime: 1000,
      });

      setNewBrand({ id: 0, name: "", image: "", categoryId: "" });
      setSelectedImage(null);
      fetchBrands();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể thêm thương hiệu!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Xử lý cập nhật brand
  const handleEditBrand = async () => {
    if (!editingBrand) return;

    if (!editingBrand.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập tên thương hiệu!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    if (!editingBrand.categoryId) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng chọn danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", editingBrand.name);
      formData.append("categoryId", editingBrand.categoryId);

      if (editingImage) {
        const fileExtension = editingImage.split(".").pop();
        const fileName = editingImage.split("/").pop();
        formData.append("file", {
          uri: editingImage,
          name: fileName,
          type: `image/${fileExtension}`,
        } as any);
      }

      await axios.put(
        `http://192.168.57.150:8080/api/brands/${editingBrand.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Thương hiệu đã được cập nhật!",
        position: "top",
        visibilityTime: 1000,
      });

      setEditingBrand(null);
      setEditingImage(null);
      fetchBrands();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật thương hiệu!",
        position: "top",
        visibilityTime: 1000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Xử lý xóa brand
  const handleDeleteBrand = async (id: number) => {
    try {
      await axios.delete(`http://192.168.57.150:8080/api/brands/${id}`);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Thương hiệu đã được xóa!",
        position: "top",
        visibilityTime: 1000,
      });
      fetchBrands();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể xóa thương hiệu!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  // Lấy tên danh mục từ ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : "Không xác định";
  };

  const renderItem = ({ item }: { item: Brand }) => (
    <View style={styles.brandCard}>
      <View style={styles.brandHeader}>
        <Image
          source={{ uri: `http://192.168.57.150/images/${item.image}` }}
          style={styles.brandImage}
          resizeMode="contain"
        />
        <View style={styles.brandDetails}>
          <View style={styles.brandNameContainer}>
            <Ionicons name="briefcase-outline" size={22} color="#4775EA" />
            <Text style={styles.brandName}>{item.name}</Text>
          </View>

          <View style={styles.categoryContainer}>
            <Ionicons name="folder-outline" size={16} color="#666" />
            <Text style={styles.categoryName}>
              {getCategoryName(item.categoryId)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditingBrand(item);
            setEditingImage(null);
            setNewBrand({ id: 0, name: "", image: "", categoryId: "" });
            setSelectedImage(null);
          }}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBrand(item.id)}
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchBrands}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Quản lý Nhà cung cấp</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {!editingBrand ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              <Ionicons name="add-circle-outline" size={22} color="#4775EA" />
              <Text> Thêm nhà cung cấp mới</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên nhà cung cấp"
                value={newBrand.name}
                onChangeText={(text) => setNewBrand({ ...newBrand, name: text })}
              />
            </View>

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={(value) => setNewBrand({ ...newBrand, categoryId: value })}
                value={newBrand.categoryId}
                items={categories.map((category) => ({
                  label: category.name,
                  value: category.id.toString(),
                }))}
                placeholder={{ label: "Chọn danh mục", value: null }}
                style={customPickerStyles}
                Icon={() => <Ionicons name="chevron-down" size={22} color="#4775EA" style={styles.pickerIcon} />}
              />
            </View>

            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
              </TouchableOpacity>

              {selectedImage && (
                <View style={styles.previewImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImage(null);
                      setNewBrand({ ...newBrand, image: '' });
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!newBrand.name || !newBrand.categoryId || !selectedImage || uploading) && styles.disabledButton
              ]}
              onPress={handleAddBrand}
              disabled={!newBrand.name || !newBrand.categoryId || !selectedImage || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Thêm nhà cung cấp</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editFormContainer}>
            <View style={styles.editFormHeader}>
              <Ionicons name="create-outline" size={22} color="#4775EA" />
              <Text style={styles.formTitle}> Chỉnh sửa nhà cung cấp</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên nhà cung cấp"
                value={editingBrand.name}
                onChangeText={(text) =>
                  setEditingBrand({ ...editingBrand, name: text })
                }
              />
            </View>

            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={(value) =>
                  setEditingBrand({ ...editingBrand, categoryId: value })
                }
                items={categories.map((category) => ({
                  label: category.name,
                  value: category.id.toString(),
                }))}
                placeholder={{
                  label: categories.find((cat) => cat.id.toString() === editingBrand?.categoryId)?.name || "Chọn danh mục",
                  value: null,
                }}
                value={editingBrand.categoryId}
                style={customPickerStyles}
                Icon={() => <Ionicons name="chevron-down" size={22} color="#4775EA" style={styles.pickerIcon} />}
              />
            </View>

            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Chọn hình ảnh mới</Text>
              </TouchableOpacity>

              <View style={styles.previewImageContainer}>
                {editingImage ? (
                  <Image source={{ uri: editingImage }} style={styles.previewImage} />
                ) : (
                  <Image
                    source={{ uri: `http://192.168.57.150/images/${editingBrand.image}` }}
                    style={styles.previewImage}
                  />
                )}
                {editingImage && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setEditingImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.editFormButtons}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!editingBrand.name || !editingBrand.categoryId || uploading) && styles.disabledButton
                ]}
                onPress={handleEditBrand}
                disabled={!editingBrand.name || !editingBrand.categoryId || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Lưu</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingBrand(null)}
              >
                <Ionicons name="close-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Danh sách nhà cung cấp</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4775EA" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : brands.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Không có nhà cung cấp nào</Text>
          </View>
        ) : (
          <FlatList
            data={brands}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
};

const customPickerStyles = {
  inputIOS: {
    height: 48,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#333',
    paddingRight: 30,
  },
  inputAndroid: {
    height: 48,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#333',
    paddingRight: 30,
  },
  placeholder: {
    color: '#999',
  },
  iconContainer: {
    top: 12,
    right: 12,
  },
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
  pickerIcon: {
    paddingRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
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
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  editFormContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#4775EA',
  },
  editFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
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
  brandCard: {
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#eee',
  },
  brandDetails: {
    flex: 1,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4775EA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default BrandManagement;
