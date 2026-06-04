import { validate } from 'class-validator';
import { IsCNPJ } from './is-cnpj.decorator';

class TestCnpjModel {
  @IsCNPJ({ message: 'CNPJ inválido' })
  cnpj: string;
}

describe('IsCNPJ Decorator', () => {
  it('deve validar com sucesso um CNPJ valido formatado', async () => {
    const model = new TestCnpjModel();
    model.cnpj = '12.345.678/0001-95'; // CNPJ válido real

    const errors = await validate(model);
    expect(errors).toHaveLength(0);
  });

  it('deve validar com sucesso um CNPJ valido apenas com digitos', async () => {
    const model = new TestCnpjModel();
    model.cnpj = '12345678000195'; // CNPJ válido real sem formatação

    const errors = await validate(model);
    expect(errors).toHaveLength(0);
  });

  it('deve falhar para um CNPJ invalido por digito verificador', async () => {
    const model = new TestCnpjModel();
    model.cnpj = '12.345.678/0001-00'; // DVs incorretos

    const errors = await validate(model);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isCNPJ).toBe('CNPJ inválido');
  });

  it('deve falhar para strings com tamanhos incorretos', async () => {
    const model = new TestCnpjModel();
    model.cnpj = '12345';

    const errors = await validate(model);
    expect(errors).toHaveLength(1);
  });

  it('deve falhar para CNPJs com sequencias de numeros iguais', async () => {
    const model = new TestCnpjModel();
    model.cnpj = '11.111.111/1111-11';

    const errors = await validate(model);
    expect(errors).toHaveLength(1);
  });

  it('deve falhar para tipos que nao sejam string', async () => {
    const model = new TestCnpjModel();
    (model as any).cnpj = 12345678000195;

    const errors = await validate(model);
    expect(errors).toHaveLength(1);
  });
});
