import type { Database } from '../../../src/database/connection';
import { PgStudentRepository } from '../../../src/modules/students/students.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgStudentRepository', () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgStudentRepository(db);
  });

  test('insere RA e nome com parâmetros em ordem e retorna a linha criada', async () => {
    const student = { ra: 123, name: 'Ana' };
    query.mockResolvedValue({ rows: [student] });
    await expect(repository.create({ ra: 123, name: 'Ana' })).resolves.toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), [123, 'Ana']);
    expect(normalizeSql(query.mock.calls[0][0])).toBe(
      'INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name',
    );
  });

  test('lista RA e nome com ORDER BY name e sem array de parâmetros', async () => {
    const students = [{ ra: 123, name: 'Ana' }, { ra: 456, name: 'Bruno' }];
    query.mockResolvedValue({ rows: students });
    await expect(repository.findAll()).resolves.toBe(students);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String));
    expect(normalizeSql(query.mock.calls[0][0])).toBe('SELECT ra, name FROM students ORDER BY name');
  });

  test('retorna lista vazia quando não há alunos', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca pelo RA parametrizado e retorna a primeira linha', async () => {
    const student = { ra: 123, name: 'Ana' };
    query.mockResolvedValue({ rows: [student, { ra: 456, name: 'Bruno' }] });
    await expect(repository.findOne(123)).resolves.toBe(student);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), [123]);
    expect(normalizeSql(query.mock.calls[0][0])).toBe('SELECT ra, name FROM students WHERE ra = $1');
  });

  test('retorna undefined quando a busca não encontra um aluno', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)(
    'propaga a mesma instância de Error do banco em %s', async (method) => {
      const error = new Error('Falha no banco');
      query.mockRejectedValue(error);
      const result = method === 'create'
        ? repository.create({ ra: 123, name: 'Ana' })
        : method === 'findAll' ? repository.findAll() : repository.findOne(123);
      await expect(result).rejects.toBe(error);
    },
  );
});
