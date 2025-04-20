import { ThemedView } from '@/components/ThemedView';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Platform, TouchableOpacity, StyleSheet, ColorSchemeName, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from "@/constants/Colors"; // Import màu sắc theo theme
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';


interface ItemCategory {
  id: number;
  name: string;
}
interface ItemBrand {
  id: number;
  name: string;
  categoryId: number;
  image: string;
}
export default function TabTwoScreen() {
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedBrand, setSelectedBrand] = useState<number>(1);
  const [dataCategory, setDataCategory] = useState<ItemCategory[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<ItemBrand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const colorScheme: ColorSchemeName = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true); // Bắt đầu trạng thái tải
      try {
        const response = await axios.get<ItemCategory[]>("http://192.168.57.150:8080/api/categories");
        if (response.data && response.data.length > 0) {
          setDataCategory(response.data);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Có lỗi xảy ra',
            text2: 'Không có dữ liệu Category.',
            position: "top",
            visibilityTime: 1000,
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Có lỗi xảy ra',
          text2: 'Có lỗi xảy ra khi lấy dữ liệu Category.',
          position: "top",
          visibilityTime: 1000,
        });
      } finally {
        setIsLoading(false); // Kết thúc trạng thái tải
      }
    };

    fetchCategories();
  }, []);

  // Gọi API để lấy thương hiệu theo danh mục được chọn
  useEffect(() => {
    const fetchBrands = async () => {
      if (dataCategory.length > 0) { // Kiểm tra danh mục đã có dữ liệu
        try {
          const response = await axios.get<ItemBrand[]>(`http://192.168.57.150:8080/api/brands/category/${selectedCategory}`);
          if (response.data && response.data.length > 0) {
            setFilteredBrands(response.data);
          } else {
            setFilteredBrands([]);
          }
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Có lỗi xảy ra',
            text2: 'Có lỗi xảy ra khi lấy dữ liệu Brand.',
            position: "top",
            visibilityTime: 1000,
          });
        }
      }
    };

    fetchBrands();
  }, [selectedCategory, dataCategory]);

  const renderCategoryItem = ({ item }: { item: ItemCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategory,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      {selectedCategory === item.id ? (
        <LinearGradient
          colors={['#4c669f', '#87b8ec', '#6c8fee']}
          style={styles.selectedGradient}
        >
          <Text style={styles.selectedCategoryText}>{item.name}</Text>
        </LinearGradient>
      ) : (
        <Text style={[
          styles.categoryText,
          isDark && { color: '#e0e0e0' }
        ]}>{item.name}</Text>
      )}
    </TouchableOpacity>
  );

  const renderBrandItem = ({ item }: { item: ItemBrand }) => (
    <TouchableOpacity
      style={[
        styles.brandItem,
        selectedBrand === item.id && styles.selectedBrand,
      ]}
      onPress={() => {
        setSelectedBrand(item.id);
        router.push(`/?id=${item.id}`);
      }}
    >
      <View style={styles.brandHeader}>
        <Text style={[
          styles.brandText,
          selectedBrand === item.id && styles.selectedBrandText,
          isDark && { color: '#e0e0e0' }
        ]}>
          {item.name}
        </Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.image
              ? `http://192.168.57.150/images/${item.image}`
              : 'https://via.placeholder.com/50',
          }}
          style={styles.brandImage}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );

  // Kiểm tra trạng thái đang tải
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c669f" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh mục sản phẩm</Text>
      </View>
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        {/* Phần danh mục bên trái */}
        <View style={[styles.categoryContainer, { backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: '#e0e0e0' }]}>Danh mục</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <FlatList
              data={dataCategory}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </ScrollView>
        </View>

        {/* Phần danh sách brand bên phải */}
        <View style={[styles.brandContainer, { backgroundColor: isDark ? '#1a1a2e' : '#f8f9fa' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: '#e0e0e0' }]}>Thương hiệu</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <FlatList
              data={filteredBrands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#268ee8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  categoryContainer: {
    flex: 1,
    borderRadius: 10,
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  brandContainer: {
    flex: 2,
    borderRadius: 10,
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e8',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  categoryItem: {
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
  },
  selectedGradient: {
    padding: 12,
    borderRadius: 8,
  },
  selectedCategory: {
    backgroundColor: 'transparent',
    elevation: 5,
    shadowColor: "#192f6a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  brandItem: {
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 8,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  brandHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e8',
  },
  selectedBrand: {
    borderColor: '#447bf3',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  selectedBrandText: {
    color: '#255ed8',
  },
  imageContainer: {
    padding: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandImage: {
    width: '100%',
    height: 100,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  itemSeparator: {
    height: 6
  },
});
