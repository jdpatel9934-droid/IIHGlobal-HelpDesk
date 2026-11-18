import "reflect-metadata";
import { config } from "dotenv";
import * as bcrypt from "bcryptjs";
import mongoose, { Model } from "mongoose";
import { UserRole } from "../common/enums/user-role.enum";
import { User, UserSchema } from "../users/schemas/user.schema";

config();

interface SeedAccount {
  email: string;
  password: string;
  role: UserRole;
}

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  const accounts: SeedAccount[] = [
    {
      email: requiredEnv("SEED_ADMIN_EMAIL"),
      password: requiredEnv("SEED_ADMIN_PASSWORD"),
      role: UserRole.ADMIN,
    },
    {
      email: requiredEnv("SEED_AGENT_EMAIL"),
      password: requiredEnv("SEED_AGENT_PASSWORD"),
      role: UserRole.AGENT,
    },
    {
      email: requiredEnv("SEED_EMPLOYEE_ONE_EMAIL"),
      password: requiredEnv("SEED_EMPLOYEE_ONE_PASSWORD"),
      role: UserRole.EMPLOYEE,
    },
    {
      email: requiredEnv("SEED_EMPLOYEE_TWO_EMAIL"),
      password: requiredEnv("SEED_EMPLOYEE_TWO_PASSWORD"),
      role: UserRole.EMPLOYEE,
    },
  ];

  const emails = accounts.map(({ email }) => email.toLowerCase());
  if (new Set(emails).size !== emails.length) {
    throw new Error("Seed account email addresses must be unique");
  }
  if (accounts.some(({ password }) => password.length < 6)) {
    throw new Error("Seed account passwords must be at least 6 characters");
  }

  await mongoose.connect(uri);
  try {
    const userModel = mongoose.model<User>("User", UserSchema) as Model<User>;
    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
    if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
      throw new Error("BCRYPT_ROUNDS must be an integer between 10 and 15");
    }

    for (const account of accounts) {
      const email = account.email.toLowerCase();
      const existing = await userModel.findOne({ email }).exec();
      if (existing) {
        existing.role = account.role;
        await existing.save();
        console.log(`Updated role for ${email}`);
        continue;
      }

      await userModel.create({
        email,
        password: await bcrypt.hash(account.password, rounds),
        role: account.role,
      });
      console.log(`Created ${account.role}: ${email}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

void seed().catch((error: unknown) => {
  console.error("Seed failed", error);
  process.exitCode = 1;
});
