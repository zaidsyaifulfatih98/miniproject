import prisma from "../configs/pool-coonection.config";
import { TicketType } from "../../generated/prisma/enums";

export const ticketService = {
  async getAll(organizer_id?: string) {
    return await prisma.tickets.findMany({
      where: {
        deletedAt: null,
        ...(organizer_id ? { event: { users_id: organizer_id, deletedAt: null } } : {}),
      },
      orderBy: { type: "asc" },
      include: { event: { select: { id: true, title: true } } },
    });
  },

  async getAllByEvent(event_id: string) {
    return await prisma.tickets.findMany({
      where: { event_id, deletedAt: null },
      orderBy: { type: "asc" },
    });
  },

  async create(data: {
    event_id: string;
    type: TicketType;
    description: string;
    price: number;
    quota: number;
  }) {
    return await prisma.tickets.create({
      data: {
        ...data,
        used_ticket: 0,
      },
    });
  },

  async update(
    id: string,
    data: {
      type?: TicketType;
      description?: string;
      price?: number;
      quota?: number;
    }
  ) {
    return await prisma.tickets.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    return await prisma.tickets.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
