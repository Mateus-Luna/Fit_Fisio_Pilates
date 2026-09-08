import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FamiliesModule } from './families/families.module';
import { StudentsModule } from './students/students.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { SettingsModule } from './settings/settings.module';
import { DiscountsModule } from './discounts/discounts.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }), PrismaModule, AuthModule, FamiliesModule, StudentsModule, ModalitiesModule, SettingsModule, DiscountsModule,
  EnrollmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
