import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AdminController, UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
