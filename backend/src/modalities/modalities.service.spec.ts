import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from '@jest/globals';

import { PrismaService } from '../prisma/prisma.service';
import { ModalitiesService } from './modalities.service';

describe('ModalitiesService', () => {
  let service: ModalitiesService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModalitiesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ModalitiesService>(ModalitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});