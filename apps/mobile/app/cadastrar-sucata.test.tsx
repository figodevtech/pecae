import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

const SpecHud = ({ brand, model, year, mileage }: any) => (
  <React.Fragment>
    <Text>{brand}</Text>
    <Text>{model}</Text>
    <Text>{year}</Text>
    <Text>{mileage} km</Text>
  </React.Fragment>
);

describe('SpecHud (in cadastrar-sucata)', () => {
  it('[COMP-03] exibe dados técnicos do veículo', () => {
    const props = { brand: 'Fiat', model: 'Uno', year: 2018, mileage: '85.000' };
    const testRenderer = TestRenderer.create(<SpecHud {...props} />);
    const textInstances = testRenderer.root.findAllByType(Text);

    const renderedTexts = textInstances.map(node => node.props.children).flat().join('');

    expect(renderedTexts).toContain('Fiat');
    expect(renderedTexts).toContain('Uno');
    expect(renderedTexts).toContain('2018');
    expect(renderedTexts).toContain('85.000 km');
  });
});
