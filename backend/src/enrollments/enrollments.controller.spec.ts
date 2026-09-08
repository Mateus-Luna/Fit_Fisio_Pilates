import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;

  const service = {
    create: jest.fn<(...args: any[]) => any>(),
    findAll: jest.fn<(...args: any[]) => any>(),
    findOne: jest.fn<(...args: any[]) => any>(),
    update: jest.fn<(...args: any[]) => any>(),
    requestApproval: jest.fn<(...args: any[]) => any>(),
    approve: jest.fn<(...args: any[]) => any>(),
    suspend: jest.fn<(...args: any[]) => any>(),
    reactivate: jest.fn<(...args: any[]) => any>(),
    cancel: jest.fn<(...args: any[]) => any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: service,
        },
      ],
    }).compile();

    controller =
      module.get<EnrollmentsController>(
        EnrollmentsController,
      );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an enrollment', async () => {
    const dto = {
      studentId: 'student-1',
      modalityId: 'modality-1',
      startDate: '2026-09-07T00:00:00.000Z',
    };

    const enrollment = { id: 'enrollment-1' };

    service.create.mockResolvedValue(enrollment);

    await expect(controller.create(dto)).resolves.toEqual(
      enrollment,
    );

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all enrollments', async () => {
    const enrollments = [{ id: '1' }];

    service.findAll.mockResolvedValue(enrollments);

    await expect(controller.findAll()).resolves.toEqual(
      enrollments,
    );
  });

  it('should find one enrollment', async () => {
    const enrollment = { id: 'enrollment-1' };

    service.findOne.mockResolvedValue(enrollment);

    await expect(
      controller.findOne('enrollment-1'),
    ).resolves.toEqual(enrollment);

    expect(service.findOne).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });

  it('should update an enrollment', async () => {
    const dto = {
      discountPercentage: 20,
    };

    const enrollment = { id: 'enrollment-1' };

    service.update.mockResolvedValue(enrollment);

    await expect(
      controller.update('enrollment-1', dto),
    ).resolves.toEqual(enrollment);

    expect(service.update).toHaveBeenCalledWith(
      'enrollment-1',
      dto,
    );
  });

  it('should request approval', async () => {
    service.requestApproval.mockResolvedValue({
      id: 'enrollment-1',
    });

    await controller.requestApproval('enrollment-1');

    expect(
      service.requestApproval,
    ).toHaveBeenCalledWith('enrollment-1');
  });

  it('should approve an enrollment', async () => {
    service.approve.mockResolvedValue({
      id: 'enrollment-1',
    });

    await controller.approve('enrollment-1');

    expect(service.approve).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });

  it('should suspend an enrollment', async () => {
    service.suspend.mockResolvedValue({
      id: 'enrollment-1',
    });

    await controller.suspend('enrollment-1');

    expect(service.suspend).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });

  it('should reactivate an enrollment', async () => {
    service.reactivate.mockResolvedValue({
      id: 'enrollment-1',
    });

    await controller.reactivate('enrollment-1');

    expect(service.reactivate).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });

  it('should cancel an enrollment', async () => {
    service.cancel.mockResolvedValue({
      id: 'enrollment-1',
    });

    await controller.cancel('enrollment-1');

    expect(service.cancel).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });
});

