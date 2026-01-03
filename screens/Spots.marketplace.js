import React, { useState } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';

const { width } = Dimensions.get('window');

// 🛒 DATA QUEMADA - ARTÍCULOS DEL MARKETPLACE
const MARKETPLACE_ITEMS = [
  {
    id: 1,
    nombre: 'Tabla Skateboard Profesional',
    precio: 180000,
    imagen: 'https://via.placeholder.com/300x200?text=Skateboard+Pro',
    descripcion: 'Tabla de skateboard profesional con grip incluido. Excelente para principiantes y avanzados.',
    vendedor: {
      nombre: 'Juan Pérez',
      telefono: '+573001234567',
      whatsapp: '+573001234567',
      ciudad: 'Medellín',
    },
    categoria: 'Tablas',
    condicion: 'Nueva',
    rating: 4.8,
    reviews: 24,
  },
  {
    id: 2,
    nombre: 'Ruedas Bones 51mm',
    precio: 120000,
    imagen: 'https://via.placeholder.com/300x200?text=Ruedas+Bones',
    descripcion: 'Set de 4 ruedas Bones 51mm, 99a dureza. Perfecto para street.',
    vendedor: {
      nombre: 'María García',
      telefono: '+573009876543',
      whatsapp: '+573009876543',
      ciudad: 'Bogotá',
    },
    categoria: 'Ruedas',
    condicion: 'Nueva',
    rating: 4.9,
    reviews: 18,
  },
  {
    id: 3,
    nombre: 'Lija Griptape Profesional',
    precio: 45000,
    imagen: 'https://via.placeholder.com/300x200?text=Griptape',
    descripcion: 'Lija de griptape profesional 9x33. Color rojo intenso.',
    vendedor: {
      nombre: 'Carlos López',
      telefono: '+573102345678',
      whatsapp: '+573102345678',
      ciudad: 'Cali',
    },
    categoria: 'Partes',
    condicion: 'Nueva',
    rating: 4.7,
    reviews: 12,
  },
  {
    id: 4,
    nombre: 'Bearings Bronson G3',
    precio: 95000,
    imagen: 'https://via.placeholder.com/300x200?text=Bearings+G3',
    descripcion: 'Set de 8 bearings Bronson G3 speed series. Últimas piezas.',
    vendedor: {
      nombre: 'Andrea Martínez',
      telefono: '+573214567890',
      whatsapp: '+573214567890',
      ciudad: 'Barranquilla',
    },
    categoria: 'Ruedas',
    condicion: 'Nueva',
    rating: 4.9,
    reviews: 31,
  },
  {
    id: 5,
    nombre: 'Protecciones Completas',
    precio: 85000,
    imagen: 'https://via.placeholder.com/300x200?text=Protecciones',
    descripcion: 'Set completo de protecciones: muñecas, codos y rodillas. Talla M.',
    vendedor: {
      nombre: 'Roberto Sánchez',
      telefono: '+573325678901',
      whatsapp: '+573325678901',
      ciudad: 'Medellín',
    },
    categoria: 'Protección',
    condicion: 'Como nueva',
    rating: 4.6,
    reviews: 9,
  },
  {
    id: 6,
    nombre: 'Mochilas para Skate',
    precio: 75000,
    imagen: 'https://via.placeholder.com/300x200?text=Mochila+Skate',
    descripcion: 'Mochila especial para transportar tabla. Compartimientos especializados.',
    vendedor: {
      nombre: 'Laura Díaz',
      telefono: '+573436789012',
      whatsapp: '+573436789012',
      ciudad: 'Medellín',
    },
    categoria: 'Accesorios',
    condicion: 'Nueva',
    rating: 4.8,
    reviews: 15,
  },
];

export default function SpotsMarketplace() {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // 🔍 Filtrar artículos
  const filteredItems = React.useMemo(() => {
    return MARKETPLACE_ITEMS.filter((item) => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || item.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // 📞 Llamar al vendedor
  const handleCall = (telefono) => {
    Linking.openURL(`tel:${telefono}`);
  };

  // 💬 Enviar WhatsApp
  const handleWhatsApp = (numero, item) => {
    const mensaje = `Hola, me interesa el artículo: ${item.nombre} por $${item.precio}. ¿Todavía está disponible?`;
    const urlWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(urlWhatsApp);
  };

  // 🎨 Tarjeta de artículo (Grid)
  const renderItemCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Imagen */}
      <Image
        source={{ uri: item.imagen }}
        style={styles.itemImage}
      />

      {/* Condición Badge */}
      <View style={[styles.conditionBadge, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.conditionText, { color: theme.colors.onPrimary }]}>
          {item.condicion}
        </Text>
      </View>

      {/* Contenido */}
      <View style={styles.itemContent}>
        {/* Nombre y Precio */}
        <Text style={[styles.itemName, { color: theme.colors.text.primary }]} numberOfLines={2}>
          {item.nombre}
        </Text>

        <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
          ${item.precio.toLocaleString('es-CO')}
        </Text>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: theme.colors.text.secondary }]}>
            {item.rating} ({item.reviews})
          </Text>
        </View>

        {/* Vendedor */}
        <View style={styles.sellerInfo}>
          <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
          <View style={styles.sellerDetails}>
            <Text style={[styles.sellerName, { color: theme.colors.text.primary }]}>
              {item.vendedor.nombre}
            </Text>
            <Text style={[styles.sellerCity, { color: theme.colors.text.secondary }]}>
              {item.vendedor.ciudad}
            </Text>
          </View>
        </View>

        {/* Botones de Contacto */}
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={[
              styles.contactBtn,
              { borderColor: theme.colors.primary, borderWidth: 1 },
            ]}
            onPress={() => handleCall(item.vendedor.telefono)}
          >
            <Ionicons name="call" size={16} color={theme.colors.primary} />
            <Text style={[styles.contactBtnText, { color: theme.colors.primary }]}>
              Llamar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
            onPress={() => handleWhatsApp(item.vendedor.whatsapp, item)}
          >
            <MaterialCommunityIcons name="whatsapp" size={16} color="#FFFFFF" />
            <Text style={[styles.contactBtnText, { color: '#FFFFFF' }]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 📋 Tarjeta de artículo (Lista)
  const renderItemList = ({ item }) => (
    <View
      style={[
        styles.listItem,
        { 
          backgroundColor: theme.colors.glass.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Imagen */}
      <Image
        source={{ uri: item.imagen }}
        style={styles.listItemImage}
      />

      {/* Contenido */}
      <View style={styles.listItemContent}>
        {/* Header */}
        <View style={styles.listItemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
              ${item.precio.toLocaleString('es-CO')}
            </Text>
          </View>
          <View style={[styles.conditionBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.conditionText, { color: theme.colors.onPrimary }]}>
              {item.condicion}
            </Text>
          </View>
        </View>

        {/* Descripción */}
        <Text style={[styles.description, { color: theme.colors.text.secondary }]} numberOfLines={2}>
          {item.descripcion}
        </Text>

        {/* Vendedor y Rating */}
        <View style={styles.listItemFooter}>
          <View style={styles.sellerSmall}>
            <Text style={[styles.sellerNameSmall, { color: theme.colors.text.primary }]}>
              {item.vendedor.nombre}
            </Text>
            <View style={styles.ratingSmall}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingSmallText, { color: theme.colors.text.secondary }]}>
                {item.rating}
              </Text>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.contactButtonsSmall}>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleCall(item.vendedor.telefono)}
            >
              <Ionicons name="call" size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: '#25D366' }]}
              onPress={() => handleWhatsApp(item.vendedor.whatsapp, item)}
            >
              <MaterialCommunityIcons name="whatsapp" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const categories = ['Todos', 'Tablas', 'Ruedas', 'Partes', 'Protección', 'Accesorios'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            🛒 Marketplace
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {filteredItems.length} artículos
          </Text>
        </View>

        {/* View Mode Toggle */}
        <View style={[styles.viewToggle, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'grid' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={20}
              color={viewMode === 'grid' ? theme.colors.onPrimary : theme.colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? theme.colors.onPrimary : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Buscar artículos..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              selectedCategory === cat && { backgroundColor: theme.colors.primary },
              selectedCategory !== cat && {
                backgroundColor: theme.colors.glass.background,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
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

      {/* Lista de Artículos */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={viewMode === 'grid' ? renderItemCard : renderItemList}
          keyExtractor={(item) => item.id.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? { gap: 12, paddingHorizontal: 12 } : undefined}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="inbox-multiple-outline"
            size={48}
            color={theme.colors.text.secondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No hay artículos disponibles
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },

  // Grid View Styles
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemContent: {
    padding: 12,
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  sellerCity: {
    fontSize: 11,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // List View Styles
  listItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItemImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  listItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  description: {
    fontSize: 12,
    marginVertical: 4,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sellerSmall: {
    flex: 1,
  },
  sellerNameSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingSmallText: {
    fontSize: 11,
  },
  contactButtonsSmall: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
