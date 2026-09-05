import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const modalities = [
    {
      name: 'Academia',
      monthlyPrice: 0,
      requiresClass: false,
      capacity: null,
    },
    {
      name: 'Hidroginástica',
      monthlyPrice: 0,
      requiresClass: true,
      capacity: 8,
    },
    {
      name: 'Hidroterapia',
      monthlyPrice: 0,
      requiresClass: true,
      capacity: 5,
    },
    {
      name: 'Natação Adulto',
      monthlyPrice: 0,
      requiresClass: true,
      capacity: 8,
    },
    {
      name: 'Natação Criança',
      monthlyPrice: 0,
      requiresClass: true,
      capacity: 8,
    },
    {
      name: 'Pilates',
      monthlyPrice: 0,
      requiresClass: false,
      capacity: null,
    },
    {
      name: 'Fisioterapia',
      monthlyPrice: 0,
      requiresClass: false,
      capacity: null,
    },
  ];

  for (const modality of modalities) {
    await prisma.modality.upsert({
      where: {
        name: modality.name,
      },
      update: {},
      create: {
        name: modality.name,
        monthlyPrice: modality.monthlyPrice,
        requiresClass: modality.requiresClass,
        capacity: modality.capacity,
      },
    });
  }

  console.log('Modalidades criadas com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });