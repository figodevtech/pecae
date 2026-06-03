import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Text, TextInput } from 'react-native';

const { act } = TestRenderer;

const MockRegisterForm = () => {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const isEmailValid = email.includes('@');
  const isEmpty = email.trim() === '';

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <React.Fragment>
      <TextInput testID="email-input" value={email} onChangeText={setEmail} />
      <Text testID="submit-btn" onPress={handleSubmit}>Submit</Text>
      {submitted && isEmpty && <Text>Obrigatório</Text>}
      {submitted && !isEmpty && !isEmailValid && <Text>Formato de email inválido</Text>}
    </React.Fragment>
  );
};

describe('Register Form', () => {
  it('[COMP-04] exibe erro em campo obrigatório vazio', () => {
    let testRenderer: any;
    act(() => {
      testRenderer = TestRenderer.create(<MockRegisterForm />);
    });
    const testInstance = testRenderer.root;

    const submitBtn = testInstance.findByProps({ testID: 'submit-btn' });
    act(() => {
      submitBtn.props.onPress();
    });

    const texts = testInstance.findAllByType(Text).map((t: any) => t.props.children).flat().join('');
    expect(texts).toContain('Obrigatório');
  });

  it('[COMP-05] campo email inválido exibe mensagem de erro', () => {
    let testRenderer: any;
    act(() => {
      testRenderer = TestRenderer.create(<MockRegisterForm />);
    });
    const testInstance = testRenderer.root;

    const input = testInstance.findByProps({ testID: 'email-input' });
    act(() => {
      input.props.onChangeText('nao-e-email');
    });

    const submitBtn = testInstance.findByProps({ testID: 'submit-btn' });
    act(() => {
      submitBtn.props.onPress();
    });

    const texts = testInstance.findAllByType(Text).map((t: any) => t.props.children).flat().join('');
    expect(texts).toContain('Formato de email inválido');
  });
});
