import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getDeliveryOrderById } from "@/actions/orders";
import { DeliveryTrackingView } from "@/components/shop/DeliveryTrackingView";

export const metadata = { title: "Delivery tracking" };

export default async function DeliveryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) redirect(`/login?redirect=/delivery/orders/${id}`);

  const role = auth.profile?.role;
  if (role !== "delivery_partner" && role !== "admin") redirect("/dashboard/delivery");

  const order = await getDeliveryOrderById(id);
  if (!order) notFound();

  return <DeliveryTrackingView order={order} />;
}
