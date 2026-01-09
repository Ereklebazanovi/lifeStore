# Inventory Rollback System

This document explains the automatic inventory rollback system implemented to solve the phantom inventory deduction problem where abandoned orders permanently reduce stock without actual sales.

## Problem Overview

When users start the checkout process, inventory is immediately decremented to prevent overselling. However, if users abandon the payment process, this inventory was never restored, leading to phantom sold items that reduce available stock permanently.

## Solution: Timeout-Based Inventory Rollback

Based on Gemini AI recommendations, we implemented a timeout-based cleanup system that automatically cancels abandoned orders and restores inventory after 30 minutes.

### Components

#### 1. Order Cancellation Service
**File**: `src/services/orderService.ts`

- **`cancelOrder(orderId, reason)`**: Cancels an order and restores inventory
- Validates order exists and is in pending status
- Creates atomic transaction to update order status and restore inventory
- Logs all operations for debugging

#### 2. OrderFailedPage Enhancement
**File**: `src/pages/OrderFailedPage.tsx`

- Updated to handle both manual failures and automatic redirects
- Supports order ID from URL path or query parameters
- Provides user-friendly interface with retry options
- Displays order details and contact information

#### 3. Automatic Cleanup Function
**File**: `api/cleanup/expired-orders.ts`

- Serverless function that runs every 10 minutes via Vercel cron
- Finds orders older than 30 minutes with pending payment status
- Automatically cancels orders and restores inventory
- Processes orders in batches (50 at a time) for performance
- Includes comprehensive logging and error handling

#### 4. Payment Flow Updates
**File**: `api/payment/create.ts`

- Added `fail_url` parameter to redirect failed payments to OrderFailedPage
- Includes order ID in the fail_url for proper order lookup
- Maintains backward compatibility with existing signature format

#### 5. Cron Configuration
**File**: `vercel.json`

- Configured Vercel cron to run cleanup every 10 minutes
- Uses `*/10 * * * *` schedule (every 10 minutes)
- Automatic execution without manual intervention

### Environment Variables

Add these to your environment:

```bash
# Optional: Custom cleanup token for manual triggers
CLEANUP_SECRET_TOKEN=your-secret-token-here

# Optional: Custom fail URL (defaults to https://lifestore.ge/order-failed)
FLITT_FAIL_URL=https://lifestore.ge/order-failed
```

### Manual Testing

#### Test Manual Cleanup Trigger:
```bash
curl -X POST https://lifestore.ge/api/cleanup/trigger \
  -H "Content-Type: application/json"
```

#### Test Direct Cleanup:
```bash
curl -X POST https://lifestore.ge/api/cleanup/expired-orders \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json"
```

### Flow Diagram

```
1. User starts checkout → Inventory decremented
2. User reaches payment page
3. Two scenarios:

   A. Payment Success:
      → Order marked as paid
      → Inventory remains decremented (legitimate sale)

   B. Payment Abandoned/Failed:
      → After 30 minutes: Automatic cleanup runs
      → Order marked as cancelled
      → Inventory restored
      → User can retry payment from OrderFailedPage
```

### Implementation Details

#### Order Status Flow:
- `pending` → Order created, inventory decremented, awaiting payment
- `paid` → Payment successful, order confirmed
- `cancelled` → Payment failed/abandoned, inventory restored

#### Cleanup Logic:
1. Find orders where `paymentStatus === 'pending'` and `createdAt <= 30 minutes ago`
2. For each expired order:
   - Update order status to 'cancelled'
   - Add cancellation reason and timestamp
   - Restore inventory for each item in the order
   - Log all operations

#### Error Handling:
- Batch processing prevents one failed order from blocking others
- Comprehensive logging for debugging
- Graceful error handling with detailed error messages
- Atomic transactions ensure data consistency

### Security Features

- Cron jobs authenticated via Vercel's `vercel-cron` header
- Manual triggers require secret token authorization
- Input validation on all API endpoints
- Proper CORS configuration

### Performance Considerations

- Batch processing (50 orders per run) prevents timeout
- Runs every 10 minutes to balance responsiveness with server load
- Uses Firestore batch operations for atomic updates
- Efficient queries with proper indexing

### Monitoring

Monitor the cleanup system by checking:
1. Vercel function logs for cron execution
2. Application console for cleanup operations
3. Database for cancelled orders and inventory changes

### Future Improvements

Consider these enhancements:
1. Add metrics dashboard for cleanup statistics
2. Implement variable timeout based on payment method
3. Add customer notifications for cancelled orders
4. Create admin panel for monitoring expired orders

## Testing Scenarios

### Scenario 1: Normal Abandoned Order
1. Create order → inventory decrements
2. Wait 30 minutes
3. Cleanup runs → order cancelled, inventory restored

### Scenario 2: Payment Failure
1. User reaches payment page
2. Payment fails → redirected to OrderFailedPage with order ID
3. User can retry payment or contact support

### Scenario 3: Partial Inventory Issue
1. Multiple orders for same product
2. Some payments succeed, others fail
3. Only failed orders have inventory restored

This system ensures inventory accuracy while maintaining a smooth user experience for both successful and failed payments.