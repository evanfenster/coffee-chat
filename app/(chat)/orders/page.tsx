import ShippingAddress from '@/components/shipping-address';
import OrderHistory from '@/components/order-history';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { OrdersHeader } from '@/components/orders-header';

export default function OrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <OrdersHeader />
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