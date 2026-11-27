import { StyleSheet } from 'react-native';

export const screen = StyleSheet.create({
  content: { padding: 18, paddingTop: 10, paddingBottom: 112, gap: 20 }, // bottom space clears the floating tab bar
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
