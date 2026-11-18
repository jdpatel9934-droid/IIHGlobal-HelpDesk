import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { User } from "../users/schemas/user.schema";
import { AddCommentDto } from "./dto/add-comment.dto";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { ListTicketsDto } from "./dto/list-tickets.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { Ticket, TicketDocument } from "./schemas/ticket.schema";

const ticketPopulate = [
  { path: "createdBy", select: "email role" },
  { path: "assignedTo", select: "email role" },
  { path: "comments.author", select: "email role" },
];

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(
    dto: CreateTicketDto,
    user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    const ticket = await this.ticketModel.create({
      ...dto,
      createdBy: new Types.ObjectId(user.userId),
    });
    return ticket.populate(ticketPopulate);
  }

  async findAll(
    query: ListTicketsDto,
    user: AuthenticatedUser,
  ): Promise<{
    data: TicketDocument[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const filter: FilterQuery<Ticket> = {};
    if (user.role === "employee") {
      filter.createdBy = new Types.ObjectId(user.userId);
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) {
      filter.title = { $regex: this.escapeRegex(query.search), $options: "i" };
    }

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate(ticketPopulate)
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<TicketDocument> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    this.assertOwnerOrStaff(ticket, user);
    return ticket.populate(ticketPopulate);
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketStatusDto,
  ): Promise<TicketDocument> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { status: dto.status },
        { new: true, runValidators: true },
      )
      .populate(ticketPopulate)
      .exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    return ticket;
  }

  async assignToSelf(
    id: string,
    user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { assignedTo: new Types.ObjectId(user.userId) },
        { new: true, runValidators: true },
      )
      .populate(ticketPopulate)
      .exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    return ticket;
  }

  async addComment(
    id: string,
    dto: AddCommentDto,
    user: AuthenticatedUser,
  ): Promise<TicketDocument> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    this.assertOwnerOrStaff(ticket, user);
    ticket.comments.push({
      text: dto.text,
      author: new Types.ObjectId(user.userId),
    } as Ticket["comments"][number]);
    await ticket.save();
    return ticket.populate(ticketPopulate);
  }

  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    if (ticket.createdBy.toString() !== user.userId) {
      throw new ForbiddenException("Only the ticket owner can delete it");
    }
    if (ticket.status !== "open") {
      throw new ForbiddenException("Only open tickets can be deleted");
    }
    await ticket.deleteOne();
  }

  private assertOwnerOrStaff(
    ticket: TicketDocument,
    user: AuthenticatedUser,
  ): void {
    if (
      ticket.createdBy.toString() !== user.userId &&
      user.role === "employee"
    ) {
      throw new NotFoundException("Ticket not found");
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
