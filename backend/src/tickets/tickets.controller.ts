import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { ParseObjectIdPipe } from "../common/pipes/parse-object-id.pipe";
import { AddCommentDto } from "./dto/add-comment.dto";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { ListTicketsDto } from "./dto/list-tickets.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { TicketDocument } from "./schemas/ticket.schema";
import { TicketsService } from "./tickets.service";

@Controller("tickets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    return this.ticketsService.create(dto, user);
  }

  @Get()
  findAll(
    @Query() query: ListTicketsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    return this.ticketsService.findOne(id, user);
  }

  @Patch(":id/status")
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  updateStatus(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<TicketDocument> {
    return this.ticketsService.updateStatus(id, dto);
  }

  @Patch(":id/assign-to-me")
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  assignToSelf(
    @Param("id", ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    return this.ticketsService.assignToSelf(id, user);
  }

  @Post(":id/comments")
  addComment(
    @Param("id", ParseObjectIdPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    return this.ticketsService.addComment(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id", ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.ticketsService.delete(id, user);
  }
}
