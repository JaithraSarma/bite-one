import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Event } from '@/integrations/supabase/types';

interface DeleteConfirmDialogProps {
  event: Event;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DeleteConfirmDialog({
  event,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">"{event.name}"</span>? This action
              cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-100"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
