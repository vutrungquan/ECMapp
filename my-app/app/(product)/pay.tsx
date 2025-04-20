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
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import { Checkbox } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { Link, useRouter } from "expo-router";
import axios from "axios";
import { useUser } from '../(auth)/UserContext';
import { KeyboardAvoidingView } from 'react-native';
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
  promotions: string[];
}

// Location data for store selection
type LocationData = {
  [city: string]: {
    districts: {
      [district: string]: string[];
    };
  };
};

const locationData: LocationData = {
  "Hồ Chí Minh": {
    districts: {
      "TP Thủ Đức": ["Cửa hàng A", "Cửa hàng B"],
      "Quận 1": ["Cửa hàng C12", "Cửa hàng D54"],
      "Quận 2": ["Cửa hàng E1", "Cửa hàng D9"],
      "Quận 3": ["Cửa hàng K5", "Cửa hàng M8"],
      "Quận 4": ["Cửa hàng H6Q", "Cửa hàng N8F"],
      "Quận 5": ["Cửa hàng P1", "Cửa hàng P2"],
      "Quận 6": ["Cửa hàng P3", "Cửa hàng P4"],
      "Quận 7": ["Cửa hàng P5", "Cửa hàng P6"],
      "Quận 8": ["Cửa hàng P7", "Cửa hàng P8"],
      "Quận 9": ["Cửa hàng P9", "Cửa hàng P10"],
      "Quận 10": ["Cửa hàng P11", "Cửa hàng P12"],
      "Quận 11": ["Cửa hàng P13", "Cửa hàng P14"],
      "Quận 12": ["Cửa hàng P15", "Cửa hàng P16"],
      "Huyện Nhà Bè": ["Cửa hàng P17", "Cửa hàng P18"],
      "Huyện Bình Chánh": ["Cửa hàng P19", "Cửa hàng P20"],
      "Huyện Cần Giờ": ["Cửa hàng P21", "Cửa hàng P22"],
      "Huyện Hóc Môn": ["Cửa hàng P23", "Cửa hàng P24"],
      "Huyện Bình Tân": ["Cửa hàng P25", "Cửa hàng P26"],
    },
  },
  "Hà Nội": {
    districts: {
      "Quận Hoàn Kiếm": ["Cửa hàng E2G", "Cửa hàng FM7"],
      "Quận Ba Đình": ["Cửa hàng HR5", "Cửa hàng NO9"],
      "Quận Đống Đa": ["Cửa hàng HR6", "Cửa hàng NO10"],
      "Quận Hai Bà Trưng": ["Cửa hàng HR7", "Cửa hàng NO11"],
      "Quận Hoàng Mai": ["Cửa hàng HR8", "Cửa hàng NO12"],
      "Quận Thanh Xuân": ["Cửa hàng HR9", "Cửa hàng NO13"],
      "Quận Tây Hồ": ["Cửa hàng HR10", "Cửa hàng NO14"],
      "Quận Cầu Giấy": ["Cửa hàng HR11", "Cửa hàng NO15"],
      "Quận Long Biên": ["Cửa hàng HR12", "Cửa hàng NO16"],
      "Quận Bắc Từ Liêm": ["Cửa hàng HR13", "Cửa hàng NO17"],
      "Quận Nam Từ Liêm": ["Cửa hàng HR14", "Cửa hàng NO18"],
    },
  },
  "Đà Nẵng": {
    districts: {
      "Quận Hải Châu": ["Cửa hàng DO9", "Cửa hàng QP"],
      "Quận Thanh Khê": ["Cửa hàng VS", "Cửa hàng BR"],
      "Quận Sơn Trà": ["Cửa hàng MMS", "Cửa hàng COF"],
      "Quận Ngũ Hành Sơn": ["Cửa hàng MHT", "Cửa hàng NGI"],
      "Quận Liên Chiểu": ["Cửa hàng DO10", "Cửa hàng QP2"],
      "Huyện Hoà Vang": ["Cửa hàng VS2", "Cửa hàng BR2"],
    },
  },
  "Hải Phòng": {
    districts: {
      "Quận Lê Chân": ["Cửa hàng HP1", "Cửa hàng HP2"],
      "Quận Hải An": ["Cửa hàng HP3", "Cửa hàng HP4"],
      "Quận Ngô Quyền": ["Cửa hàng HP5", "Cửa hàng HP6"],
      "Quận Đồ Sơn": ["Cửa hàng HP7", "Cửa hàng HP8"],
      "Quận Kiến An": ["Cửa hàng HP9", "Cửa hàng HP10"],
    },
  },
  "Cần Thơ": {
    districts: {
      "Quận Ninh Kiều": ["Cửa hàng CT1", "Cửa hàng CT2"],
      "Quận Cái Răng": ["Cửa hàng CT3", "Cửa hàng CT4"],
      "Quận Bình Thủy": ["Cửa hàng CT5", "Cửa hàng CT6"],
      "Quận Ô Môn": ["Cửa hàng CT7", "Cửa hàng CT8"],
      "Huyện Phong Điền": ["Cửa hàng CT9", "Cửa hàng CT10"],
      "Huyện Thốt Nốt": ["Cửa hàng CT11", "Cửa hàng CT12"],
    },
  },
  "Nha Trang": {
    districts: {
      "Quận Ninh Hải": ["Cửa hàng NH1", "Cửa hàng NH2"],
      "Quận Vĩnh Hải": ["Cửa hàng NH3", "Cửa hàng NH4"],
      "Quận Vĩnh Nguyên": ["Cửa hàng NH5", "Cửa hàng NH6"],
      "Quận Phước Long": ["Cửa hàng NH7", "Cửa hàng NH8"],
    },
  },
  "Vũng Tàu": {
    districts: {
      "TP Vũng Tàu": ["Cửa hàng VT1", "Cửa hàng VT2"],
      "Huyện Long Điền": ["Cửa hàng VT3", "Cửa hàng VT4"],
      "Huyện Đất Đỏ": ["Cửa hàng VT5", "Cửa hàng VT6"],
      "Huyện Xuyên Mộc": ["Cửa hàng VT7", "Cửa hàng VT8"],
    },
  },
};

export default function CheckoutScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("home");
  const [city, setCity] = useState("Hồ Chí Minh");
  const [district, setDistrict] = useState("");
  const [storeList, setStoreList] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const { userInfo } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (userInfo && userInfo.id) {
      setIsLoading(true);
      axios.get(`http://192.168.57.150:8080/api/cart/${userInfo.id}`)
        .then(response => {
          const productsWithDefaultPromotions = response.data.map((product: any) => ({
            ...product,
            promotions: product.promotions || []
          }));
          setProducts(productsWithDefaultPromotions);
          setIsLoading(false);
        })
        .catch(error => {
          console.log(error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [userInfo]);

  // Update districts and stores when city changes
  const updateDistrictsAndStores = (selectedCity: string) => {
    setCity(selectedCity);
    const districts = Object.keys(locationData[selectedCity]?.districts || {});
    if (districts.length > 0) {
      setDistrict(districts[0]); // Default to first district
      setStoreList(locationData[selectedCity].districts[districts[0]]);
    } else {
      setDistrict("");
      setStoreList([]);
    }
  };

  // Update stores when district changes
  const handleDistrictChange = (selectedDistrict: string) => {
    setDistrict(selectedDistrict);
    setStoreList(locationData[city].districts[selectedDistrict]);
  };

  // Toggle store selection
  const toggleStoreSelection = (store: string) => {
    setSelectedStores((prevSelectedStores) =>
      prevSelectedStores.includes(store)
        ? prevSelectedStores.filter((s) => s !== store)
        : [...prevSelectedStores, store]
    );
  };

  // Calculate total amount
  const calculateSubtotal = () => {
    return products.reduce((total, product) => {
      const price = product.salePrice
        ? parseFloat(String(product.salePrice).replace(/\./g, ""))
        : parseFloat(String(product.price).replace(/\./g, ""));
      return total + price * (product.quantity || 1);
    }, 0);
  };

  const getShippingFee = () => {
    if (deliveryMethod === "store") return 0;

    if (products.length > 10) return 0;
    if (products.length >= 4 && products.length <= 10) return 500;
    if (products.length >= 1 && products.length <= 3) return 750;

    return 0;
  };

  const totalAmount = calculateSubtotal() + getShippingFee();
  const subtotal = calculateSubtotal();
  const shippingFee = getShippingFee();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4775EA" />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  // Render product item
  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <View style={styles.productCard}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `http://192.168.57.150/images/${item.selectedImagePath}` }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>

          <View style={styles.productMeta}>
            <View style={styles.colorBadge}>
              <Text style={styles.colorText}>{item.selectedColor}</Text>
            </View>
            <Text style={styles.quantityText}>x{item.quantity}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {parseInt(item.salePrice || item.price).toLocaleString("vi-VN")}₫
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.headerTitle}>Mua thêm sản phẩm khác</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Product List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sản phẩm đã chọn ({products.length})
            </Text>
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyProduct}>
                <Ionicons name="cart-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>Không có sản phẩm nào trong giỏ hàng</Text>
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính:</Text>
                <Text style={styles.summaryValue}>{subtotal.toLocaleString("vi-VN")}₫</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
                {shippingFee > 0 ? (
                  <Text style={styles.summaryValue}>{shippingFee.toLocaleString("vi-VN")}₫</Text>
                ) : (
                  <Text style={styles.freeShipping}>MIỄN PHÍ</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.totalValue}>{totalAmount.toLocaleString("vi-VN")}₫</Text>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/profile`)}>
                <Ionicons name="pencil-outline" size={16} color="#4775EA" />
                <Text style={styles.editButtonText}>Thay đổi</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Họ tên:</Text>
                <Text style={styles.infoValue}>{userInfo?.name || "Chưa có thông tin"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>SĐT:</Text>
                <Text style={styles.infoValue}>{userInfo?.phone || "Chưa có thông tin"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userInfo?.email || "Chưa có thông tin"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{userInfo?.address || "Chưa có thông tin"}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức nhận hàng</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryMethod === "home" && styles.deliveryOptionSelected
                ]}
                onPress={() => setDeliveryMethod("home")}
              >
                <Ionicons
                  name="home-outline"
                  size={24}
                  color={deliveryMethod === "home" ? "#4775EA" : "#666"}
                />
                <Text
                  style={[
                    styles.deliveryOptionText,
                    deliveryMethod === "home" && styles.deliveryOptionTextSelected
                  ]}
                >
                  Giao tận nơi
                </Text>
                <View style={styles.radioOuter}>
                  {deliveryMethod === "home" && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryMethod === "store" && styles.deliveryOptionSelected
                ]}
                onPress={() => setDeliveryMethod("store")}
              >
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color={deliveryMethod === "store" ? "#4775EA" : "#666"}
                />
                <Text
                  style={[
                    styles.deliveryOptionText,
                    deliveryMethod === "store" && styles.deliveryOptionTextSelected
                  ]}
                >
                  Nhận tại cửa hàng
                </Text>
                <View style={styles.radioOuter}>
                  {deliveryMethod === "store" && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Address - shown when home delivery is selected */}
          {deliveryMethod === "home" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
              <View style={styles.addressCard}>
                <View style={styles.addressContainer}>
                  <Ionicons name="location" size={20} color="#4775EA" style={styles.addressIcon} />
                  <Text style={styles.addressText}>{userInfo?.address || "Chưa có thông tin"}</Text>
                </View>

                <View style={styles.noteContainer}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Ghi chú thêm về địa chỉ, thời gian nhận hàng..."
                    value={additionalRequest}
                    onChangeText={setAdditionalRequest}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Store Selection - shown when store pickup is selected */}
          {deliveryMethod === "store" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn cửa hàng</Text>
              <View style={styles.storeSelectionCard}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Thành phố:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={city}
                      onValueChange={(itemValue) => updateDistrictsAndStores(itemValue)}
                      style={styles.picker}
                    >
                      {Object.keys(locationData).map((city) => (
                        <Picker.Item key={city} label={city} value={city} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Quận/Huyện:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={district}
                      onValueChange={handleDistrictChange}
                      style={styles.picker}
                      enabled={Object.keys(locationData[city]?.districts || {}).length > 0}
                    >
                      {Object.keys(locationData[city]?.districts || {}).map((district) => (
                        <Picker.Item key={district} label={district} value={district} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.storeListContainer}>
                  <Text style={styles.storeListTitle}>Danh sách cửa hàng:</Text>
                  {storeList.length > 0 ? (
                    storeList.map((store) => (
                      <TouchableOpacity
                        key={store}
                        style={styles.storeItem}
                        onPress={() => toggleStoreSelection(store)}
                      >
                        <View style={styles.checkboxContainer}>
                          <Ionicons
                            name={selectedStores.includes(store) ? "checkbox" : "square-outline"}
                            size={22}
                            color={selectedStores.includes(store) ? "#4775EA" : "#999"}
                          />
                        </View>
                        <View style={styles.storeItemContent}>
                          <Text style={styles.storeName}>{store}</Text>
                          <Text style={styles.storeAddress}>
                            {district}, {city}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyStoreText}>Không có cửa hàng tại khu vực này</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Space at the bottom for the fixed button */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Button - Fixed at bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() =>
            router.push({
              pathname: "./payment",
              params: { totalAmount: totalAmount.toString() },
            })
          }
        >
          <Ionicons name="wallet-outline" size={22} color="#fff" style={styles.paymentIcon} />
          <Text style={styles.paymentButtonText}>Thanh toán</Text>
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  productDetails: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorBadge: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 10,
  },
  colorText: {
    fontSize: 12,
    color: '#666',
  },
  quantityText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E53935',
  },
  emptyProduct: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },

  // Summary Card
  summaryCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  freeShipping: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
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

  // Customer Info
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#4775EA',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    width: 24,
    marginRight: 4,
  },
  infoLabel: {
    width: 50,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Delivery Options
  deliveryOptions: {
    marginTop: 5,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  deliveryOptionSelected: {
    borderColor: '#4775EA',
    backgroundColor: 'rgba(71, 117, 234, 0.05)',
  },
  deliveryOptionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  deliveryOptionTextSelected: {
    color: '#4775EA',
    fontWeight: 'bold',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4775EA',
  },

  // Address
  addressCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noteContainer: {
    marginTop: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Store Selection
  storeSelectionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 45,
    width: '100%',
  },
  storeListContainer: {
    marginTop: 8,
  },
  storeListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  storeItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 10,
  },
  storeItemContent: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  storeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyStoreText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  paymentButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentIcon: {
    marginRight: 8,
  },

  // Loading
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
