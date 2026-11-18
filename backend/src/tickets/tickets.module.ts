import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RolesGuard } from "../common/guards/roles.guard";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Ticket, TicketSchema } from "./schemas/ticket.schema";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, RolesGuard],
})
export class TicketsModule {}
