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
import Toast from "react-native-toast-message";
import { Link } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from '@expo/vector-icons';

interface Category {
  id: number;
  name: string;
  image: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCategory, setNewCategory] = useState<Category>({
    id: 0,
    name: "",
    image: "",
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Lấy danh sách category từ backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://192.168.57.150:8080/api/categories");
      setCategories(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách danh mục!',
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
      aspect: [1, 1], // Hình vuông cho category
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (editingCategory) {
        setEditingImage(result.assets[0].uri);
      } else {
        setSelectedImage(result.assets[0].uri);
        setNewCategory({ ...newCategory, image: result.assets[0].uri });
      }
    }
  };

  // Xử lý thêm Category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập tên danh mục!',
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
      formData.append("name", newCategory.name);

      if (selectedImage) {
        const fileExtension = selectedImage.split(".").pop();
        const fileName = selectedImage.split("/").pop();
        formData.append("file", {
          uri: selectedImage,
          name: fileName,
          type: `image/${fileExtension}`,
        } as any);
      }

      await axios.post("http://192.168.57.150:8080/api/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã thêm danh mục mới!",
        position: "top",
        visibilityTime: 1000,
      });

      setNewCategory({ id: 0, name: "", image: "" });
      setSelectedImage(null);
      fetchCategories();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi thêm danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Xử lý cập nhật category
  const handleEditCategory = async () => {
    if (!editingCategory) return;

    if (!editingCategory.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập tên danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", editingCategory.name);

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
        `http://192.168.57.150:8080/api/categories/${editingCategory.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Danh mục đã được cập nhật!",
        visibilityTime: 1000,
        position: 'top',
      });

      setEditingCategory(null);
      setEditingImage(null);
      fetchCategories();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật danh mục!",
        visibilityTime: 1000,
        position: 'top',
      });
    } finally {
      setUploading(false);
    }
  };

  // Xử lý xóa Category
  const handleDeleteCategory = async (id: number) => {
    try {
      await axios.delete(`http://192.168.57.150:8080/api/categories/${id}`);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Danh mục đã được xóa!",
        position: "top",
        visibilityTime: 1000,
      });

      fetchCategories();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi xoá danh mục!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Image
          source={{ uri: `http://192.168.57.150/images/${item.image}` }}
          style={styles.categoryImage}
          resizeMode="contain"
        />
        <View style={styles.categoryDetails}>
          <View style={styles.categoryNameContainer}>
            <Ionicons name="folder-outline" size={22} color="#4775EA" />
            <Text style={styles.categoryName}>{item.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditingCategory(item);
            setEditingImage(null);
            setNewCategory({ id: 0, name: "", image: "" });
            setSelectedImage(null);
          }}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item.id)}
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchCategories}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Quản lý Danh mục</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {!editingCategory ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              <Ionicons name="add-circle-outline" size={22} color="#4775EA" />
              <Text> Thêm danh mục mới</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên danh mục"
                value={newCategory.name}
                onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
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
                      setNewCategory({ ...newCategory, image: '' });
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
                (!newCategory.name || !selectedImage || uploading) && styles.disabledButton
              ]}
              onPress={handleAddCategory}
              disabled={!newCategory.name || !selectedImage || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Thêm danh mục</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editFormContainer}>
            <View style={styles.editFormHeader}>
              <Ionicons name="create-outline" size={22} color="#4775EA" />
              <Text style={styles.formTitle}> Chỉnh sửa danh mục</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={22} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên danh mục"
                value={editingCategory.name}
                onChangeText={(text) =>
                  setEditingCategory({ ...editingCategory, name: text })
                }
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
                    source={{ uri: `http://192.168.57.150/images/${editingCategory.image}` }}
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
                  (!editingCategory.name || uploading) && styles.disabledButton
                ]}
                onPress={handleEditCategory}
                disabled={!editingCategory.name || uploading}
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
                onPress={() => setEditingCategory(null)}
              >
                <Ionicons name="close-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Danh sách danh mục</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4775EA" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Không có danh mục nào</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
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
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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

export default CategoryManagement;
