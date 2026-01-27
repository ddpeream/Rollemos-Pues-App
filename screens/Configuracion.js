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
  const lastSync = t('screens.configuracion.lastSyncTime');

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
      t('screens.configuracion.alerts.clearCacheTitle'),
      t('screens.configuracion.alerts.clearCacheMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('screens.configuracion.alerts.clearCacheConfirm'),
          onPress: () =>
            Alert.alert(
              t('common.success'),
              t('screens.configuracion.alerts.clearCacheSuccess')
            ),
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      t('screens.configuracion.alerts.exportDataTitle'),
      t('screens.configuracion.alerts.exportDataMessage')
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      t('screens.configuracion.alerts.privacyPolicyTitle'),
      t('screens.configuracion.alerts.privacyPolicyMessage')
    );
  };

  const handleTerms = () => {
    Alert.alert(
      t('screens.configuracion.alerts.termsTitle'),
      t('screens.configuracion.alerts.termsMessage')
    );
  };

  const handleSupport = () => {
    Alert.alert(
      t('screens.configuracion.alerts.supportTitle'),
      t('screens.configuracion.alerts.supportMessage')
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <BackButton title={t('screens.configuracion.title')} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Apariencia */}
        <SettingSection title={t('screens.configuracion.sections.appearance')}>
          <SettingRow
            icon="moon"
            iconColor={theme.colors.secondary}
            title={t('screens.configuracion.darkMode')}
            subtitle={
              isDark
                ? t('screens.configuracion.enabled')
                : t('screens.configuracion.disabled')
            }
            rightComponent={
              <ToggleSwitch value={isDark} onValueChange={toggleTheme} />
            }
          />
          <SettingRow
            icon="speedometer"
            iconColor={theme.colors.info}
            title={t('screens.configuracion.units')}
            subtitle={
              metricUnits
                ? t('screens.configuracion.metricSystem')
                : t('screens.configuracion.imperialSystem')
            }
            rightComponent={
              <ToggleSwitch value={metricUnits} onValueChange={setMetricUnits} />
            }
          />
        </SettingSection>

        {/* Notificaciones */}
        <SettingSection title={t('screens.configuracion.sections.notifications')}>
          <SettingRow
            icon="notifications"
            iconColor={theme.colors.warning}
            title={t('screens.configuracion.pushNotifications')}
            subtitle={t('screens.configuracion.pushNotificationsHint')}
            rightComponent={
              <ToggleSwitch value={notifications} onValueChange={setNotifications} />
            }
          />
          <SettingRow
            icon="volume-high"
            iconColor={theme.colors.success}
            title={t('screens.configuracion.soundEffects')}
            subtitle={t('screens.configuracion.soundEffectsHint')}
            rightComponent={
              <ToggleSwitch value={soundEffects} onValueChange={setSoundEffects} />
            }
          />
        </SettingSection>

        {/* Privacidad */}
        <SettingSection title={t('screens.configuracion.sections.privacyLocation')}>
          <SettingRow
            icon="location"
            iconColor={theme.colors.error}
            title={t('screens.configuracion.realTimeLocation')}
            subtitle={t('screens.configuracion.realTimeLocationHint')}
            rightComponent={
              <ToggleSwitch value={locationEnabled} onValueChange={setLocationEnabled} />
            }
          />
          <SettingRow
            icon="people"
            iconColor={theme.colors.primary}
            title={t('screens.configuracion.shareActivity')}
            subtitle={t('screens.configuracion.shareActivityHint')}
            rightComponent={
              <ToggleSwitch value={shareActivity} onValueChange={setShareActivity} />
            }
          />
        </SettingSection>

        {/* Datos */}
        <SettingSection title={t('screens.configuracion.sections.dataStorage')}>
          <SettingRow
            icon="sync"
            iconColor={theme.colors.info}
            title={t('screens.configuracion.autoSync')}
            subtitle={t('screens.configuracion.lastSync', { time: lastSync })}
            rightComponent={
              <ToggleSwitch value={autoSync} onValueChange={setAutoSync} />
            }
          />
          <SettingRow
            icon="folder"
            iconColor={theme.colors.warning}
            title={t('screens.configuracion.cache')}
            subtitle={cacheSize}
            onPress={handleClearCache}
            showArrow
          />
          <SettingRow
            icon="download"
            iconColor={theme.colors.success}
            title={t('screens.configuracion.exportData')}
            subtitle={t('screens.configuracion.exportDataHint')}
            onPress={handleExportData}
            showArrow
          />
        </SettingSection>

        {/* Soporte */}
        <SettingSection title={t('screens.configuracion.sections.support')}>
          <SettingRow
            icon="help-circle"
            iconColor={theme.colors.primary}
            title={t('screens.configuracion.helpCenter')}
            subtitle={t('screens.configuracion.helpCenterHint')}
            onPress={handleSupport}
            showArrow
          />
          <SettingRow
            icon="mail"
            iconColor={theme.colors.secondary}
            title={t('screens.configuracion.contactSupport')}
            subtitle={t('screens.configuracion.supportEmail')}
            onPress={handleSupport}
            showArrow
          />
          <SettingRow
            icon="star"
            iconColor={theme.colors.warning}
            title={t('screens.configuracion.rateApp')}
            subtitle={t('screens.configuracion.rateAppHint')}
            onPress={() =>
              Alert.alert(
                t('screens.configuracion.alerts.rateAppTitle'),
                t('screens.configuracion.alerts.rateAppMessage')
              )
            }
            showArrow
          />
        </SettingSection>

        {/* Legal */}
        <SettingSection title={t('screens.configuracion.sections.legal')}>
          <SettingRow
            icon="document-text"
            iconColor={theme.colors.text.secondary}
            title={t('screens.configuracion.privacyPolicy')}
            onPress={handlePrivacyPolicy}
            showArrow
          />
          <SettingRow
            icon="shield-checkmark"
            iconColor={theme.colors.text.secondary}
            title={t('screens.configuracion.terms')}
            onPress={handleTerms}
            showArrow
          />
          <SettingRow
            icon="information-circle"
            iconColor={theme.colors.text.secondary}
            title={t('screens.configuracion.licenses')}
            onPress={() =>
              Alert.alert(
                t('screens.configuracion.alerts.licensesTitle'),
                t('screens.configuracion.alerts.licensesMessage')
              )
            }
            showArrow
          />
        </SettingSection>

        {/* Info de la App */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            {t('screens.configuracion.appName')}
          </Text>
          <Text style={[styles.appVersion, { color: theme.colors.text.secondary }]}>
            {t('screens.configuracion.versionLabel', {
              version: appVersion,
              build: buildNumber,
            })}
          </Text>
          <Text style={[styles.appCopyright, { color: theme.colors.text.secondary }]}>
            {t('screens.configuracion.copyright')}
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
