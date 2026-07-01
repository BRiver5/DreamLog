import { ReactNode, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radii, spacing } from "@/theme";

const SCREEN_H = Dimensions.get("window").height;

/** Spring slide-up sheet with a fading backdrop (spec §10). */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Smooth ease-out slide (no spring overshoot / bounce).
      translateY.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
      backdrop.value = withTiming(1, { duration: 260 });
    } else {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_H, {
        duration: 240,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const close = () => {
    backdrop.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_H, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={styles.root}>
        <AnimatedPressable style={backdropStyle} onPress={close} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.lg },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function AnimatedPressable({
  style,
  onPress,
}: {
  style: any;
  onPress: () => void;
}) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, style]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.cardLg,
    borderTopRightRadius: radii.cardLg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: spacing.lg,
  },
});
