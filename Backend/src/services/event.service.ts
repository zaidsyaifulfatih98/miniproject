import prisma from "../configs/pool-coonection.config";
import { EventCategory, EventStatus } from "../../generated/prisma/enums";

const VALID_STATUSES = Object.values(EventStatus) as string[];
const VALID_CATEGORIES = Object.values(EventCategory) as string[];

export const eventService = {
  async getAll(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.category) {
      const categoryUpper = filters.category.toUpperCase();
      if (VALID_CATEGORIES.includes(categoryUpper)) {
        where.category = categoryUpper as EventCategory;
      }
    }
    if (filters?.status && VALID_STATUSES.includes(filters.status)) {
      where.status = filters.status as EventStatus;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.events.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        start_event: true,
        end_event: true,
        start_time: true,
        end_time: true,
        total_seats: true,
        available_seats: true,
        description: true,
        category: true,
        status: true,
        price: true,
        createdAt: true,
      },
    });
  },

  async getById(id: string) {
    return await prisma.events.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        location: true,
        start_event: true,
        end_event: true,
        start_time: true,
        end_time: true,
        total_seats: true,
        available_seats: true,
        description: true,
        category: true,
        status: true,
        price: true,
        organizer: { select: { id: true, full_name: true, email: true } },
        tickets: { where: { deletedAt: null } },
        createdAt: true,
      },
    });
  },

  async create(data: {
    users_id: string;
    title: string;
    description?: string;
    category?: EventCategory;
    location?: string;
    price: number;
    total_seats: number;
    available_seats: number;
    status?: EventStatus;
    start_time?: string;
    end_time?: string;
    start_event?: string;
    end_event?: string;
  }) {
    return await prisma.events.create({
      data: {
        ...data,
        price: data.price,
        start_time: data.start_time ? new Date(data.start_time) : null,
        end_time: data.end_time ? new Date(data.end_time) : null,
        start_event: data.start_event ? new Date(data.start_event) : null,
        end_event: data.end_event ? new Date(data.end_event) : null,
        status: data.status ?? EventStatus.DRAFT,
      },
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: EventCategory;
      location?: string;
      price?: number;
      total_seats?: number;
      available_seats?: number;
      status?: EventStatus;
      start_time?: string;
      end_time?: string;
      start_event?: string;
      end_event?: string;
    }
  ) {
    return await prisma.events.update({
      where: { id },
      data: {
        ...data,
        start_time: data.start_time ? new Date(data.start_time) : undefined,
        end_time: data.end_time ? new Date(data.end_time) : undefined,
        start_event: data.start_event ? new Date(data.start_event) : undefined,
        end_event: data.end_event ? new Date(data.end_event) : undefined,
      },
    });
  },

  async softDelete(id: string) {
    return await prisma.events.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
