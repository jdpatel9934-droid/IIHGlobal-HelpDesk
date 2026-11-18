import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ParseObjectIdPipe } from "../common/pipes/parse-object-id.pipe";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { PublicUser, UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(":id/role")
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<PublicUser> {
    return this.usersService.updateRole(id, dto.role);
  }
}
