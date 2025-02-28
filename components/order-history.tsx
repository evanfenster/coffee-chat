"use client"

import { useState, useEffect } from "react"
import { Loader2 } from 'lucide-react'
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Order {
  id: string
  productName: string
  price: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  createdAt: string
  errorDetails?: string | null
}

export default function OrderHistory() {
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders([...data].reverse())
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Order History</h2>
        <p className="text-muted-foreground">No orders found.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Order History</h2>
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
                <TableCell className="font-medium">{order.productName}</TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{order.price}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'failed' ? 'bg-red-100 text-red-700' :
                    order.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  {order.errorDetails && (
                    <p className="text-xs text-destructive mt-1">{order.errorDetails}</p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 