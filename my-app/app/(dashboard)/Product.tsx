import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import RNPickerSelect from "react-native-picker-select";
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa kiểu dữ liệu cho Product
interface Product {
  id: number;
  name: string;
  screen: string;
  display: string;
  price: string;
  salePrice: string;
  description: string;
  stock: string;
  totalStock: string;
  screenTechnology: string;
  screenResolution: string;
  mainCamera: string;
  frontCamera: string;
  chipset: string;
  ram: string;
  internalMemory: string;
  operatingSystem: string;
  battery: string;
  weight: string;
  colors: string[];
  imagePaths: any[];
  quantity?: number;
  category: Category; // Danh mục sản phẩm
  brand: Brand; // Thương hiệu sản phẩm
  status: number;
}
interface IProductForm {
  id: string;
  name: string;
  screen: string;
  display: string;
  price: string;
  salePrice?: string;
  totalStock: string;
  stock: string;
  description: string;
  screenTechnology: string;
  screenResolution: string;
  mainCamera: string;
  frontCamera: string;
  chipset: string;
  ram: string;
  internalMemory: string;
  operatingSystem: string;
  battery: string;
  weight: string;
  colors?: (string | undefined)[]; // Mảng các màu
  selectedImages?: ImagePicker.ImagePickerAsset[];
  categoryId: string;
  brandId: string;
}
interface Category {
  id: number;
  name: string;
  image: string;
  brands?: Brand[];
}
interface Brand {
  id: number;
  name: string;
  image: string;
}

const ProductDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updatedProduct, setUpdatedProduct] = useState<Product | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<IProductForm>();
  const [colors, setColors] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<IProductForm>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const onSubmit = async (data: IProductForm) => {
    if (updatedProduct) {
      if (selectedImages.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng chọn ít nhất một hình ảnh!',
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }
      const formData = new FormData();

      // Append dữ liệu sản phẩm
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof IProductForm];
        if (value !== undefined && value !== null) {
          // Chuyển đổi giá trị sang chuỗi nếu cần thiết
          if (typeof value === "number" || Array.isArray(value)) {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value as string);
          }
        }
      });

      if (colors.length > 0) {
        colors.forEach((color) => {
          formData.append('colors', color);
        });
      } else {
        formData.append('colors', '');
      }
      if (newProduct.categoryId) {
        formData.append('categoryId', newProduct.categoryId);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng chọn danh mục!',
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }
      if (newProduct.brandId) {
        formData.append('brandId', newProduct.brandId);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng chọn nhà cung cấp!',
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }

      // Append hình ảnh
      selectedImages.forEach((image, index) => {
        const uriParts = image.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('files', {
          uri: image.uri,
          name: `image_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any); // Thêm `as any` để bỏ qua lỗi TypeScript
      });

      try {
        const response = await axios.put(`http://192.168.57.150:8080/api/product/${updatedProduct.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Sản phẩm đã được sửa!',
          position: 'top',
          visibilityTime: 1000,
        });
        getProducts();
        // console.log('Sản phẩm đã được sửa:', response.data);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Xin lỗi',
          text2: 'Lỗi khi sửa sản phẩm!',
          position: 'top',
          visibilityTime: 1000,
        });
        // console.error('Lỗi khi sửa sản phẩm:', error);
      }
      setIsModalVisible(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages((prev) => [...prev, ...result.assets]);
    }
  };

  // Lấy danh sách sản phẩm từ API khi component được mount
  const getProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.57.150:8080/api/productss');
      setProducts(response.data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi lấy danh sách sản phẩm!',
        position: 'top',
        visibilityTime: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
    fetchCategories();
  }, []);

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
        text2: 'Lỗi khi lấy danh sách category!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Ionicons name="phone-portrait-outline" size={22} color="#4775EA" />
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Giá:</Text>
          <Text style={styles.priceValue}>
            {parseInt(item.price).toLocaleString("vi-VN")} ₫
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="flash-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Giá KM:</Text>
          <Text style={styles.salePriceValue}>
            {parseInt(item.salePrice).toLocaleString("vi-VN")} ₫
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="archive-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Trong kho:</Text>
          <Text style={styles.detailValue}>{item.totalStock}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calculator-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Còn lại:</Text>
          <Text style={styles.detailValue}>{item.stock}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Trạng thái:</Text>
          <View style={styles.toggleContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 1 ? '#4CAF50' : '#757575' }
            ]}>
              <Text style={styles.statusText}>
                {item.status === 1 ? "Đang hiển thị" : "Đang ẩn"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                item.status === 1 ? styles.toggleOn : styles.toggleOff,
              ]}
              onPress={() => toggleStatus(item.id, item.status)}
            >
              <Text style={styles.toggleButtonText}>
                {item.status === 1 ? "Tắt" : "Bật"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionText}>Xoá</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditProduct(item.id)}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleEditProduct = (productId: string | number) => {
    const product = products.find((item) => item.id === Number(productId));

    if (product) {
      setSelectedProduct(product);
      setUpdatedProduct({ ...product });
      setColors([]); // Reset lại màu sắc đã chọn
      setSelectedImages([]); // Reset lại hình ảnh đã chọn
      setIsModalVisible(true);
      reset({ // Đặt lại form với dữ liệu của sản phẩm
        name: product.name || "",
        screen: product.screen || "",
        display: product.display || "",
        price: product.price || "",
        salePrice: product.salePrice || "", // Nếu có
        totalStock: product.totalStock || "",
        stock: product.stock || "",
        description: product.description || "",
        screenTechnology: product.screenTechnology || "",
        screenResolution: product.screenResolution || "",
        mainCamera: product.mainCamera || "",
        frontCamera: product.frontCamera || "",
        chipset: product.chipset || "",
        ram: product.ram || "",
        internalMemory: product.internalMemory || "",
        operatingSystem: product.operatingSystem || "",
        battery: product.battery || "",
        weight: product.weight || "",
        colors: updatedProduct?.colors || [], // Reset lại màu sắc
        selectedImages: [], // Reset lại hình ảnh
        categoryId: product.category.id.toString(),
        brandId: product.brand.id.toString(),
      });
    }
  };

  const handleCancel = () => {
    // Reset form khi bấm Hủy
    reset();
    setIsModalVisible(false); // Đóng modal
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await axios.delete(`http://192.168.57.150:8080/api/product/${id}`);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã xoá sản phẩm!',
        position: 'top',
        visibilityTime: 1000,
      });
      getProducts();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi xoá sản phẩm!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Kiểm tra nếu người dùng không hủy
      if (!result.canceled) {
        // Ép kiểu sang DocumentPickerSuccessResult để lấy thuộc tính
        const { uri, name, mimeType } = result.assets[0];
        setFile({
          uri,
          name,
          mimeType: mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể chọn file!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const uploadFile = async () => {
    if (!file) {
      Toast.show({
        type: 'error',
        text1: 'Thông báo',
        text2: 'Vui lòng chọn file Excel!',
        position: 'top',
        visibilityTime: 1000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.name,
    } as any);

    try {
      const response = await axios.post("http://192.168.57.150:8080/api/upload-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'File đã được tải lên thành công!',
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Có lỗi xảy ra khi tải file lên.',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  const toggleStatus = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      await axios.patch(`http://192.168.57.150:8080/api/${id}/status`, {
        status: newStatus,
      });

      // Cập nhật trạng thái sản phẩm trên giao diện
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, status: newStatus } : product
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Đã ${newStatus === 1 ? 'bật' : 'tắt'} hiển thị sản phẩm!`,
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xin lỗi',
        text2: 'Lỗi khi cập nhật trạng thái sản phẩm!',
        position: 'top',
        visibilityTime: 1000,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Link href="/(dashboard)/Home">
          <Text style={styles.headerText}>
            <Text style={{ fontSize: 20 }}>{"⟨ "}</Text> Quay lại
          </Text>
        </Link>
      </View>

      <Text style={styles.header}>Quản lý sản phẩm</Text>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(dashboard)/ProductUpload')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Thêm sản phẩm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Upload Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getProducts}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.buttonText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4775EA" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal chỉnh sửa sản phẩm */}
      {isModalVisible && selectedProduct && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  <Ionicons name="create-outline" size={24} color="#4775EA" style={{ marginRight: 10 }} />
                  Chỉnh sửa sản phẩm
                </Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.pickerLabel}>Danh mục sản phẩm</Text>
                    <RNPickerSelect
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(
                          (category) => category.id.toString() === value
                        );
                        if (selectedCategory) {
                          setFilteredBrands(selectedCategory.brands || []);
                        } else {
                          setFilteredBrands([]);
                        }
                        setNewProduct((prev) => ({ ...prev, categoryId: value }));
                      }}
                      items={categories.map((category) => ({
                        label: category.name,
                        value: category.id.toString(),
                      }))}
                      placeholder={{
                        label: categories.find((cat) => cat.id.toString() === selectedProduct?.category?.id?.toString())?.name || "Chọn danh mục",
                        value: null,
                      }}
                      style={pickerSelectStyles}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.pickerLabel}>Nhà cung cấp</Text>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, brandId: value }))
                      }
                      items={filteredBrands.map((brand) => ({
                        label: brand.name,
                        value: brand.id.toString(),
                      }))}
                      placeholder={{ label: "Chọn nhà cung cấp", value: null }}
                      style={pickerSelectStyles}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Tên sản phẩm</Text>
                    <Controller
                      name="name"
                      control={control}
                      defaultValue={updatedProduct?.name || ""}
                      rules={{ required: 'Tên sản phẩm là bắt buộc' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            placeholder="Tên sản phẩm"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value || ""}
                            style={styles.textInput}
                          />
                          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Giá sản phẩm</Text>
                      <Controller
                        name="price"
                        control={control}
                        defaultValue="0"
                        rules={{ required: 'Giá sản phẩm là bắt buộc' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View>
                            <TextInput
                              placeholder="Giá sản phẩm"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={(text) => onChange(text === "" ? "" : text)}
                              value={value === "0" ? "" : String(value)}
                              style={styles.textInput}
                            />
                            {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
                          </View>
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Giá khuyến mãi</Text>
                      <Controller
                        name="salePrice"
                        control={control}
                        defaultValue="0"
                        rules={{ required: 'Giá sale là bắt buộc' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View>
                            <TextInput
                              placeholder="Giá sale sản phẩm"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={(text) => onChange(text === "" ? "" : text)}
                              value={value === "0" ? "" : String(value)}
                              style={styles.textInput}
                            />
                            {errors.salePrice && <Text style={styles.errorText}>{errors.salePrice.message}</Text>}
                          </View>
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Số lượng trong kho</Text>
                      <Controller
                        name="totalStock"
                        control={control}
                        defaultValue="0"
                        rules={{ required: 'Số lượng là bắt buộc' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View>
                            <TextInput
                              placeholder="Số lượng trong kho"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={(text) => onChange(text === "" ? "" : text)}
                              value={value === "0" ? "" : String(value)}
                              style={styles.textInput}
                            />
                            {errors.totalStock && <Text style={styles.errorText}>{errors.totalStock.message}</Text>}
                          </View>
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Số lượng đã bán</Text>
                      <Controller
                        name="stock"
                        control={control}
                        defaultValue="0"
                        rules={{ required: 'Số lượng là bắt buộc' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View>
                            <TextInput
                              placeholder="Số lượng đã bán"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={(text) => onChange(text === "" ? "" : text)}
                              value={value === "0" ? "" : String(value)}
                              style={styles.textInput}
                            />
                            {errors.stock && <Text style={styles.errorText}>{errors.stock.message}</Text>}
                          </View>
                        )}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Mô tả sản phẩm</Text>
                    <Controller
                      name="description"
                      control={control}
                      defaultValue="Chưa cập nhật"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          placeholder="Mô tả sản phẩm"
                          multiline
                          numberOfLines={3}
                          onBlur={onBlur}
                          onChangeText={(text) => onChange(text === "" ? "" : text)}
                          value={value === "Chưa cập nhật" ? "" : value}
                          style={[styles.textInput, { textAlignVertical: 'top', minHeight: 80 }]}
                        />
                      )}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Kích thước màn hình</Text>
                      <Controller
                        name="screen"
                        defaultValue="Chưa cập nhật"
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Kích thước màn hình (inch)"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Loại màn hình</Text>
                      <Controller
                        name="display"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Loại màn hình (lcd/oled)"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>

                  {/* Các trường kỹ thuật khác được nhóm tương tự */}
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Công nghệ màn hình</Text>
                      <Controller
                        name="screenTechnology"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Công nghệ màn hình"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Độ phân giải</Text>
                      <Controller
                        name="screenResolution"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Độ phân giải màn hình"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Camera chính</Text>
                      <Controller
                        name="mainCamera"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Camera chính"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Camera trước</Text>
                      <Controller
                        name="frontCamera"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Camera trước"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Chipset</Text>
                      <Controller
                        name="chipset"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Chipset"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>RAM</Text>
                      <Controller
                        name="ram"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="RAM"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Bộ nhớ trong</Text>
                      <Controller
                        name="internalMemory"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Bộ nhớ trong"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Hệ điều hành</Text>
                      <Controller
                        name="operatingSystem"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Hệ điều hành"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Dung lượng pin</Text>
                      <Controller
                        name="battery"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Dung lượng pin"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Trọng lượng</Text>
                      <Controller
                        name="weight"
                        control={control}
                        defaultValue="Chưa cập nhật"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            placeholder="Trọng lượng"
                            onBlur={onBlur}
                            onChangeText={(text) => onChange(text === "" ? "" : text)}
                            value={value === "Chưa cập nhật" ? "" : value}
                            style={styles.textInput}
                          />
                        )}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Màu sắc và hình ảnh</Text>

                  <View style={styles.colorSection}>
                    <Text style={styles.colorTitle}>Chọn ít nhất 1 màu cho sản phẩm (bắt buộc)</Text>
                    <View style={styles.colorGrid}>
                      {['black', 'white', 'red', 'grey', 'purple', 'yellow', 'gray', 'pink', 'green', 'blue', 'silver', 'brown'].map((color) => (
                        <View key={color} style={styles.colorItem}>
                          <Switch
                            value={colors.includes(color)}
                            onValueChange={() =>
                              setColors((prev) =>
                                prev.includes(color)
                                  ? prev.filter((c) => c !== color)
                                  : [...prev, color]
                              )
                            }
                            trackColor={{ true: '#4775EA', false: '#ccc' }}
                            thumbColor={colors.includes(color) ? '#4775EA' : color}
                          />
                          <Text style={styles.colorLabel}>{color}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.imageSection}>
                    <Text style={styles.imageTitle}>
                      Đã chọn {selectedImages.length} hình ảnh
                    </Text>
                    <Text style={styles.imageSubtitle}>
                      Vui lòng chọn hình ảnh theo thứ tự màu đã chọn
                    </Text>

                    <TouchableOpacity style={styles.selectImageButton} onPress={pickImage}>
                      <Ionicons name="images-outline" size={20} color="#fff" />
                      <Text style={styles.selectImageText}>Chọn hình ảnh</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)}>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Lưu</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal Upload Excel */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContent}>
            <View style={styles.uploadModalHeader}>
              <Ionicons name="document-outline" size={24} color="#4775EA" />
              <Text style={styles.uploadModalTitle}>Upload File Excel</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.fileSelectButton} onPress={pickDocument}>
              <Ionicons name="folder-open-outline" size={20} color="#fff" />
              <Text style={styles.fileSelectText}>Chọn File</Text>
            </TouchableOpacity>

            {file && (
              <View style={styles.selectedFileContainer}>
                <Ionicons name="document" size={20} color="#4775EA" />
                <Text style={styles.selectedFileName}>File đã chọn: {file.name}</Text>
              </View>
            )}

            <View style={styles.uploadModalButtons}>
              <TouchableOpacity
                style={[styles.uploadModalButton, styles.uploadButton]}
                onPress={uploadFile}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadModalButtonText}>Gửi File</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadModalButton, styles.cancelUploadButton]}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close-outline" size={18} color="#fff" />
                <Text style={styles.uploadModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const pickerSelectStyles = {
  inputIOS: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#333',
    paddingRight: 30, // Để dành chỗ cho icon
  },
  inputAndroid: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#333',
    paddingRight: 30, // Để dành chỗ cho icon
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
    marginTop: 30
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
    textAlign: 'center'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
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
  productList: {
    paddingBottom: 20,
  },
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  productDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    width: 80,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  priceValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textDecorationLine: 'line-through',
  },
  salePriceValue: {
    fontSize: 15,
    color: '#E53935',
    fontWeight: '600',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 15,
    color: '#666',
    width: 80,
  },
  toggleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#4CAF50',
  },
  toggleOff: {
    backgroundColor: '#757575',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4d4f',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4775EA',
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 5,
    marginTop: 50,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  modalScrollView: {
    paddingHorizontal: 15,
  },
  formSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4775EA',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 2,
  },
  colorSection: {
    marginVertical: 10,
  },
  colorTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '33.33%',
    marginBottom: 10,
  },
  colorLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  imageSection: {
    marginTop: 15,
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  imageSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
  },
  selectImageButton: {
    flexDirection: 'row',
    backgroundColor: '#4775EA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Upload Excel Modal Styles
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  closeModalButton: {
    padding: 5,
  },
  fileSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4775EA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  fileSelectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  uploadModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  uploadModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },

  cancelUploadButton: {
    backgroundColor: '#F44336',
  },
  uploadModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProductDashboard;
