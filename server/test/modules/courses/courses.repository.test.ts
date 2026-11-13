import type { Database } from '../../../src/database/connection';
import { PgCourseRepository } from '../../../src/modules/courses/courses.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgCourseRepository', () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgCourseRepository(db);
  });

  test('insere name com parâmetro e retorna id e name da linha criada', async () => {
    const course = { id: 7, name: 'Qualidade' };
    query.mockResolvedValue({ rows: [course] });

    await expect(repository.create({ name: 'Qualidade' })).resolves.toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), ['Qualidade']);
    expect(normalizeSql(query.mock.calls[0][0])).toBe(
      'INSERT INTO courses (name) VALUES ($1) RETURNING id, name',
    );
  });

  test('lista id e name com ORDER BY id e sem array de parâmetros', async () => {
    const courses = [{ id: 7, name: 'Qualidade' }, { id: 8, name: 'Programação' }];
    query.mockResolvedValue({ rows: courses });

    await expect(repository.findAll()).resolves.toBe(courses);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String));
    expect(normalizeSql(query.mock.calls[0][0])).toBe('SELECT id, name FROM courses ORDER BY id');
  });

  test('retorna lista vazia quando não há disciplinas', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca pelo ID parametrizado e retorna a primeira linha', async () => {
    const course = { id: 7, name: 'Qualidade' };
    query.mockResolvedValue({ rows: [course, { id: 8, name: 'Programação' }] });

    await expect(repository.findOne(7)).resolves.toBe(course);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), [7]);
    expect(normalizeSql(query.mock.calls[0][0])).toBe('SELECT id, name FROM courses WHERE id = $1');
  });

  test('retorna undefined quando a busca não encontra uma disciplina', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)(
    'propaga a mesma instância de Error do banco em %s', async (method) => {
      const error = new Error('Falha no banco');
      query.mockRejectedValue(error);
      const result = method === 'create'
        ? repository.create({ name: 'Qualidade' })
        : method === 'findAll' ? repository.findAll() : repository.findOne(7);
      await expect(result).rejects.toBe(error);
    },
  );
});
