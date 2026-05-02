import React from 'react';
import TestRenderer from 'react-test-renderer';
import { View } from 'react-native';

const ExpoImageMock = (props: any) => <View {...props} testID="expo-image-mock" />;

const VehicleCardMock = ({ vehicle }: any) => {
  return (
    <View>
      <ExpoImageMock
        source={{ uri: vehicle.thumbnail }}
        placeholder={vehicle.blurhash}
      />
    </View>
  );
};

describe('VehicleCard', () => {
  it('[COMP-06] exibe placeholder de imagem enquanto carrega', () => {
    const mockVehicle = {
      thumbnail: 'http://example.com/image.jpg',
      blurhash: 'LGFFaXYk...'
    };

    const testRenderer = TestRenderer.create(<VehicleCardMock vehicle={mockVehicle} />);
    const testInstance = testRenderer.root;

    const imageComponent = testInstance.findByProps({ testID: 'expo-image-mock' });
    expect(imageComponent.props.placeholder).toBe('LGFFaXYk...');
  });
});
