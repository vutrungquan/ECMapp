import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";
import { RouteProp, useRoute } from '@react-navigation/native';
import axios from "axios";
import Toast from 'react-native-toast-message';
import { useUser } from '../(auth)/UserContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

interface ProductDetail {
  id: number;
  name: string;
  screen: string;
  display: string;
  price: string;
  salePrice?: string;
  description: string;
  stock: number;
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
}

type ProductDetailRouteParams = {
  id: string;
};

const promotions = [
  { id: 1, description: "Giảm 10% khi mua kèm phụ kiện", icon: "pricetag-outline" },
  { id: 2, description: "Bảo hành 2 năm miễn phí", icon: "shield-checkmark-outline" },
  { id: 3, description: "Giao hàng miễn phí toàn quốc", icon: "bicycle-outline" },
];

const getLuminance = (color: string) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const getCheckmarkColor = (color: string) => {
  const luminance = getLuminance(color);
  return luminance > 130 ? "black" : "white";
};

export default function ProductDetailScreen() {
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const route = useRoute<RouteProp<{ params: ProductDetailRouteParams }, 'params'>>();
  const { id } = route.params;
  const { userInfo } = useUser();
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [selectedColors, setSelectedColors] = useState<{ [key: number]: number }>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Load product details
  useEffect(() => {
    if (id) {
      axios
        .get<ProductDetail>(`http://192.168.57.150:8080/api/product/${id}`)
        .then((response) => {
          setProductDetail(response.data);
          // Set default selected color
          if (response.data && response.data.id) {
            setSelectedColors({ [response.data.id]: 0 });
          }
        })
        .catch((error) => console.error("Lỗi khi lấy dữ liệu chi tiết sản phẩm:", error));
    }
  }, [id]);

  const handleAddToCart = async (product: ProductDetail) => {
    try {
      if (!userInfo) {
        Toast.show({
          type: 'error',
          text1: 'Chưa đăng nhập',
          text2: "Bạn cần đăng nhập để thực hiện mua hàng!",
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }

      // Get selected color
      const selectedColorIndex = selectedColors[product.id] || 0;
      const selectedColor = product.colors[selectedColorIndex];
      const selectedImagePath = product.imagePaths[selectedColorIndex];

      // Check stock availability
      if (product.stock === 0) {
        Toast.show({
          type: 'error',
          text1: 'Sản phẩm hết hàng',
          text2: `Sản phẩm ${product.name} hiện không còn trong kho.`,
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }

      if (quantity > product.stock) {
        Toast.show({
          type: 'error',
          text1: 'Số lượng vượt quá tồn kho',
          text2: `Chỉ còn ${product.stock} sản phẩm ${product.name} trong kho.`,
          position: 'top',
          visibilityTime: 1000,
        });
        return;
      }

      // Create cart item to send to backend
      const cartItem = {
        productId: product.id,
        productName: product.name,
        price: product.salePrice || product.price,
        quantity: quantity,
        selectedColor: selectedColor,
        selectedImagePath: selectedImagePath,
      };

      // Send request to add product to cart
      await axios.post(
        `http://192.168.57.150:8080/api/cart/add/${userInfo?.id}`,
        cartItem
      );

      // Show success notification
      Toast.show({
        type: 'success',
        text1: 'Thêm vào giỏ hàng',
        text2: `${product.name} đã được thêm vào giỏ hàng!`,
        position: 'top',
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Có lỗi xảy ra',
        text2: 'Không thể thêm sản phẩm vào giỏ hàng.',
        position: "top",
        visibilityTime: 1000,
      });
    }
  };

  // Calculate stock percentage for progress bar
  const calculateStockPercentage = (stock: number) => {
    if (!productDetail) return 0;
    const totalStock = stock + 10; // Assuming some buffer
    return Math.min((stock / totalStock) * 100, 100);
  };

  // Toggle specs visibility
  const toggleDetails = () => setShowAllDetails(!showAllDetails);

  // Calculate total price with discount if applicable
  const formatPrice = (price: string) => {
    return parseInt(price).toLocaleString('vi-VN');
  };

  // Show loading screen while data is being fetched
  if (!productDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4775EA" />
        <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
      </View>
    );
  }

  // Create array of specs for display
  const productSpecifications = [
    { key: "Kích thước màn hình", value: productDetail?.screen || "Chưa cập nhật", icon: "resize-outline" },
    { key: "Công nghệ màn hình", value: productDetail?.screenTechnology || "Chưa cập nhật", icon: "phone-portrait-outline" },
    { key: "Độ phân giải màn hình", value: productDetail?.screenResolution || "Chưa cập nhật", icon: "scan-outline" },
    { key: "Camera chính", value: productDetail?.mainCamera || "Chưa cập nhật", icon: "camera-outline" },
    { key: "Camera trước", value: productDetail?.frontCamera || "Chưa cập nhật", icon: "camera-reverse-outline" },
    { key: "Chipset", value: productDetail?.chipset || "Chưa cập nhật", icon: "hardware-chip-outline" },
    { key: "RAM", value: productDetail?.ram || "Chưa cập nhật", icon: "analytics-outline" },
    { key: "Bộ nhớ trong", value: productDetail?.internalMemory || "Chưa cập nhật", icon: "save-outline" },
    { key: "Hệ điều hành", value: productDetail?.operatingSystem || "Chưa cập nhật", icon: "logo-android" },
    { key: "Pin", value: productDetail?.battery || "Chưa cập nhật", icon: "battery-full-outline" },
    { key: "Trọng lượng", value: productDetail?.weight || "Chưa cập nhật", icon: "barbell-outline" },
  ];

  // Only show a subset of specs initially
  const visibleDetails = showAllDetails ? productSpecifications : productSpecifications.slice(0, 5);

  // Get selected color index for this product
  const selectedColorIndex = selectedColors[productDetail.id] || 0;

  // Calculate discount percentage if sale price exists
  const discountPercentage = productDetail.salePrice && parseInt(productDetail.price) > parseInt(productDetail.salePrice)
    ? Math.round(((parseInt(productDetail.price) - parseInt(productDetail.salePrice)) / parseInt(productDetail.price)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with back button */}
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
        <Link href="/">
          <Text style={styles.headerText}>
            <Text style={{ fontSize: 20 }}>{"⟨ "}</Text> Xem thêm sản phẩm
          </Text>
        </Link>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Image Carousel */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `http://192.168.57.150/images/${productDetail.imagePaths[selectedColorIndex]}` }}
            style={styles.productImage}
            resizeMode="contain"
          />

          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercentage}%</Text>
            </View>
          )}
        </View>

        {/* Color Selection */}
        <View style={styles.colorSelectorContainer}>
          <Text style={styles.colorSelectorTitle}>Màu sắc:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScrollView}>
            <View style={styles.colorContainer}>
              {productDetail.colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedColorIndex === index && styles.selectedColorButton
                  ]}
                  onPress={() => {
                    setSelectedColors((prev) => ({ ...prev, [productDetail.id]: index }));
                    setActiveImageIndex(index);
                  }}
                >
                  {selectedColorIndex === index && (
                    <Text style={[styles.checkmark, { color: getCheckmarkColor(color) }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Product Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.productTitle}>{productDetail.name}</Text>

          <View style={styles.priceContainer}>
            {productDetail.salePrice && parseInt(productDetail.salePrice) > 0 ? (
              <>
                <Text style={styles.salePrice}>{formatPrice(productDetail.salePrice)}₫</Text>
                <Text style={styles.originalPrice}>{formatPrice(productDetail.price)}₫</Text>
              </>
            ) : (
              <Text style={styles.salePrice}>{formatPrice(productDetail.price)}₫</Text>
            )}
          </View>

          {/* Stock Indicator */}
          <View style={styles.stockContainer}>
            <View style={[
              styles.stockProgressBar,
              {
                width: `${calculateStockPercentage(productDetail.stock)}%`,
                backgroundColor: productDetail.stock > 10
                  ? '#4CAF50'
                  : productDetail.stock > 5
                    ? '#FFC107'
                    : '#FF5722'
              }
            ]} />
            <View style={styles.stockTextContainer}>
              <Ionicons name="cube-outline" size={16} color="#444" />
              <Text style={styles.stockText}>
                Còn {productDetail.stock} sản phẩm
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Số lượng:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color="#444" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(productDetail.stock, quantity + 1))}
                disabled={quantity >= productDetail.stock}
              >
                <Ionicons name="add" size={20} color="#444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Promotions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="gift-outline" size={20} color="#4775EA" />
            <Text> Ưu đãi đặc biệt</Text>
          </Text>

          {promotions.map((promo) => (
            <View key={promo.id} style={styles.promotionItem}>
              <Ionicons name={promo.icon as any} size={20} color="#4CAF50" />
              <Text style={styles.promotionText}>{promo.description}</Text>
            </View>
          ))}
        </View>

        {/* Tech Specs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="hardware-chip-outline" size={20} color="#4775EA" />
            <Text> Thông số kỹ thuật</Text>
          </Text>

          {visibleDetails.map((detail, index) => (
            <View key={index} style={styles.specificationItem}>
              <View style={styles.specKeyContainer}>
                <Ionicons name={detail.icon as any} size={18} color="#666" style={styles.specIcon} />
                <Text style={styles.specKey}>{detail.key}</Text>
              </View>
              <Text style={styles.specValue}>{detail.value}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.showMoreButton} onPress={toggleDetails}>
            <Text style={styles.showMoreText}>
              {showAllDetails ? "Ẩn bớt" : "Xem thêm thông số"}
            </Text>
            <Ionicons
              name={showAllDetails ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color="#4775EA"
            />
          </TouchableOpacity>
        </View>

        {/* Description Section */}
        {productDetail.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle-outline" size={20} color="#4775EA" />
              <Text> Mô tả sản phẩm</Text>
            </Text>
            <Text style={styles.descriptionText}>{productDetail.description}</Text>
          </View>
        )}

        {/* Bottom spacer for fixed button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Fixed Add to Cart Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(productDetail)}
        >
          <Ionicons name="cart-outline" size={22} color="#fff" />
          <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  // Image section
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: width * 0.8,
    height: width * 0.8,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Color selector
  colorSelectorContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  colorScrollView: {
    flexGrow: 0,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedColorButton: {
    borderColor: '#4775EA',
    borderWidth: 3,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Details section
  detailsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  salePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E53935',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
  },

  // Stock indicator
  stockContainer: {
    position: 'relative',
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  stockProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  stockTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444',
    marginLeft: 5,
  },

  // Quantity selector
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityText: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Promotion items
  promotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  promotionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#444',
  },

  // Specification items
  specificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specIcon: {
    marginRight: 8,
  },
  specKey: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },

  // Show more button
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 15,
    color: '#4775EA',
    fontWeight: '600',
    marginRight: 5,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },

  // Bottom button
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addToCartButton: {
    backgroundColor: '#4775EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Loading state
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
});
