import type { StudentRepository } from '../../../src/modules/students/students.repository';
import { StudentsService } from '../../../src/modules/students/students.service';

describe('StudentsService', () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new StudentsService(repository);
  });

  test('cria um aluno e encaminha RA e nome ao repositório', async () => {
    const student = { ra: 123, name: 'Ana' };
    repository.create.mockResolvedValue(student);

    await expect(service.create({ ra: 123, name: 'Ana' })).resolves.toBe(student);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: 'Ana' });
  });

  test('rejeita RA zero com erro 400 sem chamar o repositório', async () => {
    await expect(service.create({ ra: 0, name: 'Ana' })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('traduz RA duplicado para erro 409', async () => {
    repository.create.mockRejectedValue({ code: '23505' });
    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rejeita aluno inexistente com erro 404', async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test('propaga a mesma instância de Error na criação', async () => {
    const error = new Error('Falha inesperada');
    repository.create.mockRejectedValue(error);
    await expect(service.create({ ra: 123, name: 'Ana' })).rejects.toBe(error);
  });

  test('lista os alunos com uma única chamada sem argumentos', async () => {
    const students = [{ ra: 123, name: 'Ana' }, { ra: 456, name: 'Bruno' }];
    repository.findAll.mockResolvedValue(students);

    await expect(service.findAll()).resolves.toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('retorna o aluno existente com uma única busca pelo RA 123', async () => {
    const student = { ra: 123, name: 'Ana' };
    repository.findOne.mockResolvedValue(student);

    await expect(service.findOne(123)).resolves.toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
