import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserRole } from "../common/enums/user-role.enum";
import { User, UserDocument } from "./schemas/user.schema";

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(email: string, passwordHash: string): Promise<PublicUser> {
    const user = await this.userModel.create({
      email: email.toLowerCase(),
      password: passwordHash,
      role: UserRole.EMPLOYEE,
    });
    return this.toPublicUser(user);
  }

  async findByEmailForAuth(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select("+password")
      .exec();
  }

  async findById(id: string): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("User not found");
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.toPublicUser(user);
  }

  async findByIdForAuth(id: string): Promise<PublicUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new UnauthorizedException("Account is no longer available");
    }
    return this.toPublicUser(user);
  }

  async updateRole(id: string, role: UserRole): Promise<PublicUser> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true, runValidators: true })
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: UserDocument): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
