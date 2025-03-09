/**
 * Calculates the final price to charge customers including platform fees, costs, and shipping
 * @param basePrice - The original price in dollars
 * @returns The final price to charge in dollars
 */
export function calculateFinalPrice(basePrice: number): number {
  // Constants for fee calculations
  const STRIPE_PERCENTAGE = 0.029; // 2.9%
  const STRIPE_FIXED_FEE = 0.30; // $0.30
  const PLATFORM_PERCENTAGE = 0.05; // 5% platform fee
  const SHIPPING_FEE = 1.95; // Standard shipping fee
  const FREE_SHIPPING_THRESHOLD = 30; // Free shipping for orders over $30
  
  // Calculate shipping fee
  const shippingFee = basePrice < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;

  // Calculate cost to pay the store for the product
  const storeCost = basePrice + shippingFee;

  // Take into account the platform fee
  const costBeforeStripe = storeCost * (1 + PLATFORM_PERCENTAGE);

  // Calculate how much we want to charge to get costBeforeStripe after Stripe fees
  const desiredNetAmount = (costBeforeStripe + STRIPE_FIXED_FEE) / (1 - STRIPE_PERCENTAGE);
  
  // Round to 2 decimal places
  return Math.round(desiredNetAmount * 100) / 100;
} 