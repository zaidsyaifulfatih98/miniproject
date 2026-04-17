import ticketTemplateHtml from './ticketPDF.html?raw';

export interface TicketData {
  ticket_code: string;
  event_title: string;
  event_location?: string;
  eventStartDate?: Date;
  purchase_date: string;
  ticket_type?: string;
  ticket_price?: number;
  status: string;
  id: string;
}

const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  return date.toLocaleDateString('id-ID', {
    weekday: format === 'short' ? 'short' : 'long',
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderTemplate = (templateHtml: string, data: TicketData): string => {
  const eventDate = new Date(data.eventStartDate || data.purchase_date);
  const purchaseDate = new Date(data.purchase_date);
  const generatedDate = new Date();

  const replacements: Record<string, string> = {
    '{{TICKET_CODE}}': data.ticket_code,
    '{{EVENT_TITLE}}': data.event_title,
    '{{EVENT_LOCATION}}': data.event_location || 'TBA',
    '{{EVENT_DATE}}': formatDate(eventDate, 'short'),
    '{{EVENT_TIME}}': formatTime(eventDate),
    '{{TICKET_TYPE}}': data.ticket_type || 'Regular',
    '{{TICKET_PRICE}}': data.ticket_price?.toLocaleString('id-ID') || '-',
    '{{TICKET_STATUS}}': data.status === 'active' ? 'AKTIF' : data.status.toUpperCase(),
    '{{TICKET_ID}}': data.id,
    '{{PURCHASE_DATE}}': formatDate(purchaseDate, 'short'),
    '{{GENERATED_DATE}}': formatDate(generatedDate, 'short'),
    '{{GENERATED_TIME}}': formatTime(generatedDate),
  };

  let html = templateHtml;
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replaceAll(key, value);
  });

  return html;
};

export const loadAndRenderTicketTemplate = async (
  data: TicketData
): Promise<string> => {
  try {
    if (!ticketTemplateHtml.trim()) {
      throw new Error('Template file is empty');
    }
    return renderTemplate(ticketTemplateHtml, data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`[ticketRenderer] ${error.message}`);
    }
    throw error;
  }
};
