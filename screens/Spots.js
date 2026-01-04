import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Linking,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAppStore from '../store/useAppStore';
import { useMarketplace } from '../hooks/useMarketplace';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 42) / 2; // 2 columnas con padding perfecto

export default function MarketRollers({ navigation }) {
  const { theme, user } = useAppStore();
  const {
    products,
    loading,
    refreshing,
    loadProducts,
    refreshProducts,
    addProduct,
    removeProduct,
  } = useMarketplace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [creatingProduct, setCreatingProduct] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  
  // Form state para crear producto
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: 'Tablas',
    imagenes: [],
  });

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = (product.nombre || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todos' || product.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const categories = ['Todos', 'Tablas', 'Ruedas', 'Proteccion', 'Accesorios', 'Partes'];
  const formatPrice = (value) => Number(value || 0).toLocaleString('es-CO');
  const getProductImages = (product) => {
    const images = product?.imagenes || [];
    return images.length > 0 ? images : ['https://via.placeholder.com/400x300'];
  };
  const getVendedorNombre = (product) => product?.vendedor?.nombre || 'Vendedor';
  const getVendedorCiudad = (product) => product?.vendedor?.ciudad || '---';

  // Crear nuevo producto
  const handleCreateProduct = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesion para crear productos');
      return;
    }

    if (!formData.nombre.trim() || !formData.precio.trim() || formData.imagenes.length === 0) {
      Alert.alert('Error', 'Por favor completa todos los campos y agrega al menos una imagen');
      return;
    }

    setCreatingProduct(true);
    try {
      const result = await addProduct(formData, user.id);
      if (result?.success) {
        setFormData({
          nombre: '',
          precio: '',
          categoria: 'Tablas',
          imagenes: [],
        });
        setShowCreateModal(false);
        Alert.alert('Exito', 'Producto creado correctamente');
      } else {
        Alert.alert('Error', result?.error || 'No se pudo crear el producto');
      }
    } finally {
      setCreatingProduct(false);
    }
  };

    // Eliminar producto
  const handleDeleteProduct = (id) => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesion para eliminar productos');
      return;
    }

    Alert.alert(
      'Eliminar Producto',
      'Estas seguro de que deseas eliminar este producto?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            const result = await removeProduct(id, user.id);
            if (result?.success) {
              setShowDetailModal(false);
              Alert.alert('Exito', 'Producto eliminado correctamente');
            } else {
              Alert.alert('Error', result?.error || 'No se pudo eliminar el producto');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Seleccionar imagen desde galeriaía
  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setFormData({
        ...formData,
        imagenes: [...formData.imagenes, imageUri],
      });
    }
  };

  // Eliminar imagen de la selección
  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imagenes: formData.imagenes.filter((_, i) => i !== index),
    });
  };

  // Favoritar/Desfavoritar producto
  const handleToggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Compartir producto
  const handleShareProduct = (product) => {
    const mensaje = `Te comparto este producto:\n\n${product.nombre}\n\nPrecio: $${formatPrice(product.precio)}\nCategoria: ${product.categoria}\n\nTe interesa?`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(mensaje)}`);
  };

  const handleContact = (product) => {
    const mensaje = `Hola, me interesa el producto: ${product.nombre} por $${formatPrice(product.precio)}. Esta disponible?`;
    const whatsappUrl = `https://wa.me/573001234567?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(whatsappUrl);
  };

  // Tarjeta de producto
  const renderProduct = ({ item }) => {
    const firstImage = item.imagenes?.[0] || 'https://via.placeholder.com/400x300';
    const vendedorNombre = item.vendedor?.nombre || 'Vendedor';
    const vendedorCiudad = item.vendedor?.ciudad || '---';

    return (
      <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        setSelectedProduct(item);
        setShowDetailModal(true);
      }}
      style={[
        styles.productCard,
        {
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border,
          width: CARD_WIDTH,
        },
      ]}
    >
      {/* Imagen del Producto */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: firstImage }}
          style={styles.productImage}
        />

        {/* Badge Categoría */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.categoryBadgeText}>{item.categoria}</Text>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.productContent}>
        {/* Nombre */}
        <Text
          style={[styles.productName, { color: theme.colors.text.primary }]}
          numberOfLines={2}
        >
          {item.nombre}
        </Text>

        {/* Precio */}
        <View style={styles.priceSection}>
          <Text
            style={[styles.priceLabel, { color: theme.colors.text.secondary }]}
          >
            Precio
          </Text>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            ${formatPrice(item.precio)}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Vendedor */}
        <View style={styles.vendorSection}>
          <View style={styles.vendorHeader}>
            <View
              style={[
                styles.vendorAvatar,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons name="person" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.vendorInfo}>
              <Text
                style={[styles.vendorName, { color: theme.colors.text.primary }]}
              >
                {vendedorNombre}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.vendorCity,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  {vendedorCiudad}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botón Contactar */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.contactButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleContact(item)}
        >
          <MaterialCommunityIcons name="whatsapp" size={16} color="#FFF" />
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              🛍️ MarketRollers
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.glass.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.text.secondary}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Buscar producto..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              selectedCategory === cat
                ? { backgroundColor: theme.colors.primary, borderWidth: 0 }
                : {
                    backgroundColor: theme.colors.glass.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                {
                  color:
                    selectedCategory === cat
                      ? theme.colors.onPrimary
                      : theme.colors.text.primary,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Productos */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refreshProducts}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="shopping-outline"
                  size={56}
                  color={theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  No hay productos disponibles
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>

    {/* MODAL DE DETALLE DEL PRODUCTO */}
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <SafeAreaView
        style={[
          styles.detailContainer,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        {/* Header Modal */}
        <View
          style={[
            styles.detailHeader,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowDetailModal(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: theme.colors.text.primary }]}>
            Detalles
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedProduct && (
            <>
              {/* Carrusel de Imagenes */}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageCarousel}
              >
                {getProductImages(selectedProduct).map((image, index) => (
                  <View key={index} style={styles.carouselImageWrapper}>
                    <Image
                      source={{ uri: image }}
                      style={styles.detailImage}
                    />
                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {index + 1}/{getProductImages(selectedProduct).length}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Info Producto */}
              <View style={styles.detailInfo}>
                {/* Categoría Badge */}
                <View style={[styles.categoryBadgeLarge]}>
                  <Text
                    style={[
                      styles.categoryBadgeTextLarge,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    {selectedProduct.categoria}
                  </Text>
                </View>

                {/* Nombre */}
                <Text
                  style={[
                    styles.detailProductName,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {selectedProduct.nombre}
                </Text>

                {/* Precio Grande */}
                <Text
                  style={[styles.detailPrice, { color: theme.colors.primary }]}
                >
                  ${formatPrice(selectedProduct.precio)}
                </Text>

                {/* Divider */}
                <View
                  style={[
                    styles.detailDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />

                {/* Info Vendedor */}
                <View style={styles.vendorDetailSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Vendedor
                  </Text>
                  <View style={styles.vendorDetailCard}>
                    <View
                      style={[
                        styles.vendorAvatarLarge,
                        { backgroundColor: theme.colors.primary + '15' },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.vendorDetailInfo}>
                      <Text
                      style={[
                        styles.vendorDetailName,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      {getVendedorNombre(selectedProduct)}
                    </Text>
                    <View style={styles.locationDetailRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={theme.colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.vendorDetailCity,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {getVendedorCiudad(selectedProduct)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

                {/* Spacer */}
                <View style={{ height: 20 }} />
              </View>
            </>
          )}
        </ScrollView>

        {/* Botones Acciones */}
        <View style={[styles.detailFooter, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.detailActionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              if (selectedProduct) {
                handleContact(selectedProduct);
              }
            }}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
            <Text style={styles.detailActionButtonText}>Contactar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detailActionButton,
              { backgroundColor: favorites.includes(selectedProduct?.id) ? '#FF6B9D' : '#95989A' },
            ]}
            onPress={() => {
              if (selectedProduct) {
                handleToggleFavorite(selectedProduct.id);
              }
            }}
          >
            <Ionicons 
              name={favorites.includes(selectedProduct?.id) ? 'heart' : 'heart-outline'} 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.detailActionButtonText}>
              {favorites.includes(selectedProduct?.id) ? 'Guardado' : 'Guardar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.detailActionButton,
              { backgroundColor: '#2196F3' },
            ]}
            onPress={() => {
              if (selectedProduct) {
                handleShareProduct(selectedProduct);
              }
            }}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
            <Text style={styles.detailActionButtonText}>Compartir</Text>
          </TouchableOpacity>

          {/* Botón Eliminar - Solo si eres el vendedor */}
          {selectedProduct && selectedProduct.vendedor_id === user?.id && (
            <TouchableOpacity
              style={[
                styles.detailActionButton,
                { backgroundColor: '#FF4757' },
              ]}
              onPress={() => {
                if (selectedProduct) {
                  handleDeleteProduct(selectedProduct.id);
                }
              }}
            >
              <Ionicons name="trash" size={20} color="#FFF" />
              <Text style={styles.detailActionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>

    {/* MODAL CREAR PRODUCTO */}
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView
        style={[
          styles.createContainer,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.createContent}
        >
          {/* Header */}
          <View
            style={[
              styles.createHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.createCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.createTitle, { color: theme.colors.text.primary }]}>
              Crear Producto
            </Text>
            <View style={styles.createCloseButton} />
          </View>

          <ScrollView style={styles.createFormScroll} showsVerticalScrollIndicator={false}>
            {/* Form */}
            <View style={styles.createForm}>
              {/* Nombre */}
              <View style={styles.createFieldGroup}>
                <Text style={[styles.createLabel, { color: theme.colors.text.primary }]}>
                  Nombre del Producto
                </Text>
                <TextInput
                  style={[
                    styles.createInput,
                    {
                      backgroundColor: theme.colors.glass.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="Ej: Tabla Skateboard"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={formData.nombre}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre: text })
                  }
                />
              </View>

              {/* Precio */}
              <View style={styles.createFieldGroup}>
                <Text style={[styles.createLabel, { color: theme.colors.text.primary }]}>
                  Precio (COP)
                </Text>
                <TextInput
                  style={[
                    styles.createInput,
                    {
                      backgroundColor: theme.colors.glass.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder="Ej: 280000"
                  placeholderTextColor={theme.colors.text.secondary}
                  keyboardType="numeric"
                  value={formData.precio}
                  onChangeText={(text) =>
                    setFormData({ ...formData, precio: text })
                  }
                />
              </View>

              {/* Categoría */}
              <View style={styles.createFieldGroup}>
                <Text style={[styles.createLabel, { color: theme.colors.text.primary }]}>
                  Categoría
                </Text>
                <View style={styles.categorySelectWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categorySelectScroll}
                  >
                    {categories.slice(1).map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categorySelectButton,
                          formData.categoria === cat
                            ? { backgroundColor: theme.colors.primary }
                            : {
                                backgroundColor: theme.colors.glass.background,
                                borderColor: theme.colors.border,
                                borderWidth: 1,
                              },
                        ]}
                        onPress={() => setFormData({ ...formData, categoria: cat })}
                      >
                        <Text
                          style={[
                            styles.categorySelectText,
                            {
                              color:
                                formData.categoria === cat
                                  ? '#FFF'
                                  : theme.colors.text.primary,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Imagenes */}
              <View style={styles.createFieldGroup}>
                <View style={styles.imagesHeaderRow}>
                  <Text style={[styles.createLabel, { color: theme.colors.text.primary }]}>
                    Imágenes ({formData.imagenes.length})
                  </Text>
                  <TouchableOpacity
                    style={[styles.addImageButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSelectImage}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* Preview de Imagenes */}
                {formData.imagenes.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesPreviewScroll}
                  >
                    {formData.imagenes.map((image, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image
                          source={{ uri: image }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#FF4757" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Botones Acciones */}
          <View style={[styles.createFooter, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[
                styles.createActionButton,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setShowCreateModal(false)}
              disabled={creatingProduct}
            >
              <Text style={[styles.createActionButtonText, { color: theme.colors.text.primary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createActionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleCreateProduct}
              disabled={creatingProduct}
            >
              {creatingProduct ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={[styles.createActionButtonText, { color: '#FFF' }]}>
                    Crear
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ========== CONTAINER ==========
  container: {
    flex: 1,
  },

  // ========== HEADER ==========
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 5,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    opacity: 0.8,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // ========== SEARCH SECTION ==========
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1.2,
    height: 52,
    gap: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: '600',
  },

  // ========== CATEGORIES SECTION ==========
  categoriesScroll: {
    paddingVertical: 14,
    paddingBottom: 35,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 26,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontWeight: '800',
    fontSize: 13.5,
    letterSpacing: 0.4,
  },

  // ========== LIST CONTENT ==========
  listContent: {
    paddingHorizontal: 11,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  columnWrapper: {
    gap: 14,
    paddingHorizontal: 7,
    marginBottom: 5,
  },

  // ========== PRODUCT CARD ==========
  productCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Product Content
  productContent: {
    padding: 15,
    gap: 11,
  },
  productName: {
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 21,
  },

  // Price Section
  priceSection: {
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    opacity: 0.85,
  },
  price: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  // Divider
  divider: {
    height: 1.2,
    marginVertical: 9,
    opacity: 0.35,
  },

  // Vendor Section
  vendorSection: {
    paddingVertical: 6,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  vendorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  vendorName: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vendorCity: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Contact Button
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 14,
    marginTop: 11,
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ========== EMPTY STATE ==========
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    gap: 18,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ========== DETAIL MODAL ==========
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  imageCarousel: {
    width: '100%',
  },
  carouselImageWrapper: {
    width: width,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#f5f5f5',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryBadgeLarge: {
    marginBottom: 14,
  },
  categoryBadgeTextLarge: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  detailProductName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 14,
    lineHeight: 32,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  detailDivider: {
    height: 1.2,
    marginVertical: 18,
    opacity: 0.35,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  vendorDetailSection: {
    marginTop: 8,
  },
  vendorDetailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
  },
  vendorAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetailInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  vendorDetailName: {
    fontSize: 16,
    fontWeight: '800',
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorDetailCity: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  detailActionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  detailActionButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ========== CREATE MODAL ==========
  createContainer: {
    flex: 1,
  },
  createContent: {
    flex: 1,
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  createCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createFormScroll: {
    flex: 1,
  },
  createForm: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 18,
  },
  createFieldGroup: {
    gap: 10,
  },
  createLabel: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    fontSize: 16,
    fontWeight: '600',
  },
  categorySelectWrapper: {
    marginTop: 8,
  },
  categorySelectScroll: {
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  categorySelectButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1.2,
    minHeight: 42,
    justifyContent: 'center',
  },
  categorySelectText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  imagesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addImageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  imagesPreviewScroll: {
    marginHorizontal: -4,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginHorizontal: 8,
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  createFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  createActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  createActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});








