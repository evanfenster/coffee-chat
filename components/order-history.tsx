"use client"

import { useState, useEffect } from "react"
import { Loader2 } from 'lucide-react'
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrderInfo {
  productHandle: string
  productName: string
  price: string
}

interface Order {
  id: string
  userId: string
  stripeCardId: string | null
  stripeSessionId: string
  stripePaymentIntentId: string | null
  status: string
  info: OrderInfo
  webhookUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function OrderHistory() {
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching orders...');
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        throw new Error('Failed to fetch orders')
      }
      
      console.log('Response:', response);
      const data = await response.json()
      console.log('Orders data received:', data);
      
      // Convert the data to the expected format if needed
      const formattedOrders = Array.isArray(data) 
        ? data 
        : Array.isArray(data.purchaseRequests) 
          ? data.purchaseRequests 
          : [];
      
      console.log('Formatted orders:', formattedOrders);
      setOrders([...formattedOrders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order History</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You haven&apos;t placed any orders yet.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.info?.productName || 'Unknown Product'}
                  </TableCell>
                  <TableCell>
                    {order.createdAt ? (
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{format(new Date(order.createdAt), 'h:mm a')}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ) : (
                      'Unknown Date'
                    )}
                  </TableCell>
                  <TableCell>
                    ${order.info?.price || '0.00'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-50 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        order.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'failed' ? 'bg-red-50 text-red-700' :
                        order.status === 'refunded' ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {order.status 
                          ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                          : 'Unknown'
                        }
                      </span>
                      {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 