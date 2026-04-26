import prisma from "../configs/pool-coonection.config";
import { EventCategory, EventStatus } from "../../generated/prisma/enums";

const VALID_STATUSES = Object.values(EventStatus) as string[];
const VALID_CATEGORIES = Object.values(EventCategory) as string[];

export const eventService = {
  async getAll(filters?: {
    category?: string;
    status?: string;
    search?: string;
    location?: string;
    users_id?: string;
    price?: number;
    priceMin?: number;
    priceMax?: number;
    filter?: string;
    type?: string;
    page?: number;
    limit?: number;
    sort?: string; 
  }) {
    const where: any = {
      deletedAt: null,
    };

    if (!filters?.users_id) {
      where.AND = [
        {
          OR: [
            { end_event: null },
            { end_event: { gt: new Date() } }
          ]
        }
      ];
    }

    if (filters?.users_id) {
      where.users_id = filters.users_id;
    }

    // Location filter 
    if (filters?.location) {
      const locations = filters.location.split(',').map(l => l.trim()).filter(Boolean);
      if (locations.length > 0) {
        const locationConditions = {
          OR: locations.map(loc => ({
            location: { contains: loc, mode: "insensitive" }
          }))
        };
        
        if (where.AND) {
          where.AND.push(locationConditions);
        } else {
          where.AND = [locationConditions];
        }
      }
    }

    // Category filter
    if (filters?.category) {
      const categories = filters.category.split(',').map(c => c.trim().toUpperCase()).filter(c => VALID_CATEGORIES.includes(c));
      if (categories.length > 0) {
        if (categories.length === 1) {
          where.category = categories[0] as EventCategory;
        } else {
          where.category = { in: categories as EventCategory[] };
        }
      }
    }

    if (filters?.status && VALID_STATUSES.includes(filters.status)) {
      where.status = filters.status as EventStatus;
    }

    // Search filter
    if (filters?.search) {
      const searchConditions = {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { location: { contains: filters.search, mode: "insensitive" } },
        ]
      };
      
      if (where.AND) {
        where.AND.push(searchConditions);
      } else {
        where.AND = [searchConditions];
      }
    }

    // Price filter
    if (filters?.price === 0) {
      where.price = 0;
    } else if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
      where.price = {};
      if (filters?.priceMin !== undefined) where.price.gte = filters.priceMin;
      if (filters?.priceMax !== undefined) where.price.lte = filters.priceMax;
    }

    // Time filter
    if (filters?.filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.start_event = { gte: today, lt: tomorrow };
    } else if (filters?.filter === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      where.start_event = { gte: today, lt: nextWeek };
    }

    // Type filter (online/offline)
    if (filters?.type === 'online') {
      where.description = { contains: 'online', mode: 'insensitive' };
    }

    // Sorting
    const orderBy: any = {};
    switch (filters?.sort) {
      case 'latest':
        orderBy.createdAt = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // Pagination
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, filters?.limit || 12);
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.events.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const data = await prisma.events.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    // Enrich with organizer rating aggregates (from all completed events)
    const enrichedData = await Promise.all(
      data.map(async (event) => {
        // Get all completed events from this organizer (either status COMPLETED or end_event passed)
        const completedEvents = await prisma.events.findMany({
          where: {
            users_id: event.users_id,
            deletedAt: null,
            OR: [
              { status: EventStatus.COMPLETED },
              { end_event: { lt: new Date() } }
            ]
          },
          select: {
            id: true,
          },
        });

        // Get all reviews from organizer's completed events
        const allReviews = await prisma.reviews.findMany({
          where: {
            event_id: {
              in: completedEvents.map((e) => e.id),
            },
            deletedAt: null,
          },
          select: {
            rating: true,
          },
        });

        const averageRating =
          allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;

        return {
          ...event,
          ratings: {
            average: parseFloat(averageRating.toFixed(1)),
            count: allReviews.length,
          },
        };
      })
    );

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  async getById(id: string) {
    const event = await prisma.events.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        location: true,
        image_url: true,
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

    if (!event) return null;

    if (event.tickets.length === 0) {
      await prisma.tickets.create({
        data: {
          event_id: id,
          type: "REGULAR" as any,
          description: "Tiket " + event.title,
          price: event.price,
          quota: event.total_seats,
          used_ticket: 0,
        },
      });

      return await prisma.events.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          title: true,
          location: true,
          image_url: true,
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
    }

    return event;
  },

  async create(data: {
    users_id: string;
    title: string;
    description?: string;
    category?: EventCategory;
    location?: string;
    image_url?: string | null;
    price: number;
    total_seats: number;
    available_seats: number;
    status?: EventStatus;
    start_time?: string;
    end_time?: string;
    start_event?: string;
    end_event?: string;
  }) {
    const event = await prisma.events.create({
      data: {
        users_id: data.users_id,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        image_url: data.image_url,
        price: data.price,
        total_seats: data.total_seats,
        available_seats: data.available_seats,
        start_time: data.start_time ? new Date(data.start_time) : null,
        end_time: data.end_time ? new Date(data.end_time) : null,
        start_event: data.start_event ? new Date(data.start_event) : null,
        end_event: data.end_event ? new Date(data.end_event) : null,
        status: data.status ?? EventStatus.DRAFT,
      },
    });

    // Create default ticket for this event
    await prisma.tickets.create({
      data: {
        event_id: event.id,
        type: "REGULAR" as any,
        description: "Tiket " + event.title,
        price: data.price,
        quota: data.total_seats,
        used_ticket: 0,
      },
    });

    return event;
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: EventCategory;
      location?: string;
      image_url?: string | null;
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
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        image_url: data.image_url,
        price: data.price,
        total_seats: data.total_seats,
        available_seats: data.available_seats,
        status: data.status,
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

  async trackStat(event_id: string, step: "detail" | "checkout" | "finalized") {
    const increment =
      step === "detail"
        ? { detail_views: { increment: 1 } }
        : step === "checkout"
        ? { checkout_views: { increment: 1 } }
        : { finalized_views: { increment: 1 } };

    return await prisma.eventPerformanceStats.upsert({
      where: { event_id },
      create: {
        event_id,
        detail_views: step === "detail" ? 1 : 0,
        checkout_views: step === "checkout" ? 1 : 0,
        finalized_views: step === "finalized" ? 1 : 0,
      },
      update: increment,
    });
  },

  async getStats(event_id: string) {
    const stats = await prisma.eventPerformanceStats.findUnique({
      where: { event_id },
    });
    return stats ?? { event_id, detail_views: 0, checkout_views: 0, finalized_views: 0 };
  },
};
