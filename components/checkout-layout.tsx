import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EmbeddedCheckoutDialog } from './embedded-checkout';
import { CoffeeProduct } from '@/lib/coffee/coffee-fetcher';

interface CheckoutLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  product?: CoffeeProduct;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

export function CheckoutLayout({
  children,
  footer,
  product,
  checkoutOpen,
  setCheckoutOpen
}: CheckoutLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Main Content Area with smooth animation */}
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1] // Smooth easing function
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </div>

      {/* Embedded Checkout */}
      {checkoutOpen && product && (
        <div className="mt-6 px-6 pb-6">
          <EmbeddedCheckoutDialog
            product={product}
            onClose={() => setCheckoutOpen(false)}
          />
        </div>
      )}

      {/* Footer with refined styling */}
      {footer && (
        <div className="border-t border-border bg-background/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
} 