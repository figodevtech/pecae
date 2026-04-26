import { Controller, Post, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { UserService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/casl/casl-ability.factory';
import { Action } from '../auth/casl/action.enum';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Post(':id/role')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, 'all'))
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const updatedUser = await this.userService.update(id, {
      type: updateRoleDto.role,
    });

    return {
      message: `Role do usuário atualizada para ${updateRoleDto.role}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        type: updatedUser.type,
      },
    };
  }
}
