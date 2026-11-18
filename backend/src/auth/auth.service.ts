import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AuthenticatedUser } from "../common/interfaces/authenticated-user.interface";
import { PublicUser, UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(
    dto: SignupDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.usersService.create(
      dto.email,
      await bcrypt.hash(dto.password, this.bcryptRounds),
    );
    return { accessToken: this.createToken(user), user };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const userDocument = await this.usersService.findByEmailForAuth(dto.email);
    const isValid = userDocument
      ? await bcrypt.compare(dto.password, userDocument.password)
      : false;

    if (!userDocument || !isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const user = await this.usersService.findById(userDocument.id);
    return { accessToken: this.createToken(user), user };
  }

  async validateTokenUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByIdForAuth(userId);
    return { userId: user.id, email: user.email, role: user.role };
  }

  private createToken(user: PublicUser): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private get bcryptRounds(): number {
    const rounds = Number(this.config.get("BCRYPT_ROUNDS") ?? 12);
    if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
      throw new Error("BCRYPT_ROUNDS must be an integer between 10 and 15");
    }
    return rounds;
  }
}
