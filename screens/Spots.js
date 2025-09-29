import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../theme';

export default function Spots() {
  const { t } = useTranslation();
  
  return (
    <View style={commonStyles.containerLight}>
      <Text style={commonStyles.titleLG}>{t('screens.spots')}</Text>
    </View>
  );
}
