import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import { Link, useRouter } from "expo-router";
import axios from "axios";
import { useUser } from '../(auth)/UserContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from "@/components/ThemedView";

const { width } = Dimensions.get("window");

interface Product {
  id: number;
  productName: string;
  price: string;
  salePrice?: string;
  selectedImagePath: string;
  selectedColor: string;
  quantity: number;
  stock: number;
  promotions: string[];
}

export default function CartScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPromotions, setSelectedPromotions] = useState<{ [key: number]: string[] }>({});
  const router = useRouter();
  const { userInfo } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Available promotions
  const promotionsArray = [
    "Giảm giá 10% cho đơn hàng từ 500k",
    "Miễn phí vận chuyển cho đơn hàng đầu tiên",
    "Giảm giá 5% cho lần mua tiếp theo",
    "Mua 1 tặng 1 sản phẩm cùng loại",
    "Giảm thêm 15% cho khách hàng thân thiết",
    "Bảo hành mở rộng 24 tháng",
    "Giảm 50k khi thanh toán online"
  ];

  const getRandomPromotions = (promotions: string[], count: number) => {
    const shuffled = [...promotions]; // Create a copy of the array
    let i = shuffled.length, temp, randomIndex;

    // Fisher-Yates shuffle algorithm
    while (i) {
      randomIndex = Math.floor(Math.random() * i--);
      temp = shuffled[i];
      shuffled[i] = shuffled[randomIndex];
      shuffled[randomIndex] = temp;
    }

    return shuffled.slice(0, count); // Take the first count elements
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      if (userInfo) {
        setIsLoading(true);
        try {
          const response = await axios.get(`http://192.168.57.150:8080/api/cart/${userInfo.id}`);

          const productsWithDefaultPromotions = response.data.map((product: any) => ({
            ...product,
            promotions: product.promotions || [] // Default to empty array if undefined
          }));

          // Assign random promotions to each product
          const productsWithPromotions = productsWithDefaultPromotions.map((product: any) => {
            const randomPromotions = getRandomPromotions(promotionsArray, 2); // Get 2 random promotions
            return { ...product, promotions: randomPromotions };
          });

          setProducts(productsWithPromotions);
        } catch (error) {
          // Error handling could be added here
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCartItems();
  }, [userInfo]);

  // Calculate cart total
  const calculateTotal = () => {
    return products.reduce((total, product) => {
      const price = product.salePrice
        ? parseFloat(String(product.salePrice).replace(/\./g, ""))
        : parseFloat(String(product.price).replace(/\./g, ""));
      return total + price * (product.quantity || 1);
    }, 0);
  };

  // Navigate to checkout
  const handleCheckout = () => {
    if (products.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Giỏ hàng trống',
        text2: 'Bạn cần thêm sản phẩm vào giỏ hàng để tiếp tục.',
        position: "top",
        visibilityTime: 1000,
      });
    } else if (!userInfo) {
      Toast.show({
        type: 'error',
        text1: 'Chưa đăng nhập',
        text2: 'Bạn cần đăng nhập để thực hiện thanh toán!',
        position: "top",
        visibilityTime: 1000,
      });
    } else {
      router.push("./pay"); // Navigate to payment page
    }
  };

  // Handle promotion selection
  const handlePromotionSelect = (id: number, promotion: string) => {
    setSelectedPromotions((prevSelected) => {
      const currentPromotions = prevSelected[id] || [];
      if (currentPromotions.includes(promotion)) {
        return {
          ...prevSelected,
          [id]: currentPromotions.filter((p) => p !== promotion),
        };
      } else {
        return {
          ...prevSelected,
          [id]: [...currentPromotions, promotion],
        };
      }
    });
  };

  // Increase product quantity
  const increaseQuantity = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === id) {
          // Check if current quantity has reached stock limit
          if (product.quantity === product.stock) {
            Toast.show({
              type: "error",
              text1: "Hết hàng",
              text2: `Số lượng sản phẩm "${product.productName}" đã đạt giới hạn trong kho.`,
              position: "top",
              visibilityTime: 1000,
            });
            return product; // Keep quantity unchanged
          }

          // Increase product quantity
          const newQuantity = product.quantity + 1;
          updateProductQuantity(id, newQuantity);
          return { ...product, quantity: newQuantity };
        }
        return product;
      })
    );
  };

  // Decrease product quantity
  const decreaseQuantity = (id: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === id && product.quantity > 1) {
          const newQuantity = product.quantity - 1;
          updateProductQuantity(id, newQuantity);
          return { ...product, quantity: newQuantity };
        }
        return product;
      })
    );
  };

  // Remove product from cart
  const removeProduct = (productId: number) => {
    if (userInfo) {
      axios.delete(`http://192.168.57.150:8080/api/cart/remove/${userInfo.id}/${productId}`)
        .then(() => {
          setProducts((prevProducts) =>
            prevProducts.filter((product) => product.id !== productId)
          );
          Toast.show({
            type: 'success',
            text1: 'Đã xóa',
            text2: 'Sản phẩm đã được xóa khỏi giỏ hàng',
            position: 'top',
            visibilityTime: 1000,
          });
        })
        .catch(error => {
          Toast.show({
            type: 'error',
            text1: 'Xin lỗi',
            text2: 'Lỗi xoá sản phẩm!',
            position: 'top',
            visibilityTime: 1000,
          });
        });
    }
  };

  // Update product quantity on server
  const updateProductQuantity = async (id: number, newQuantity: number) => {
    try {
      if (userInfo && newQuantity > 0) {
        await axios.put(`http://192.168.57.150:8080/api/cart/update/${userInfo.id}/${id}`, { quantity: newQuantity });
      }
    } catch (error) {
      // Error handling could be added here
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4775EA" />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  // Render each product in cart
  const renderProduct = ({ item }: { item: Product }) => {
    const price = item.salePrice ? Number(item.salePrice) : Number(item.price);
    const totalItemPrice = price * item.quantity;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeProduct(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#FF5252" />
          </TouchableOpacity>
        </View>

        <View style={styles.productContent}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `http://192.168.57.150/images/${item.selectedImagePath}` }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>

          {/* Product Details */}
          <View style={styles.productDetails}>
            {/* Pricing */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Giá:</Text>
              <Text style={styles.priceValue}>{parseInt(item.price).toLocaleString("vi-VN")}₫</Text>
            </View>

            {/* Selected Color */}
            <View style={styles.colorContainer}>
              <Text style={styles.colorLabel}>Màu sắc:</Text>
              <View style={styles.colorBadge}>
                <Text style={styles.colorValue}>{item.selectedColor}</Text>
              </View>
            </View>

            {/* Quantity Controls */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Số lượng:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    item.quantity <= 1 && styles.quantityButtonDisabled
                  ]}
                  onPress={() => decreaseQuantity(item.id)}
                  disabled={item.quantity <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={item.quantity <= 1 ? "#aaa" : "#444"}
                  />
                </TouchableOpacity>

                <View style={styles.quantityValueContainer}>
                  <Text style={styles.quantityValue}>{item.quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    item.quantity >= item.stock && styles.quantityButtonDisabled
                  ]}
                  onPress={() => increaseQuantity(item.id)}
                  disabled={item.quantity >= item.stock}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={item.quantity >= item.stock ? "#aaa" : "#444"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Item Total */}
            <View style={styles.itemTotalContainer}>
              <Text style={styles.itemTotalLabel}>Thành tiền:</Text>
              <Text style={styles.itemTotalValue}>
                {totalItemPrice.toLocaleString("vi-VN")}₫
              </Text>
            </View>
          </View>
        </View>

        {/* Promotions */}
        {item.promotions && item.promotions.length > 0 && (
          <View style={styles.promotionsSection}>
            <Text style={styles.promotionsSectionTitle}>Khuyến mãi:</Text>
            {item.promotions.map((promotion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.promotionItem}
                onPress={() => handlePromotionSelect(item.id, promotion)}
              >
                <Ionicons
                  name={selectedPromotions[item.id]?.includes(promotion)
                    ? "checkbox"
                    : "square-outline"}
                  size={20}
                  color={selectedPromotions[item.id]?.includes(promotion) ? "#4CAF50" : "#666"}
                  style={styles.promotionCheckbox}
                />
                <Text style={styles.promotionText}>{promotion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Calculate item count and total
  const itemCount = products.reduce((count, product) => count + product.quantity, 0);
  const total = calculateTotal();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with back button */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.headerTitle}>Mua thêm sản phẩm khác</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Cart Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={products.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="cart-outline" size={100} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptyStateMessage}>
              Bạn chưa thêm sản phẩm nào vào giỏ hàng
            </Text>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.shopNowButton}>
                <Text style={styles.shopNowButtonText}>Mua sắm ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <View style={styles.cartContent}>
            <Text style={styles.sectionTitle}>
              Giỏ hàng của bạn ({products.length} sản phẩm)
            </Text>

            {/* Product List */}
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.productList}
            />
          </View>
        )}

        {/* Extra space at bottom for fixed elements */}
        {products.length > 0 && <View style={{ height: 160 }} />}
      </ScrollView>

      {/* Cart Summary and Checkout Button - Fixed at bottom */}
      {products.length > 0 && (
        <View style={styles.bottomContainer}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính ({itemCount} sản phẩm):</Text>
              <Text style={styles.summaryValue}>{total.toLocaleString("vi-VN")}₫</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
              <Text style={styles.freeShippingText}>MIỄN PHÍ</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{total.toLocaleString("vi-VN")}₫</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" style={styles.checkoutIcon} />
            <Text style={styles.checkoutText}>Đặt hàng ngay</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#f5f7fa',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Cart Content
  cartContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  productList: {
    paddingBottom: 20,
  },

  // Product Card
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    padding: 5,
  },
  productContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 5,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53935',
  },

  // Color
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  colorBadge: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  colorValue: {
    fontSize: 13,
    color: '#444',
  },

  // Quantity
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValueContainer: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Item Total
  itemTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTotalLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
  },

  // Promotions
  promotionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  promotionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  promotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  promotionCheckbox: {
    marginRight: 8,
  },
  promotionText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },

  // Bottom section
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  summaryContainer: {
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  checkoutButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutIcon: {
    marginRight: 8,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#4775EA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  shopNowButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
