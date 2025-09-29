import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Import data
import skatersData from '../data/skaters.json';
import parchesData from '../data/parches.json';
import spotsData from '../data/spots.json';

const { width } = Dimensions.get('window');

export default function Inicio() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  // Carousel images (usando placeholders de Unsplash)
  const carouselImages = [
    'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800',
    'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=800',
    'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=800',
  ];

  // Get featured data
  const featuredSkaters = skatersData.filter(s => s.destacado).slice(0, 3);
  const featuredParches = parchesData.slice(0, 3);
  const featuredSpots = spotsData.slice(0, 3);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % carouselImages.length;
        scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = () => {
    if (!email.includes('@')) {
      Alert.alert('Error', t('home.cta.emailPlaceholder'));
      return;
    }
    Alert.alert('¡Éxito!', '¡Gracias por suscribirte!');
    setEmail('');
  };

  const renderFeatureCard = (icon, title, description) => (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={32} color={theme.colors.primary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );

  const renderSkaterCard = (skater) => (
    <View key={skater.id} style={styles.destacadoCard}>
      <Image source={{ uri: skater.foto }} style={styles.destacadoImage} />
      <View style={styles.destacadoContent}>
        <Text style={styles.destacadoName}>{skater.nombre}</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, styles.badgeLevel]}>
            <Text style={styles.badgeText}>{skater.nivel}</Text>
          </View>
          {skater.disciplinas.slice(0, 2).map((disc, idx) => (
            <View key={idx} style={styles.badge}>
              <Text style={styles.badgeText}>{disc}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.destacadoCity}>{skater.ciudad}</Text>
      </View>
    </View>
  );

  const renderParcheCard = (parche) => (
    <View key={parche.id} style={styles.destacadoCard}>
      <Image source={{ uri: parche.foto }} style={styles.destacadoImage} />
      <View style={styles.destacadoContent}>
        <Text style={styles.destacadoName}>{parche.nombre}</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, styles.badgeMembers]}>
            <Ionicons name="people" size={12} color="#fff" />
            <Text style={styles.badgeText}> {parche.miembrosAprox}</Text>
          </View>
          {parche.disciplinas.slice(0, 2).map((disc, idx) => (
            <View key={idx} style={styles.badge}>
              <Text style={styles.badgeText}>{disc}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.destacadoCity}>{parche.ciudad}</Text>
      </View>
    </View>
  );

  const renderSpotCard = (spot) => (
    <View key={spot.id} style={styles.destacadoCard}>
      <Image source={{ uri: spot.foto }} style={styles.destacadoImage} />
      <View style={styles.destacadoContent}>
        <Text style={styles.destacadoName}>{spot.nombre}</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, styles.badgeType]}>
            <Text style={styles.badgeText}>{spot.tipo}</Text>
          </View>
          <View
            style={[
              styles.badge,
              spot.dificultad === 'baja'
                ? styles.badgeDiffEasy
                : spot.dificultad === 'alta'
                ? styles.badgeDiffHard
                : styles.badgeDiffMedium,
            ]}
          >
            <Text style={styles.badgeText}>{spot.dificultad}</Text>
          </View>
        </View>
        <Text style={styles.destacadoCity}>{spot.ciudad}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{t('home.hero.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('home.hero.subtitle')}</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => navigation.navigate('Patinadores')}
            >
              <Text style={styles.buttonPrimaryText}>
                {t('home.hero.exploreSkaters')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.navigate('Spots')}
            >
              <Text style={styles.buttonSecondaryText}>
                {t('home.hero.viewSpots')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* What You Can Do Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.whatYouCanDo.title')}</Text>
        <View style={styles.featuresGrid}>
          {renderFeatureCard(
            'person-add',
            t('home.whatYouCanDo.connect.title'),
            t('home.whatYouCanDo.connect.description')
          )}
          {renderFeatureCard(
            'people',
            t('home.whatYouCanDo.join.title'),
            t('home.whatYouCanDo.join.description')
          )}
          {renderFeatureCard(
            'location',
            t('home.whatYouCanDo.explore.title'),
            t('home.whatYouCanDo.explore.description')
          )}
        </View>
      </View>

      {/* Carousel Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.carousel.title')}</Text>
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const slide = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentSlide(slide);
            }}
          >
            {carouselImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.carouselImage}
              />
            ))}
          </ScrollView>
          <View style={styles.carouselIndicators}>
            {carouselImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentSlide === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Featured Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.featured.title')}</Text>

        {/* Featured Skaters */}
        <Text style={styles.subsectionTitle}>{t('home.featured.skaters')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.destacadosContainer}>
            {featuredSkaters.map(renderSkaterCard)}
          </View>
        </ScrollView>

        {/* Featured Parches */}
        <Text style={styles.subsectionTitle}>{t('home.featured.parches')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.destacadosContainer}>
            {featuredParches.map(renderParcheCard)}
          </View>
        </ScrollView>

        {/* Featured Spots */}
        <Text style={styles.subsectionTitle}>{t('home.featured.spots')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.destacadosContainer}>
            {featuredSpots.map(renderSpotCard)}
          </View>
        </ScrollView>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.about.title')}</Text>
        <Text style={styles.aboutDescription}>
          {t('home.about.description')}
        </Text>
        <Text style={styles.aboutMission}>{t('home.about.mission')}</Text>
        
        <Text style={styles.teamTitle}>{t('home.about.team')}</Text>
        <View style={styles.teamContainer}>
          <View style={styles.teamMember}>
            <View style={styles.teamAvatar}>
              <Ionicons name="person" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.teamName}>{t('home.about.deimar')}</Text>
          </View>
          <View style={styles.teamMember}>
            <View style={styles.teamAvatar}>
              <Ionicons name="person" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.teamName}>{t('home.about.carlos')}</Text>
          </View>
        </View>
      </View>

      {/* Newsletter CTA Section */}
      <View style={[styles.section, styles.ctaSection]}>
        <Text style={styles.ctaTitle}>{t('home.cta.title')}</Text>
        <Text style={styles.ctaSubtitle}>{t('home.cta.subtitle')}</Text>
        <View style={styles.ctaForm}>
          <TextInput
            style={styles.ctaInput}
            placeholder={t('home.cta.emailPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubscribe}
          >
            <Text style={styles.buttonPrimaryText}>
              {t('home.cta.subscribe')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hero: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonSecondaryText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    gap: theme.spacing.md,
  },
  featureCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  carouselContainer: {
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  carouselImage: {
    width: width - theme.spacing.lg * 2,
    height: 200,
    resizeMode: 'cover',
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  destacadosContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  destacadoCard: {
    width: 250,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  destacadoImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  destacadoContent: {
    padding: theme.spacing.md,
  },
  destacadoName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  badgeLevel: {
    backgroundColor: theme.colors.success + '20',
  },
  badgeMembers: {
    backgroundColor: theme.colors.info + '20',
  },
  badgeType: {
    backgroundColor: theme.colors.warning + '20',
  },
  badgeDiffEasy: {
    backgroundColor: theme.colors.success + '20',
  },
  badgeDiffMedium: {
    backgroundColor: theme.colors.warning + '20',
  },
  badgeDiffHard: {
    backgroundColor: theme.colors.error + '20',
  },
  destacadoCity: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  aboutDescription: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  aboutMission: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  teamContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  teamMember: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  teamName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaSection: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.lg,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  ctaForm: {
    gap: theme.spacing.md,
  },
  ctaInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
  },
});
