import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) {}
     async create(createSettingDto: CreateSettingDto) {
        const existingSetting =
        await this.prisma.systemSettings.findUnique({
            where: {
            key: createSettingDto.key,
            },
        });

        if (existingSetting) {
        throw new ConflictException(
            'Já existe uma configuração com essa chave.',
        );
        }

        return this.prisma.systemSettings.create({
        data: {
            key: createSettingDto.key,
            value: createSettingDto.value,
            description: createSettingDto.description,
        },
        });
    }

    async findAll() {
        return this.prisma.systemSettings.findMany({
        orderBy: {
            key: 'asc',
        },
        });
    }

    async findOne(key: string) {
        const setting =
        await this.prisma.systemSettings.findUnique({
            where: {
            key,
            },
        });

        if (!setting) {
        throw new NotFoundException(
            'Configuração não encontrada.',
        );
        }

        return setting;
    }

    async update(
        key: string,
        updateSettingDto: UpdateSettingDto,
    ) {
        await this.findOne(key);

        return this.prisma.systemSettings.update({
        where: {
            key,
        },
        data: {
            ...(updateSettingDto.value !== undefined && {
            value: updateSettingDto.value,
            }),

            ...(updateSettingDto.description !== undefined && {
            description: updateSettingDto.description,
            }),
        },
        });
    }

    async remove(key: string) {
        await this.findOne(key);

        return this.prisma.systemSettings.delete({
        where: {
            key,
        },
        });
    }
}
