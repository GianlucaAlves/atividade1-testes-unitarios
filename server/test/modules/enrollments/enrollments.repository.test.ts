import type { Database } from '../../../src/database/connection';
import { PgEnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('PgEnrollmentRepository', () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgEnrollmentRepository(db);
  });

  test('insere as chaves parametrizadas e retorna os aliases camelCase e a data', async () => {
    const enrolledAt = new Date('2026-11-13T12:00:00Z');
    const enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValue({ rows: [enrollment] });
    const result = await repository.create(123, 7);

    expect(result).toBe(enrollment);
    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), [123, 7]);
    expect(normalizeSql(query.mock.calls[0][0])).toBe(
      'INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) ' +
      'RETURNING student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"',
    );
  });

  test('lista os aliases camelCase e datas com a ordenação esperada e sem parâmetros', async () => {
    const enrolledAt = new Date('2026-11-13T12:00:00Z');
    const enrollments = [
      { studentRa: 123, courseId: 7, enrolledAt },
      { studentRa: 456, courseId: 8, enrolledAt },
    ];
    query.mockResolvedValue({ rows: enrollments });
    const result = await repository.findAll();

    expect(result).toBe(enrollments);
    expect(result[0]).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String));
    expect(normalizeSql(query.mock.calls[0][0])).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" ' +
      'FROM enrollments ORDER BY student_ra, course_id',
    );
  });

  test('retorna lista vazia quando não há matrículas', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test('busca pelas duas chaves em ordem e retorna a primeira linha com aliases e data', async () => {
    const enrolledAt = new Date('2026-11-13T12:00:00Z');
    const enrollment = { studentRa: 123, courseId: 7, enrolledAt };
    query.mockResolvedValue({ rows: [enrollment, { studentRa: 456, courseId: 8, enrolledAt }] });
    const result = await repository.findOne(123, 7);

    expect(result).toBe(enrollment);
    expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.any(String), [123, 7]);
    expect(normalizeSql(query.mock.calls[0][0])).toBe(
      'SELECT student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt" ' +
      'FROM enrollments WHERE student_ra = $1 AND course_id = $2',
    );
  });

  test('retorna undefined quando a busca não encontra uma matrícula', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test.each(['create', 'findAll', 'findOne'] as const)(
    'propaga a mesma instância de Error do banco em %s', async (method) => {
      const error = new Error('Falha no banco');
      query.mockRejectedValue(error);
      const result = method === 'create'
        ? repository.create(123, 7)
        : method === 'findAll' ? repository.findAll() : repository.findOne(123, 7);
      await expect(result).rejects.toBe(error);
    },
  );
});
