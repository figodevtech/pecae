import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validador matemático de CNPJ de acordo com a regra de dígitos verificadores (Módulo 11).
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/[^\d]+/g, '');

  // Valida tamanho
  if (cleaned.length !== 14) return false;

  // Elimina CNPJs conhecidos inválidos
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Valida primeiro dígito verificador
  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  const digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  // Valida segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}

/**
 * Decorator para validação de CNPJ matemático pelo class-validator.
 */
export function IsCNPJ(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCNPJ',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return isValidCNPJ(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'CNPJ inválido (dígitos verificadores incorretos)';
        },
      },
    });
  };
}
