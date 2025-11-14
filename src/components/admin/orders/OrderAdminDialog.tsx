"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderWithUser } from "@/types/types";

type OrderAdminDialogProps = {
  order: OrderWithUser;
  onSubmit: (values: {
    admin_note?: string | null;
    is_taken?: boolean;
  }) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function OrderAdminDialog({
  order,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
}: OrderAdminDialogProps) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const [note, setNote] = useState(order.admin_note ?? "");
  const [isTaken, setIsTaken] = useState(order.is_taken);
  const [submitting, setSubmitting] = useState(false);

  const open = isControlled ? (controlledOpen as boolean) : internalOpen;

  useEffect(() => {
    if (open) {
      setNote(order.admin_note ?? "");
      setIsTaken(order.is_taken);
    }
  }, [open, order.admin_note, order.is_taken]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        admin_note: note.trim().length > 0 ? note : null,
        is_taken: isTaken,
      });
      handleOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await handleSave();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <DialogHeader>
            <DialogTitle className="font-sans">
              Update Order #{order.id}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor={`order-note-${order.id}`}>Admin Notes</Label>
            <Textarea
              id={`order-note-${order.id}`}
              rows={4}
              placeholder="Add pickup notes or reminders..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isTaken}
              onChange={(event) => setIsTaken(event.target.checked)}
            />
            Mark as taken
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
