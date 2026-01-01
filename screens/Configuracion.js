import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useAppStore';
import useAppStore from '../store/useAppStore';
import BackButton from '../components/common/BackButton';
import { spacing, typography, borderRadius } from '../theme';

export default function Configuracion() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  
  // Estados simulados para configuraciones
  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [shareActivity, setShareActivity] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);

  // Datos simulados de la app
  const appVersion = '1.2.3';
  const buildNumber = '45';
  const cacheSize = '23.5 MB';
  const lastSync = '2 min ago';

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { 
        backgroundColor: theme.colors.glass.background,
        borderColor: theme.colors.border,
      }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({ icon, iconColor, title, subtitle, rightComponent, onPress, showArrow = false }) => (
    <TouchableOpacity 
      style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress && !showArrow}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.text.secondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
      )}
    </TouchableOpacity>
  );

  const ToggleSwitch = ({ value, onValueChange }) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
      thumbColor={value ? theme.colors.primary : theme.colors.text.secondary}
    />
  );

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que deseas limpiar el caché de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', onPress: () => Alert.alert('Éxito', 'Caché limpiado correctamente') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Exportar Datos', 'Tus datos de rutas se exportarán a un archivo JSON.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Política de Privacidad', 'Se abrirá la política de privacidad en el navegador.');
  };

  const handleTerms = () => {
    Alert.alert('Términos de Servicio', 'Se abrirán los términos de servicio en el navegador.');
  };

  const handleSupport = () => {
    Alert.alert('Soporte', 'Contacta con soporte en: soporte@rollemospues.com');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <BackButton title="Configuración" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Apariencia */}
        <SettingSection title="APARIENCIA">
          <SettingRow
            icon="moon"
            iconColor={theme.colors.secondary}
            title="Modo Oscuro"
            subtitle={isDark ? 'Activado' : 'Desactivado'}
            rightComponent={
              <ToggleSwitch value={isDark} onValueChange={toggleTheme} />
            }
          />
          <SettingRow
            icon="speedometer"
            iconColor={theme.colors.info}
            title="Unidades"
            subtitle={metricUnits ? 'Sistema Métrico (km)' : 'Sistema Imperial (mi)'}
            rightComponent={
              <ToggleSwitch value={metricUnits} onValueChange={setMetricUnits} />
            }
          />
        </SettingSection>

        {/* Notificaciones */}
        <SettingSection title="NOTIFICACIONES">
          <SettingRow
            icon="notifications"
            iconColor={theme.colors.warning}
            title="Notificaciones Push"
            subtitle="Alertas de rutas y actividad"
            rightComponent={
              <ToggleSwitch value={notifications} onValueChange={setNotifications} />
            }
          />
          <SettingRow
            icon="volume-high"
            iconColor={theme.colors.success}
            title="Efectos de Sonido"
            subtitle="Durante el tracking de rutas"
            rightComponent={
              <ToggleSwitch value={soundEffects} onValueChange={setSoundEffects} />
            }
          />
        </SettingSection>

        {/* Privacidad */}
        <SettingSection title="PRIVACIDAD Y UBICACIÓN">
          <SettingRow
            icon="location"
            iconColor={theme.colors.error}
            title="Ubicación en Tiempo Real"
            subtitle="Permitir seguimiento GPS"
            rightComponent={
              <ToggleSwitch value={locationEnabled} onValueChange={setLocationEnabled} />
            }
          />
          <SettingRow
            icon="people"
            iconColor={theme.colors.primary}
            title="Compartir Actividad"
            subtitle="Visible para otros patinadores"
            rightComponent={
              <ToggleSwitch value={shareActivity} onValueChange={setShareActivity} />
            }
          />
        </SettingSection>

        {/* Datos */}
        <SettingSection title="DATOS Y ALMACENAMIENTO">
          <SettingRow
            icon="sync"
            iconColor={theme.colors.info}
            title="Sincronización Automática"
            subtitle={`Última sync: ${lastSync}`}
            rightComponent={
              <ToggleSwitch value={autoSync} onValueChange={setAutoSync} />
            }
          />
          <SettingRow
            icon="folder"
            iconColor={theme.colors.warning}
            title="Caché de la App"
            subtitle={cacheSize}
            onPress={handleClearCache}
            showArrow
          />
          <SettingRow
            icon="download"
            iconColor={theme.colors.success}
            title="Exportar Mis Datos"
            subtitle="Descarga tus rutas y estadísticas"
            onPress={handleExportData}
            showArrow
          />
        </SettingSection>

        {/* Soporte */}
        <SettingSection title="SOPORTE">
          <SettingRow
            icon="help-circle"
            iconColor={theme.colors.primary}
            title="Centro de Ayuda"
            subtitle="FAQ y tutoriales"
            onPress={handleSupport}
            showArrow
          />
          <SettingRow
            icon="mail"
            iconColor={theme.colors.secondary}
            title="Contactar Soporte"
            subtitle="soporte@rollemospues.com"
            onPress={handleSupport}
            showArrow
          />
          <SettingRow
            icon="star"
            iconColor={theme.colors.warning}
            title="Calificar la App"
            subtitle="¡Déjanos una reseña!"
            onPress={() => Alert.alert('Gracias', '¡Se abrirá la tienda de apps!')}
            showArrow
          />
        </SettingSection>

        {/* Legal */}
        <SettingSection title="LEGAL">
          <SettingRow
            icon="document-text"
            iconColor={theme.colors.text.secondary}
            title="Política de Privacidad"
            onPress={handlePrivacyPolicy}
            showArrow
          />
          <SettingRow
            icon="shield-checkmark"
            iconColor={theme.colors.text.secondary}
            title="Términos de Servicio"
            onPress={handleTerms}
            showArrow
          />
          <SettingRow
            icon="information-circle"
            iconColor={theme.colors.text.secondary}
            title="Licencias de Código Abierto"
            onPress={() => Alert.alert('Licencias', 'React Native, Expo, Supabase...')}
            showArrow
          />
        </SettingSection>

        {/* Info de la App */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            Rollemos Pues!!! 🛼
          </Text>
          <Text style={[styles.appVersion, { color: theme.colors.text.secondary }]}>
            Versión {appVersion} (Build {buildNumber})
          </Text>
          <Text style={[styles.appCopyright, { color: theme.colors.text.secondary }]}>
            © 2024 Rollemos Pues. Todos los derechos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  sectionContent: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  appVersion: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  appCopyright: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});
