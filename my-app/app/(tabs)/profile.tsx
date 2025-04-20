import React, { useState } from "react";
import {
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
  Image,
  SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemedView } from "@/components/ThemedView";
import { useUser } from "../(auth)/UserContext";
import { Colors } from "@/constants/Colors";
import { useColorScheme, ColorSchemeName } from "react-native";
import Toast from "react-native-toast-message";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

// Định nghĩa kiểu cho tempUserInfo (userInfo có kiểu là User)
type UserInfo = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  address?: string;
  role?: string;
};

export default function TabThreeScreen() {
  const router = useRouter();
  const { userInfo, setUserInfo } = useUser();
  const colorScheme: ColorSchemeName = useColorScheme() || "light";
  const [expanded, setExpanded] = useState(false);

  // const [modalVisible, setModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  const [actionType, setActionType] = useState<'logout' | 'delete' | null>(null);
  const [tempUserInfo, setTempUserInfo] = useState<UserInfo | null>(userInfo); // Dữ liệu tạm cho modal

  const handleLogin = () => {
    router.push("/login");
  };
  const handlePress = () => {
    setExpanded(!expanded);
  };

  const handleLogout = () => {
    setUserInfo(null);
    Toast.show({
      type: "success",
      text1: "Thành công",
      text2: `Bạn đã đăng xuất khỏi tài khoản.`,
      position: "top",
      visibilityTime: 1000,
    });
    router.push("/");
  };

  const handleUpdateInfo = async () => {
    if (tempUserInfo && tempUserInfo.id) {
      try {
        const response = await fetch(
          `http://192.168.57.150:8080/api/users/${tempUserInfo.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(tempUserInfo),
          }
        );

        if (response.ok) {
          const updatedUser = await response.json();
          setUserInfo(updatedUser);
          setTempUserInfo(updatedUser);
          setIsUpdateModalVisible(false);

          const fetchUpdatedUserInfo = async () => {
            const fetchResponse = await fetch(
              `http://192.168.57.150:8080/api/users/${updatedUser.id}`
            );
            if (fetchResponse.ok) {
              const data = await fetchResponse.json();
              setUserInfo(data);
            } else {
              throw new Error("Không thể lấy thông tin người dùng");
            }
          };
          await fetchUpdatedUserInfo();

          Toast.show({
            type: "success",
            text1: "Thành công",
            text2: `Thông tin đã được cập nhật.`,
            position: "top",
            visibilityTime: 1000,
          });
        } else {
          throw new Error("Không thể cập nhật thông tin");
        }
      } catch (err) {
        const error = err as Error;
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: error.message,
          position: "top",
          visibilityTime: 1000,
        });
      }
    }
  };
  const handleDeleteUser = async () => {
    if (userInfo && userInfo.id) {
      try {
        const response = await fetch(
          `http://192.168.57.150:8080/api/users/${userInfo.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setUserInfo(null); // Xóa thông tin người dùng khỏi ứng dụng
          Toast.show({
            type: "success",
            text1: "Thành công",
            text2: "Tài khoản của bạn đã được xóa.",
            position: "top",
            visibilityTime: 1000,
          });
          router.push("/"); // Chuyển hướng về trang chính
        } else {
          throw new Error("Không thể xóa tài khoản");
        }
      } catch (err) {
        const error = err as Error;
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: error.message,
          position: "top",
          visibilityTime: 1000,
        });
      }
    }
  };
  const handleConfirmAction = () => {
    if (actionType === 'logout') {
      handleLogout();
    } else if (actionType === 'delete') {
      handleDeleteUser();
    }
    setIsActionModalVisible(false);
    setActionType(null); // Reset action type after confirmation
  };

  const handleCancelAction = () => {
    setIsActionModalVisible(false);
    setActionType(null); // Reset action type if user cancels
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[
        styles.gradientBackground,
        { backgroundColor: colorScheme === 'dark' ? '#1A1A2E' : '#E8F0FE' }
      ]}>
        <View style={styles.container}>
          {userInfo ? (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profileHeader}>
                <View style={[
                  styles.headerGradient,
                  { backgroundColor: colorScheme === 'dark' ? '#0066CC' : '#3B82F6' }
                ]}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatarBackground}>
                      <Ionicons
                        name="person"
                        size={60}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                  <Text style={styles.profileName}>
                    {userInfo?.name || "Người dùng"}
                  </Text>
                  <Text style={styles.profileRole}>
                    {userInfo?.role === "admin" ? "Quản trị viên" : "Thành viên"}
                  </Text>
                </View>
              </View>

              <View style={styles.welcomeCard}>
                <View style={styles.welcomeIconContainer}>
                  <Ionicons name="hand-right" size={24} color="#FFC107" />
                </View>
                <Text style={[styles.welcomeText, { color: Colors[colorScheme].text }]}>
                  {userInfo?.gender === "Nữ"
                    ? `Chào mừng chị ${userInfo?.name} đã trở lại, hãy đồng hành cùng với chúng tôi nhé!`
                    : `Chào mừng anh ${userInfo?.name} đã trở lại, hãy đồng hành cùng với chúng tôi nhé!`}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                      Họ và tên
                    </Text>
                    <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                      {userInfo?.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name={userInfo?.gender === "Nữ" ? "female" : "male"} size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                      Giới tính
                    </Text>
                    <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                      {userInfo?.gender}
                    </Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                      Email
                    </Text>
                    <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                      {userInfo?.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                      Số điện thoại
                    </Text>
                    <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                      {userInfo?.phone}
                    </Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="location" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                      Địa chỉ
                    </Text>
                    <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                      {userInfo?.address}
                    </Text>
                  </View>
                </View>
                {userInfo?.role === "admin" && (
                  <View style={styles.adminSection}>
                    <View style={styles.separator} />

                    <View style={styles.infoItem}>
                      <View style={styles.infoIcon}>
                        <Ionicons name="shield-checkmark" size={20} color="#FF9800" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>
                          Vai trò
                        </Text>
                        <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
                          Quản trị viên
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.adminButton}
                      onPress={() => router.push("/(dashboard)/Home")}
                    >
                      <View style={[styles.adminButtonGradient, { backgroundColor: '#FF9800' }]}>
                        <Ionicons name="settings" size={18} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Trang quản lý</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={() => setIsUpdateModalVisible(true)}
                >
                  <View style={[styles.buttonGradient, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="create" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Cập nhật</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    setActionType('delete');
                    setIsActionModalVisible(true);
                  }}
                >
                  <View style={[styles.buttonGradient, { backgroundColor: '#F44336' }]}>
                    <Ionicons name="trash" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Xoá </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.logoutButton]}
                  onPress={() => {
                    setActionType('logout');
                    setIsActionModalVisible(true);
                  }}
                >
                  <View style={[styles.buttonGradient, { backgroundColor: '#757575' }]}>
                    <Ionicons name="log-out" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Đăng xuất</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.guestContainer}>
              <View style={styles.guestAvatarContainer}>
                <View style={[
                  styles.guestAvatarGradient,
                  { backgroundColor: colorScheme === 'dark' ? '#0066CC' : '#3B82F6' }
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={80}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={[styles.guestTitle, { color: Colors[colorScheme].text }]}>
                  Chào bạn!
                </Text>
              </View>

              <View style={styles.guestCard}>
                <View style={styles.guestCardIcon}>
                  <Ionicons name="notifications" size={28} color="#FF9800" />
                </View>
                <Text style={[styles.guestCardText, { color: Colors[colorScheme].text }]}>
                  Hãy đăng nhập để nhận thông báo mới nhất kèm với những ưu đãi
                  hấp dẫn nhất từ chúng tôi!
                </Text>
              </View>

              <TouchableOpacity
                style={styles.loginBtnContainer}
                onPress={handleLogin}
              >
                <View style={[
                  styles.loginButtonGradient,
                  { backgroundColor: '#3B82F6' }
                ]}>
                  <Ionicons name="log-in" size={22} color="#FFFFFF" style={styles.loginBtnIcon} />
                  <Text style={styles.loginText}>Đăng nhập ngay</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal visible={isUpdateModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <View style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
                  Cập nhật thông tin
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsUpdateModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.inputGroup}>
                  <Ionicons name="person" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: Colors[colorScheme].text, borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB' }
                    ]}
                    placeholder="Họ và tên"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={tempUserInfo?.name?.toString() || ""}
                    onChangeText={(text) => setTempUserInfo(prev => prev ? { ...prev, name: text } : prev)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Ionicons name={tempUserInfo?.gender === "Nữ" ? "female" : "male"} size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: Colors[colorScheme].text, borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB' }
                    ]}
                    placeholder="Giới tính"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={tempUserInfo?.gender?.toString() || ""}
                    onChangeText={(text) => setTempUserInfo(prev => prev ? { ...prev, gender: text } : prev)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Ionicons name="mail" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: Colors[colorScheme].text, borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB' }
                    ]}
                    placeholder="Email"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={tempUserInfo?.email?.toString() || ""}
                    onChangeText={(text) => setTempUserInfo(prev => prev ? { ...prev, email: text } : prev)}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Ionicons name="call" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: Colors[colorScheme].text, borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB' }
                    ]}
                    placeholder="Số điện thoại"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={tempUserInfo?.phone?.toString() || ""}
                    onChangeText={(text) => setTempUserInfo(prev => prev ? { ...prev, phone: text } : prev)}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Ionicons name="location" size={20} color={colorScheme === 'dark' ? '#60A5FA' : '#3B82F6'} style={styles.inputIcon} />
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: Colors[colorScheme].text, borderColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB' }
                    ]}
                    placeholder="Địa chỉ"
                    placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    value={tempUserInfo?.address?.toString() || ""}
                    onChangeText={(text) => setTempUserInfo(prev => prev ? { ...prev, address: text } : prev)}
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsUpdateModalVisible(false)}
                >
                  <View style={[
                    styles.modalButtonGradient,
                    { backgroundColor: '#9CA3AF' }
                  ]}>
                    <Text style={styles.buttonText}>Hủy</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdateInfo}
                >
                  <View style={[
                    styles.modalButtonGradient,
                    { backgroundColor: '#4CAF50' }
                  ]}>
                    <Text style={styles.buttonText}>Lưu</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={isActionModalVisible} animationType="fade" transparent>
        <View style={styles.actionOverlay}>
          <View style={[styles.actionModalContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.actionIconContainer}>
              <Ionicons
                name={actionType === 'logout' ? "log-out" : "trash"}
                size={40}
                color={actionType === 'logout' ? "#FFA000" : "#F44336"}
              />
            </View>

            <Text style={[styles.actionModalTitle, { color: Colors[colorScheme].text }]}>
              {actionType === 'logout' ? 'Đăng xuất' : 'Xóa tài khoản'}
            </Text>

            <Text style={[styles.actionModalMessage, { color: Colors[colorScheme].text }]}>
              Bạn có chắc chắn muốn {actionType === 'logout' ? 'đăng xuất khỏi tài khoản' : 'xóa tài khoản này'}?
              {actionType === 'delete' && ' Hành động này không thể hoàn tác.'}
            </Text>

            <View style={styles.actionModalButtons}>
              <TouchableOpacity
                style={[styles.actionModalButton, styles.cancelActionButton]}
                onPress={handleCancelAction}
              >
                <View style={[
                  styles.actionButtonGradient,
                  { backgroundColor: '#9CA3AF' }
                ]}>
                  <Text style={styles.actionButtonText}>Hủy</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionModalButton, styles.confirmActionButton]}
                onPress={handleConfirmAction}
              >
                <View style={[
                  styles.actionButtonGradient,
                  { backgroundColor: actionType === 'logout' ? '#FFA000' : '#F44336' }
                ]}>
                  <Text style={styles.actionButtonText}>Xác nhận</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.floatingChatContainer}>
        {expanded && (
          <View style={styles.chatOptionsContainer}>
            <MotiView
              from={{ opacity: 0, scale: 0.8, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250, delay: 0 }}
            >
              <TouchableOpacity
                style={[styles.chatButton, styles.zaloButton]}
                onPress={() => Linking.openURL('https://zalo.me/0346730482')}
              >
                <Image source={require('@/assets/images/zalo.jpeg')} resizeMode='contain' style={styles.chatIcon} />
              </TouchableOpacity>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250, delay: 100 }}
            >
              <TouchableOpacity
                style={[styles.chatButton, styles.messengerButton]}
                onPress={() => { Linking.openURL("https://www.facebook.com/profile.php?id=100047325128980") }}
              >
                <Image source={require('@/assets/images/message.jpg')} resizeMode='contain' style={styles.chatIcon} />
              </TouchableOpacity>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250, delay: 200 }}
            >
              <TouchableOpacity
                style={[styles.chatButton, styles.phoneButton]}
                onPress={() => { Linking.openURL('tel:0346730482'); }}
              >
                <Icon name="phone" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </MotiView>
          </View>
        )}
        <TouchableOpacity
          style={styles.mainChatButton}
          onPress={handlePress}>
          <View style={[
            styles.mainChatButtonGradient,
            { backgroundColor: expanded ? '#F44336' : '#3B82F6' }
          ]}>
            {expanded ? (
              <Icon name="close" size={24} color="#FFF" />
            ) : (
              <View style={styles.chatIconContainer}>
                {[...Array(3).keys()].map(index => (
                  <MotiView
                    from={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: 0, scale: 4 }}
                    transition={{
                      type: 'timing',
                      duration: 2000,
                      easing: Easing.out(Easing.ease),
                      delay: index * 400,
                      loop: true,
                      repeatReverse: false,
                    }}
                    key={index}
                    style={[StyleSheet.absoluteFillObject, styles.pulseEffect]}
                  />
                ))}
                <Icon name="chat" size={24} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  // Background styles
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGradient: {
    width: '100%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Welcome Card
  welcomeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  welcomeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  welcomeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  // Admin Section
  adminSection: {
    marginTop: 15,
  },
  adminButton: {
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  adminButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  updateButton: {},
  deleteButton: {},
  logoutButton: {},
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Guest View
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestAvatarContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  guestAvatarGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  guestCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  guestCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  guestCardText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginBtnContainer: {
    width: '100%',
    marginTop: 10,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8,
  },
  loginBtnIcon: {
    marginRight: 10,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    marginRight: 10,
  },
  saveButton: {
    marginLeft: 10,
  },
  modalButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  // Action Modal
  actionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionModalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  actionModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionModalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelActionButton: {
    marginRight: 8,
  },
  confirmActionButton: {
    marginLeft: 8,
  },
  actionButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Floating Chat
  floatingChatContainer: {
    position: 'absolute',
    right: 20,
    bottom: 93,
    alignItems: 'flex-end',
  },
  chatOptionsContainer: {
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  chatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  zaloButton: {
    backgroundColor: '#fff',
  },
  messengerButton: {
    backgroundColor: '#fff',
  },
  phoneButton: {
    backgroundColor: '#fff',
  },
  mainChatButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  mainChatButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseEffect: {
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Legacy styles - keeping for backwards compatibility
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  welcomeContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  infoContainer: {
    padding: 20,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  info: {
    fontSize: 16,
    textAlign: "right",
  },
  loginPromptContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  loginPromptText: {
    fontSize: 18,
    textAlign: "center",
  },
  loginButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  containerchat: {
    position: 'absolute',
    right: 15,
    top: 270,
    alignItems: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    marginVertical: 5,
    borderRadius: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  expandButton: {
    backgroundColor: '#d70018',
  },
  icon: {
    width: 28,
    height: 28,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 60,
    right: 0,
    alignItems: 'center',
  },
  circleEffect: {
    borderRadius: 40,
    backgroundColor: '#d70018'
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
