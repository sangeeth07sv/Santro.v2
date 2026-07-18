"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { claimDelivery, updateDeliveryStatus } from "@/actions/orders";
import { Button } from "@/components/ui/Button";

export function DeliveryActions({
  orderId,
  status,
  canClaim = false,
}: {
  orderId: string;
  status: string;
  canClaim?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const res = await claimDelivery(orderId);
      if (res?.error) toast.error(res.error);
      else toast.success("Order claimed — now out for delivery prep");
    });
  }

  function handleUpdate(next: "out_for_delivery" | "delivered") {
    startTransition(async () => {
      const res = await updateDeliveryStatus(orderId, next);
      if (res?.error) toast.error(res.error);
      else toast.success(`Marked as ${next.replace(/_/g, " ")}`);
    });
  }

  if (canClaim) {
    return (
      <Button onClick={handleClaim} isLoading={isPending} size="sm">
        Claim Delivery
      </Button>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      {status === "shipped" && (
        <Button onClick={() => handleUpdate("out_for_delivery")} isLoading={isPending} size="sm" variant="outline">
          Mark Out for Delivery
        </Button>
      )}
      {status === "out_for_delivery" && (
        <Button onClick={() => handleUpdate("delivered")} isLoading={isPending} size="sm">
          Mark Delivered
        </Button>
      )}
    </div>
  );
}
