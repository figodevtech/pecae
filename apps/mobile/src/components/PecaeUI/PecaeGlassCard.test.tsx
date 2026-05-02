import React from 'react';
import { PecaeGlassCard } from './PecaeGlassCard';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

// Mock the context
jest.mock('../../theme', () => ({
  usePecaeTheme: () => ({
    colors: { surface: 'black', border: 'black' },
    effects: { radius: { md: 10 } },
    isDark: true
  })
}));

describe('PecaeGlassCard', () => {
  it('[COMP-01] renderiza com intensity correto', () => {
    const testRenderer = TestRenderer.create(<PecaeGlassCard intensity={80}><Text>Test</Text></PecaeGlassCard>);
    const testInstance = testRenderer.root;

    // expo-blur's BlurView
    const blurView = testInstance.findByProps({ intensity: 80 });
    expect(blurView.props.intensity).toBe(80);
  });

  it('[COMP-02] renderiza children corretamente', () => {
    const testRenderer = TestRenderer.create(
      <PecaeGlassCard>
        <Text>Conteúdo</Text>
      </PecaeGlassCard>
    );

    const testInstance = testRenderer.root;
    const textElement = testInstance.findByType(Text);
    expect(textElement.props.children).toBe('Conteúdo');
  });
});
