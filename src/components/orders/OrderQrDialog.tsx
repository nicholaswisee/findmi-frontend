"use client";

import { useEffect, useMemo } from "react";
import QRCode from "react-qr-code";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Order } from "@/types/types";
import { createOrderQrValue } from "@/utils/qrPayload";

type OrderQrDialogProps = {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderQrDialog({
  order,
  open,
  onOpenChange,
}: OrderQrDialogProps) {
  const qrValue = useMemo(() => {
    if (!order) return "";
    return createOrderQrValue(order.id);
  }, [order]);

  useEffect(() => {}, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[90vh] space-y-4 overflow-y-auto sm:max-w-md bg-plain-green">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-[#FFC76E]">
            Tunjukkan QR berikut
          </p>
          {order ? (
            <p className="text-xl font-semibold text-[#FFC76E]">
              Order #{order.id}
            </p>
          ) : null}
        </div>
        <div className="flex justify-center rounded-2xl border bg-white w-full h-full mx-auto p-4">
          {qrValue ? (
            <QRCode
              value={qrValue}
              size={200}
              className="h-auto w-full max-lg:max-w-[min(70vw,240px)]"
            />
          ) : (
            <p className="text-sm text-[#FFC76E]">Tidak ada data QR.</p>
          )}
        </div>
        <div className="space-y-2 text-center text-sm text-[#FFC76E]">
          <p>Tunjukkan kode QR berikut untuk melakukan verifikasi pesanan.</p>
          {/* <Button
            type="button"
            variant="secondary"
            className="w-full gap-2"
            onClick={handleCopyLink}
            disabled={!qrValue}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Kode tersalin
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Salin kode terenkripsi
              </>
            )}
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
