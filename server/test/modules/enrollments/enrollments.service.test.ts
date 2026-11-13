import type { EnrollmentRepository } from '../../../src/modules/enrollments/enrollments.repository';
import { EnrollmentsService } from '../../../src/modules/enrollments/enrollments.service';

describe('EnrollmentsService', () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new EnrollmentsService(repository);
  });

  test('cria uma matrícula passando RA e ID separadamente e nessa ordem', async () => {
    const enrollment = { studentRa: 123, courseId: 1, enrolledAt: new Date('2026-11-13T12:00:00Z') };
    repository.create.mockResolvedValue(enrollment);
    await expect(service.create({ studentRa: 123, courseId: 1 })).resolves.toBe(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([{ studentRa: 0, courseId: 1 }, { studentRa: 123, courseId: 0 }])(
    'rejeita chave inválida %p com erro 400 sem chamar o repositório', async (input) => {
      await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  test('traduz referência inexistente para erro 404', async () => {
    repository.create.mockRejectedValue({ code: '23503' });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('traduz matrícula duplicada para erro 409', async () => {
    repository.create.mockRejectedValue({ code: '23505' });
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rejeita matrícula inexistente com erro 404 e encaminha os identificadores', async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test('propaga a mesma instância de Error na criação', async () => {
    const error = new Error('Falha inesperada');
    repository.create.mockRejectedValue(error);
    await expect(service.create({ studentRa: 123, courseId: 1 })).rejects.toBe(error);
  });

  test('lista matrículas com uma única chamada sem argumentos', async () => {
    const enrollments = [{ studentRa: 123, courseId: 1, enrolledAt: new Date('2026-11-13T12:00:00Z') }];
    repository.findAll.mockResolvedValue(enrollments);
    await expect(service.findAll()).resolves.toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('retorna matrícula existente com uma única busca pelos dois identificadores', async () => {
    const enrollment = { studentRa: 123, courseId: 1, enrolledAt: new Date('2026-11-13T12:00:00Z') };
    repository.findOne.mockResolvedValue(enrollment);
    await expect(service.findOne(123, 1)).resolves.toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
