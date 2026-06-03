import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';

interface StarRatingPickerProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  maxStars?: number;
}

export const StarRatingPicker: React.FC<StarRatingPickerProps> = ({
  rating,
  onRatingChange,
  size = 40,
  maxStars = 5,
}) => {
  const { colors } = usePecaeTheme();
  const [animations] = useState(() => 
    Array.from({ length: maxStars }, () => new Animated.Value(1))
  );

  const handlePress = (index: number) => {
    const newRating = index + 1;
    onRatingChange(newRating);

    // Trigger bounce animation for the clicked star
    Animated.sequence([
      Animated.timing(animations[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animations[index], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const isFilled = index < rating;
        const scale = animations[index];

        return (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(index)}
            activeOpacity={0.7}
            style={styles.starWrapper}
            testID={`star-rating-${index + 1}`}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={size}
                color={isFilled ? colors.brand : colors.textMuted}
              />
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  starWrapper: {
    padding: 4,
  },
});
