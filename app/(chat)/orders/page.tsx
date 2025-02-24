import ShippingAddress from '@/components/shipping-address';
import OrderHistory from '@/components/order-history';

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
      <div className="grid gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <ShippingAddress />
        </div>
        <OrderHistory />
      </div>
    </div>
  );
} 