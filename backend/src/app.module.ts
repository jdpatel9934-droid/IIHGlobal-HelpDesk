import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { TicketsModule } from "./tickets/tickets.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: parseJwtExpiration(
            config.get<string>("JWT_EXPIRES_IN") ?? "1h",
          ),
        },
      }),
    }),
    UsersModule,
    AuthModule,
    TicketsModule,
  ],
})
export class AppModule {}

function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const uri = environment.MONGODB_URI;
  const secret = environment.JWT_SECRET;
  const jwtExpiresIn = environment.JWT_EXPIRES_IN ?? "1h";
  const frontendOrigins =
    environment.FRONTEND_ORIGINS ?? "http://localhost:5173";
  const rounds = Number(environment.BCRYPT_ROUNDS ?? 12);
  const port = Number(environment.PORT ?? 3000);
  const errors: string[] = [];

  if (typeof uri !== "string" || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    errors.push("MONGODB_URI must be a MongoDB connection string");
  }
  if (typeof secret !== "string" || secret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters");
  }
  if (
    typeof jwtExpiresIn !== "string" ||
    !/^[1-9]\d*[smhd]$/.test(jwtExpiresIn)
  ) {
    errors.push("JWT_EXPIRES_IN must be a positive duration such as 30m or 1h");
  }
  if (
    typeof frontendOrigins !== "string" ||
    frontendOrigins
      .split(",")
      .some((origin) => !/^https?:\/\/[^,\s/]+(?::\d+)?$/.test(origin.trim()))
  ) {
    errors.push(
      "FRONTEND_ORIGINS must be a comma-separated list of HTTP(S) origins",
    );
  }
  if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
    errors.push("BCRYPT_ROUNDS must be an integer between 10 and 15");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("PORT must be an integer between 1 and 65535");
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration: ${errors.join("; ")}`);
  }
  return environment;
}

function parseJwtExpiration(value: string): number {
  const match = /^([1-9]\d*)([smhd])$/.exec(value);
  if (!match) {
    throw new Error("JWT_EXPIRES_IN must be a positive duration");
  }

  const unitsInSeconds: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const seconds = Number(match[1]) * unitsInSeconds[match[2]];
  if (!Number.isSafeInteger(seconds) || seconds > 31_536_000) {
    throw new Error("JWT_EXPIRES_IN cannot exceed one year");
  }
  return seconds;
}
