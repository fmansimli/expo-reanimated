import { useCallback, useImperativeHandle, forwardRef } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("screen");
const MAX_TRANSLATE_Y = -height + 50;

type IProps = {
  snap?: number;
  children: React.ReactNode;
};
export type BottomSheetRef = {
  scrollTo?: (destination: number) => void;
  isActive?: () => boolean;
};

const BottomSheet = forwardRef<BottomSheetRef, IProps>((props, ref) => {
  const ctx = useSharedValue({ y: 0 });
  const ty = useSharedValue(props.snap!);
  const active = useSharedValue(false);

  const scrollTo = useCallback((destination: number) => {
    "worklet";

    active.value = destination !== 0;
    ty.value = withSpring(destination, { damping: 15 });
  }, []);

  const isActive = useCallback(() => {
    return active.value;
  }, []);

  useImperativeHandle(ref, () => ({ scrollTo, isActive }), [scrollTo]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      ctx.value = { y: ty.value };
    })
    .onUpdate((event) => {
      ty.value = event.translationY + ctx.value.y;
      ty.value = Math.max(MAX_TRANSLATE_Y, ty.value);
    })
    .onEnd(() => {
      if (ty.value > -height / 2) {
        scrollTo(0);
      } else if (ty.value < -height / 2) {
        scrollTo(MAX_TRANSLATE_Y);
      }
    });

  const rstyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      ty.value,
      [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
      [10, 0],
      Extrapolation.CLAMP
    );
    return {
      borderRadius,
      transform: [{ translateY: ty.value }],
    };
  });

  const rBackDropStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(active.value ? 1 : 0),
    };
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, rBackDropStyle]}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.comp, rstyle]}>
          <View style={styles.line} />
          {props.children}
        </Animated.View>
      </GestureDetector>
    </>
  );
});

BottomSheet.defaultProps = {
  snap: 0,
};

export default BottomSheet;

const styles = StyleSheet.create({
  comp: {
    width: width,
    height: height,
    position: "absolute",
    top: height,
    backgroundColor: "white",
    alignItems: "center",
    borderRadius: 10,
  },
  line: {
    alignSelf: "center",
    width: 80,
    height: 5,
    borderRadius: 4,
    backgroundColor: "gray",
    marginVertical: 7,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
