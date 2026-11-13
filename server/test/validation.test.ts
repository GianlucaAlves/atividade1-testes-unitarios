import { HttpError } from '../src/errors';
import { parseId, positiveInteger, validateBody, validateName } from '../src/validation';

function expectBadRequest(action: () => unknown) {
  expect(action).toThrow(HttpError);
  expect(action).toThrow(expect.objectContaining({ statusCode: 400 }));
}

describe('positiveInteger', () => {
  test.each([1, 2147483647])('retorna o inteiro válido %p', (value) => {
    expect(positiveInteger(value, 'RA')).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, '123', null, undefined])(
    'rejeita %p com HttpError 400', (value) => {
      expectBadRequest(() => positiveInteger(value, 'RA'));
    },
  );
});

describe('parseId', () => {
  test.each([['1', 1], ['2147483647', 2147483647]])(
    'converte %p para %p', (value, expected) => {
      expect(parseId(value, 'RA')).toBe(expected);
    },
  );

  test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])(
    'rejeita %p com HttpError 400', (value) => {
      expectBadRequest(() => parseId(value, 'RA'));
    },
  );
});

describe('validateName', () => {
  test.each(['Ana', 'a'.repeat(100)])('retorna o nome válido %p', (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(['', 'ab', '   ', ' a ', 'a'.repeat(101), 123, null, undefined])(
    'rejeita %p com HttpError 400', (value) => {
      expectBadRequest(() => validateName(value));
    },
  );
});

describe('validateBody', () => {
  test('retorna a mesma referência de um objeto congelado sem modificá-lo', () => {
    const body = Object.freeze({ name: 'Ana' });
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: 'Ana' });
  });

  test.each([null, undefined, [], 'Ana', 12].map((value) => [value]))(
    'rejeita %p com HttpError 400', (value) => {
      expectBadRequest(() => validateBody(value));
    },
  );

  test('aceita campos extras e preserva a referência e o conteúdo', () => {
    const body = { name: 'Ana', extra: true };
    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: 'Ana', extra: true });
  });
});
