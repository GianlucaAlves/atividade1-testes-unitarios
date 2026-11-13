import type { CourseRepository } from '../../../src/modules/courses/courses.repository';
import { CoursesService } from '../../../src/modules/courses/courses.service';

describe('CoursesService', () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new CoursesService(repository);
  });

  test('cria uma disciplina e chama o repositório uma única vez com os dados', async () => {
    const course = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValue(course);

    await expect(service.create({ name: 'Qualidade' })).resolves.toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });

  test.each([null, {}, { name: 'A' }])(
    'rejeita a criação com %p com erro 400 sem chamar o repositório', async (input) => {
      await expect(service.create(input)).rejects.toMatchObject({ statusCode: 400 });
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  test('traduz nome duplicado para erro 409', async () => {
    repository.create.mockRejectedValue({ code: '23505' });
    await expect(service.create({ name: 'Qualidade' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('lista as disciplinas predefinidas pelo stub com uma chamada', async () => {
    const courses = [{ id: 1, name: 'Qualidade' }];
    // Stub: fornece uma resposta conhecida; o mock registra a interação.
    repository.findAll.mockResolvedValue(courses);

    await expect(service.findAll()).resolves.toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test('retorna a disciplina existente e encaminha o identificador 123', async () => {
    const course = { id: 123, name: 'Qualidade' };
    repository.findOne.mockResolvedValue(course);

    await expect(service.findOne(123)).resolves.toBe(course);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test('rejeita disciplina inexistente com erro 404', async () => {
    repository.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test('rejeita identificador zero com erro 400 sem consultar o repositório', async () => {
    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test.each(['create', 'findAll', 'findOne'] as const)(
    'propaga a mesma instância de Error em %s', async (method) => {
      const error = new Error('Falha inesperada');
      repository[method].mockRejectedValue(error);

      const result = method === 'create'
        ? service.create({ name: 'Qualidade' })
        : method === 'findAll' ? service.findAll() : service.findOne(123);

      await expect(result).rejects.toBe(error);
    },
  );

  test('observa findOne de um stub assíncrono com jest.spyOn', async () => {
    const course = { id: 1, name: 'Qualidade' };
    const stub: CourseRepository = {
      async create() { return course; },
      async findAll() { return [course]; },
      async findOne() { return course; },
    };
    const spy = jest.spyOn(stub, 'findOne');
    const serviceWithStub = new CoursesService(stub);

    await expect(serviceWithStub.findOne(1)).resolves.toBe(course);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  test('encaminha somente name ao repositório quando recebe campos extras', async () => {
    const course = { id: 1, name: 'Qualidade' };
    repository.create.mockResolvedValue(course);

    await expect(service.create({ name: 'Qualidade', extra: true })).resolves.toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: 'Qualidade' });
  });
});
