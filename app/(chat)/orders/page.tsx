import ShippingAddress from '@/components/shipping-address';

export default function OrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage your orders and shipping preferences
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        <ShippingAddress />
      </div>
    </div>
  );
} 