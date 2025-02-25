'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';

export function OrdersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarToggle className="bg-background" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage your orders and shipping preferences
          </p>
        </div>
      </div>
    </div>
  );
} 