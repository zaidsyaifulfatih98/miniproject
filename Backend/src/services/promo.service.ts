import prisma from "../configs/pool-coonection.config";
import { PromoType } from "../../generated/prisma/enums";

export const promoService = {
  async getAllByEvent(event_id: string) {
    return await prisma.promotions.findMany({
      where: { event_id, deletedAt: null },
      orderBy: { expires_at: "asc" },
    });
  },

  async getAll() {
    return await prisma.promotions.findMany({
      where: { deletedAt: null },
      orderBy: { expires_at: "asc" },
      include: { event: { select: { id: true, title: true } } },
    });
  },

  async create(data: {
    event_id: string;
    promotion_code: string;
    discount_amount: number;
    max_usage?: number;
    expires_at?: string;
  }) {
    return await prisma.promotions.create({
      data: {
        ...data,
        type: PromoType.EVENT_VOUCHER,
        used_count: 0,
        discount_amount: data.discount_amount,
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
