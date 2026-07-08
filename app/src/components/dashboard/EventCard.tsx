import { Calendar, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Event, EventStatus } from '@/integrations/supabase/types';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const STATUS_STYLES: Record<EventStatus, string> = {
  Planning: 'bg-amber-100 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_DOT: Record<EventStatus, string> = {
  Planning: 'bg-amber-500',
  Confirmed: 'bg-blue-500',
  Completed: 'bg-green-500',
};

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const status = event.status as EventStatus;
  const formattedDate = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
            {event.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_STYLES[status]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(event)}
            className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 text-xs font-semibold"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(event)}
            className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
