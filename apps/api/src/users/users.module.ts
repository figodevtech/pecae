import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AdminController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}

