import prisma from "../configs/pool-coonection.config";
import { PromoType, Roles } from "../../generated/prisma/enums";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const REFERRAL_POINTS = 10_000;
const REFERRAL_DISCOUNT_PCT = 10; // 10 %
const MONTHS_3 = 3;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const userService = {
  async create(data: {
    full_name: string;
    email: string;
    password: string;
    birth_date: string;
    gender: string;
    address: string;
    role: Roles[];
    referral_code_used?: string; // optional referral code entered at registration
  }) {
    const { referral_code_used, ...rest } = data;
    const hashedPassword = await bcrypt.hash(rest.password, 10);
    const newReferralCode = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
    const now = new Date();
    const expiresAt = addMonths(now, MONTHS_3);

    return await prisma.$transaction(async (tx) => {
      // 1. Create the new user
      const newUser = await tx.users.create({
        data: {
          ...rest,
          birth_date: new Date(rest.birth_date),
          password: hashedPassword,
          referral_code: newReferralCode,
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

      // 2. Handle referral code if provided
      if (referral_code_used) {
        const referrer = await tx.users.findUnique({
          where: { referral_code: referral_code_used },
          select: { id: true },
        });

        if (!referrer) {
          throw new Error("Referral code tidak ditemukan");
        }
        if (referrer.id === newUser.id) {
          throw new Error("Tidak bisa menggunakan referral code milik sendiri");
        }

        // 2a. Record the referral relationship
        await tx.referrals.create({
          data: {
            referrer_user_id: referrer.id,
            referred_user_id: newUser.id,
            points_earned: REFERRAL_POINTS,
          },
        });

        // 2b. Award 10.000 points to the referrer
        await tx.users.update({
          where: { id: referrer.id },
          data: { points: { increment: REFERRAL_POINTS } },
        });

        // 2c. Record points history for the referrer (expires in 3 months)
        await tx.pointsHistory.create({
          data: {
            user_id: referrer.id,
            points: REFERRAL_POINTS,
            expires_at: expiresAt,
          },
        });

        // 2d. Create a 10% referral discount coupon for the NEW user
        const couponCode = `REF-${newReferralCode}`;
        await tx.promotions.create({
          data: {
            recipient_user_id: newUser.id,
            name: `Referral Discount 10% – ${newUser.full_name}`,
            type: PromoType.REFERRAL,
            promotion_code: couponCode,
            discount_amount: REFERRAL_DISCOUNT_PCT, // stored as percentage
            max_usage: 1,
            used_count: 0,
            expires_at: expiresAt,
          },
        });
      }

      return newUser;
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
        points: true,
        profile_picture: true,
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
  async login(email: string, password: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        full_name: true,
        email: true,
        password: true,
        role: true,
        referral_code: true,
        profile_picture: true,
      },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Email atau password salah");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = user;
    return { token, user: userData };
  },

  /** Points balance = sum of non-expired, non-consumed PointsHistory records */
  async getAvailablePoints(user_id: string): Promise<number> {
    const result = await prisma.pointsHistory.aggregate({
      where: {
        user_id,
        deletedAt: null,
        expires_at: { gt: new Date() },
      },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  },

  /** Full points history for a user (active + expired/consumed) */
  async getPointsHistory(user_id: string) {
    return await prisma.pointsHistory.findMany({
      where: { user_id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        expires_at: true,
        createdAt: true,
        deletedAt: true,
      },
    });
  },

  /** Referral coupons issued to a user */
  async getMyCoupons(user_id: string) {
    return await prisma.promotions.findMany({
      where: { recipient_user_id: user_id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        promotion_code: true,
        discount_amount: true,
        used_count: true,
        max_usage: true,
        expires_at: true,
        createdAt: true,
      },
    });
  },

  /** Referrals made by a user (who used their code) */
  async getReferralHistory(user_id: string) {
    return await prisma.referrals.findMany({
      where: { referrer_user_id: user_id },
      orderBy: { createdAt: "desc" },
      include: {
        referred: {
          select: { id: true, full_name: true, email: true, createdAt: true },
        },
      },
    });
  },

  /** Change password – validates current password first */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.users.findUnique({ where: { id }, select: { id: true, password: true } });
    if (!user) throw new Error("User tidak ditemukan");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Password lama tidak sesuai");
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({ where: { id }, data: { password: hashed } });
  },

  /** Update profile picture URL */
  async updateProfilePicture(id: string, url: string) {
    return await prisma.users.update({
      where: { id },
      data: { profile_picture: url },
      select: { id: true, profile_picture: true },
    });
  },

  /** Generate a short-lived JWT for password reset and send email */
  async generatePasswordResetToken(email: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, full_name: true, email: true },
    });
    if (!user) throw new Error("Email tidak terdaftar");
    const token = jwt.sign(
      { id: user.id, purpose: "reset_password" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "15m" }
    );
    return { token, user };
  },

  /** Verify reset token and set new password */
  async resetPassword(token: string, newPassword: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
    } catch {
      throw new Error("Token tidak valid atau sudah kadaluarsa");
    }
    if (decoded.purpose !== "reset_password") throw new Error("Token tidak valid");
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({ where: { id: decoded.id }, data: { password: hashed } });
  },
};