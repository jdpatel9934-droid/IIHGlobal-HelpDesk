import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { TicketPriority } from "../../common/enums/ticket-priority.enum";
import { TicketStatus } from "../../common/enums/ticket-status.enum";

@Schema({ _id: true, timestamps: { createdAt: true, updatedAt: false } })
export class TicketComment {
  @Prop({ required: true, trim: true, maxlength: 5000 })
  text: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  author: Types.ObjectId;

  createdAt: Date;
}

export const TicketCommentSchema = SchemaFactory.createForClass(TicketComment);

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({ timestamps: true, versionKey: false })
export class Ticket {
  @Prop({ required: true, trim: true, minlength: 5, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(TicketPriority),
    default: TicketPriority.MEDIUM,
    required: true,
  })
  priority: TicketPriority;

  @Prop({
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN,
    required: true,
  })
  status: TicketStatus;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  assignedTo: Types.ObjectId | null;

  @Prop({ type: [TicketCommentSchema], default: [] })
  comments: TicketComment[];

  createdAt: Date;
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
TicketSchema.index({ title: "text" });
TicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
