import prisma from "../configs/pool-coonection.config";
import { Roles } from "../../generated/prisma/enums";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const userService = {
  async create(data: {
    full_name: string;
    email: string;
    password: string;
    birth_date: string;
    gender: string;
    address: string;
    role: Roles[];
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const referral_code = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();

    return await prisma.users.create({
      data: {
        ...data,
        birth_date: new Date(data.birth_date),
        password: hashedPassword,
        referral_code,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        birth_date: true,
        gender: true,
        address: true,
        role: true,
        referral_code: true,
        createdAt: true,
      },
    });
  },
  async getAll() {
    return await prisma.users.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        referral_code: true,
        createdAt: true,
      },
    });
  },

  async getById(id: string) {
    return await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        birth_date: true,
        gender: true,
        address: true,
        role: true,
        referral_code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async update(
    id: string,
    data: {
      full_name?: string;
      email?: string;
      birth_date?: Date;
      gender?: string;
      address?: string;
      role?: Roles[];
    }
  ) {
    return await prisma.users.update({
      where: { id },
      data,
      select: {
        id: true,
        full_name: true,
        email: true,
        birth_date: true,
        gender: true,
        address: true,
        role: true,
        referral_code: true,
        updatedAt: true,
      },
    });
  },
  async loginOrganizer(email: string, password: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        full_name: true,
        email: true,
        password: true,
        role: true,
        referral_code: true,
      },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    if (!user.role.includes("ORGANIZER")) {
      throw new Error("Akun ini bukan Organizer");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Email atau password salah");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const { password: _, ...userData } = user;
    return { token, user: userData };
  },
};