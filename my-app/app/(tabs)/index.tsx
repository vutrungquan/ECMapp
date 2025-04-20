import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  Dimensions,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useUser } from "../(auth)/UserContext";
import { useRoute } from "@react-navigation/native";
const { width } = Dimensions.get("window");

interface Product {
  id: number;
  name: string;
  screen: string;
  display: string;
  price: string;
  salePrice?: string;
  discount?: string;
  stock: number;
  totalStock: number;
  categoryId: number;
  imagePaths: any[];
  colors: string[];
  quantity?: number;
  productId: number;
}
interface ItemBanner {
  id: number;
  name: string;
  image: string;
}
interface ItemCategory {
  id: number;
  slug: string;
  name: string;
  image: string;
}

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

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dataBanner, setDataBanner] = useState<ItemBanner[]>([]);
  const [dataCategory, setDataCategory] = useState<ItemCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const clearSearch = () => { setSearchQuery(""); };
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedColors, setSelectedColors] = useState<{
    [key: number]: number;
  }>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { userInfo } = useUser();
  const [cartItemCount, setCartItemCount] = useState(0);
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};

  useEffect(() => {
    if (!id) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    axios
      .get<Product[]>(`http://192.168.57.150:8080/api/products/brand/${id}`)
      .then((response) => {
        setProducts(response.data || []);
      })
      .catch((error) => {
        setProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const productsResponse = await axios.get<Product[]>(
        "http://192.168.57.150:8080/api/products"
      );
      const bannerResponse = await axios.get<ItemBanner[]>(
        "http://192.168.57.150:8080/api/banners"
      );
      const categoryResponse = await axios.get<ItemCategory[]>(
        "http://192.168.57.150:8080/api/categories"
      );

      setProducts(productsResponse.data.sort((a, b) => b.id - a.id));
      setDataBanner(bannerResponse.data);
      setDataCategory(categoryResponse.data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCartItems = async () => {
    if (!userInfo) {
      return;
    }
    try {
      const response = await axios.get(`http://192.168.57.150:8080/api/cart/${userInfo.id}`);
      const cartItems = response.data;
      setCart(cartItems);
      setCartItemCount(cartItems.length);
    } catch (error) {
      // Error handling
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [userInfo]);

  const handleAddToCart = async (product: Product) => {
    try {
      if (!userInfo) {
        Toast.show({
          type: "error",
          text1: "Chưa đăng nhập",
          text2: "Bạn cần đăng nhập để thực hiện mua hàng!",
          position: "top",
          visibilityTime: 1000,
        });
        return;
      }
      if (product.stock <= 0) {
        Toast.show({
          type: "error",
          text1: "Sản phẩm hết hàng",
          text2: `${product.name} hiện không có trong kho.`,
          position: "top",
          visibilityTime: 1000,
        });
        return;
      }

      // Lấy tổng số lượng sản phẩm hiện có trong giỏ hàng
      const existingCartItem = cart.find((item) => item.productId === product.id);
      const currentQuantityInCart: number = existingCartItem?.quantity || 0;

      // Kiểm tra nếu số lượng thêm vượt quá số lượng còn trong kho
      if (currentQuantityInCart + 1 > product.stock) {
        Toast.show({
          type: "error",
          text1: "Không thể thêm",
          text2: `Số lượng ${product.name} vượt quá số lượng trong kho.`,
          position: "top",
          visibilityTime: 1000,
        });
        return;
      }

      const selectedColorIndex = selectedColors[product.id] || 0;
      const selectedColor = product.colors[selectedColorIndex];
      const selectedImagePath = product.imagePaths[selectedColorIndex];

      const cartItem = {
        productId: product.id,
        productName: product.name,
        price: product.salePrice || product.price,
        quantity: 1,
        stock: product.stock,
        selectedColor: selectedColor,
        selectedImagePath: selectedImagePath,
      };

      await axios.post(
        `http://192.168.57.150:8080/api/cart/add/${userInfo.id}`,
        cartItem
      );

      fetchCartItems();

      Toast.show({
        type: "success",
        text1: "Thêm vào giỏ hàng",
        text2: `${product.name} đã được thêm vào giỏ hàng!`,
        position: "top",
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Có lỗi xảy ra",
        text2: "Không thể thêm sản phẩm vào giỏ hàng.",
        position: "top",
        visibilityTime: 1000,
      });
    }
  };

  const handleAddToCartPay = async (product: Product) => {
    if (!userInfo) {
      Toast.show({
        type: "error",
        text1: "Chưa đăng nhập",
        text2: "Bạn cần đăng nhập để thực hiện mua hàng!",
        position: "top",
        visibilityTime: 1000,
      });
    } else {
      try {
        if (product.stock <= 0) {
          Toast.show({
            type: "error",
            text1: "Sản phẩm hết hàng",
            text2: `${product.name} hiện không có trong kho.`,
            position: "top",
            visibilityTime: 1000,
          });
          return;
        }
        const selectedColorIndex = selectedColors[product.id] || 0;
        const selectedColor = product.colors[selectedColorIndex];
        const selectedImagePath = product.imagePaths[selectedColorIndex];
        const cartItem = {
          productId: product.id,
          productName: product.name,
          price: product.salePrice || product.price,
          quantity: 1,
          stock: product.stock,
          selectedColor: selectedColor,
          selectedImagePath: selectedImagePath,
        };

        await axios.post(
          `http://192.168.57.150:8080/api/cart/add/${userInfo.id}`,
          cartItem
        );

        fetchCartItems();
        router.push("../(product)/pay");
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Có lỗi xảy ra",
          text2: "Không thể thêm sản phẩm vào giỏ hàng.",
          position: "top",
          visibilityTime: 1000,
        });
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % dataBanner.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [dataBanner]);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      axios
        .get<Product[]>(
          `http://192.168.57.150:8080/api/products/category/${selectedCategoryId}`
        )
        .then((response) => {
          setProducts(response.data);
        })
        .catch((error) => {
          Toast.show({
            type: "error",
            text1: "Có lỗi xảy ra",
            text2: "Không thể lấy sản phẩm theo category.",
            position: "top",
            visibilityTime: 1000,
          });
        });
    }
  }, [selectedCategoryId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchCartItems();
    setSelectedCategoryId(null);
    setRefreshing(false);
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) =>
      product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4775EA" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Show indicators for banner carousel
  const renderBannerIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {dataBanner.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentIndex === index ? styles.activeIndicator : {},
            ]}
          />
        ))}
      </View>
    );
  };

  // Handle scroll event to update currentIndex
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(currentIndex);
  };

  // Ensure the FlatList renders fixed-size items by calculating the proper dimensions
  const ITEM_WIDTH = (width - 32) / 2; // Account for padding and gap
  const ITEM_MARGIN = 6;

  const renderProduct = ({ item }: { item: Product }) => {
    const selectedColorIndex = selectedColors[item.id] || 0;
    const discountPercentage = item.salePrice
      ? Math.round(((parseInt(item.price) - parseInt(item.salePrice)) / parseInt(item.price)) * 100)
      : 0;
    const stockPercentage = (item.stock / item.totalStock) * 100;

    return (
      <View style={[
        styles.productContainer,
        { width: ITEM_WIDTH }
      ]}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => router.push(`../(product)/productDetail?id=${item.id}`)}
          activeOpacity={0.7}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: `http://192.168.57.150/images/${item.imagePaths[selectedColorIndex]}`,
              }}
              style={styles.productImage}
              resizeMode="contain"
            />

            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercentage}%</Text>
              </View>
            )}

            {/* Installment Badge */}
            {item.discount && (
              <View style={styles.installmentBadge}>
                <Text style={styles.installmentText}>Trả góp 0%</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
              {item.name}
            </Text>

            <View style={styles.specsContainer}>
              <View style={styles.specBox}>
                <Text style={styles.specText}>{item.screen}</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specText}>{item.display}</Text>
              </View>
            </View>

            {/* Color Selection */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScrollView}>
              <View style={styles.colorContainer}>
                {item.colors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColorIndex === index && styles.selectedColorButton,
                    ]}
                    onPress={() =>
                      setSelectedColors((prev) => ({ ...prev, [item.id]: index }))
                    }
                  >
                    {selectedColorIndex === index && (
                      <Text
                        style={[
                          styles.checkmark,
                          { color: getCheckmarkColor(color) },
                        ]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Price Information */}
            <View style={styles.priceContainer}>
              {item.salePrice && item.salePrice !== "0" ? (
                <>
                  <Text style={styles.salePrice}>
                    {parseInt(item.salePrice).toLocaleString("vi-VN")}₫
                  </Text>
                  <Text style={styles.originalPrice}>
                    {parseInt(item.price).toLocaleString("vi-VN")}₫
                  </Text>
                </>
              ) : (
                <Text style={styles.salePrice}>
                  {parseInt(item.price).toLocaleString("vi-VN")}₫
                </Text>
              )}
            </View>

            {/* Stock Bar */}
            <View style={styles.stockContainer}>
              <View
                style={[
                  styles.stockProgressBar,
                  {
                    width: `${Math.min(stockPercentage, 100)}%`,
                    backgroundColor: item.stock > 0
                      ? item.stock < item.totalStock / 3
                        ? '#FF6B6B' // Low stock - red
                        : item.stock < item.totalStock / 1.5
                          ? '#FFD166' // Medium stock - yellow
                          : '#4CAF50' // Good stock - green
                      : '#e0e0e0' // Out of stock - gray
                  }
                ]}
              />
              <Text style={styles.stockText}>
                Còn {item.stock}/{item.totalStock}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Thêm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={() => handleAddToCartPay(item)}
              >
                <Ionicons name="flash-outline" size={16} color="#fff" />
                <Text style={styles.buyButtonText}>Mua</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Search and Cart Header */}
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#4775EA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#4775EA" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push("../(product)/cart")}
          style={styles.cartButton}
        >
          <Ionicons name="cart" size={26} color="#4775EA" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4775EA"]}
          />
        }
      >
        {/* Banner Carousel */}
        <View style={styles.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {dataBanner.map((banner, index) => (
              <View key={index} style={styles.bannerSlide}>
                <Image
                  source={{ uri: `http://192.168.57.150/images/${banner.image}` }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          {renderBannerIndicators()}
        </View>

        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategoryId === null && styles.selectedCategoryButton
              ]}
              onPress={() => {
                setSelectedCategoryId(null);
                fetchData();
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name="grid" size={24} color={selectedCategoryId === null ? "#4775EA" : "#666"} />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoryId === null && styles.selectedCategoryText
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {dataCategory.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategoryId === category.id && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <View style={styles.categoryImageContainer}>
                  <Image
                    source={{
                      uri: `http://192.168.57.150/images/${category.image}`,
                    }}
                    style={styles.categoryImage}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === category.id && styles.selectedCategoryText,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product List */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Sản phẩm'}
            <Text style={styles.productCount}> ({filteredProducts.length})</Text>
          </Text>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyProductsContainer}>
              <Ionicons name="search" size={50} color="#ccc" />
              <Text style={styles.emptyProductsText}>
                {searchQuery
                  ? "Không tìm thấy sản phẩm nào phù hợp"
                  : "Không có sản phẩm nào"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productList}
              columnWrapperStyle={styles.productRow}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10, // Ensure it's above other elements
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f4f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  cartButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f4f8',
  },
  cartBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Banner styles
  bannerContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 16,
  },
  bannerSlide: {
    width: width - 20, // Adjust for padding
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    width: '100%',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#4775EA',
    width: 16,
  },

  // Category styles
  categorySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  categoryScrollContainer: {
    paddingVertical: 8,
    paddingRight: 16, // Add extra padding to see last item fully
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f2f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden', // Ensure image doesn't overflow container
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f2f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
    width: 80, // Fixed width to match container
  },
  selectedCategoryButton: {
    // Using a subtle indicator for selected category
  },
  selectedCategoryText: {
    color: '#4775EA',
    fontWeight: 'bold',
  },

  // Products section
  productSection: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32, // Extra padding at bottom for scroll
    marginBottom: 16,
  },
  productCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'normal',
  },
  productList: {
    // No paddingHorizontal needed as it's handled by the container
  },
  productRow: {
    justifyContent: 'space-between',
  },
  emptyProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
  },

  // Product card styles
  productContainer: {
    marginBottom: 12,
    // No percentage width, we use calculated width
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 370, // Fixed height for consistent cards
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#f9f9f9',
    padding: 8,
    height: 140, // Fixed height for images
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  installmentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD166',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  installmentText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
    flex: 1, // Take remaining space
    justifyContent: 'space-between', // Space content evenly
  },
  productName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 6,
    height: 40,
    lineHeight: 20,
  },
  specsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap', // Allow wrapping for small screens
  },
  specBox: {
    backgroundColor: '#f2f4f8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4, // In case of wrapping
  },
  specText: {
    fontSize: 12,
    color: '#666',
  },
  colorScrollView: {
    maxHeight: 32,
    marginBottom: 6,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorButton: {
    borderColor: '#4775EA',
    borderWidth: 2,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceContainer: {
    marginBottom: 6,
  },
  salePrice: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 13,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    position: 'relative',
    height: 20,
    backgroundColor: '#f2f4f8',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  stockProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 10,
  },
  stockText: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4775EA',
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  buyButtonText: { // Separate style for the "Buy" button text to make it more compact
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
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
