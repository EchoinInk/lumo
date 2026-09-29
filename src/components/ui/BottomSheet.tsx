import { Colors, Radius, Shadows, Spacing } from '@/theme/tokens';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps extends ViewProps {
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
  snapPoint?: number;
}

export function BottomSheet({ 
  children, 
  visible, 
  onClose,
  snapPoint = 0.5,
  className = '',
  style,
  ...props 
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close bottom sheet"
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.sheetLayer}
        >
          <View
            className={className}
            style={[
              styles.container,
              {
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
              style,
            ]}
            {...props}
          >
            <View style={styles.handle} />
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: Colors.overlay,
    zIndex: 1,
  },
  sheetLayer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    zIndex: 2,
    elevation: 2,
  },
  container: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadows.xl,
    zIndex: 3,
    elevation: 3,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
});
