import prisma from "../configs/pool-coonection.config";
import { PromoType } from "../../generated/prisma/enums";

export const promoService = {
  async getAllByEvent(event_id: string) {
    return await prisma.promotions.findMany({
      where: { event_id, deletedAt: null },
      orderBy: { expires_at: "asc" },
    });
  },

  async getAll(organizer_id?: string) {
    return await prisma.promotions.findMany({
      where: {
        deletedAt: null,
        ...(organizer_id ? { event: { users_id: organizer_id, deletedAt: null } } : {}),
      },
      orderBy: { expires_at: "asc" },
      include: { event: { select: { id: true, title: true } } },
    });
  },

  async create(data: {
    event_id: string;
    name: string;
    promotion_code: string;
    type?: PromoType;
    discount_amount: number;
    max_usage?: number;
    expires_at?: string;
  }) {
    return await prisma.promotions.create({
      data: {
        event_id: data.event_id,
        name: data.name,
        promotion_code: data.promotion_code,
        type: data.type ?? PromoType.VOUCHER,
        discount_amount: data.discount_amount,
        max_usage: data.max_usage,
        used_count: 0,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
    });
  },

  async update(
    id: string,
    data: {
      promotion_code?: string;
      discount_amount?: number;
      max_usage?: number;
      expires_at?: string;
    }
  ) {
    return await prisma.promotions.update({
      where: { id },
      data: {
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      },
    });
  },

  async softDelete(id: string) {
    return await prisma.promotions.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
