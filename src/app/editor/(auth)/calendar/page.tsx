"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { Calendar as CalendarIcon, Clock, AlertCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

interface CalendarOrder {
  id: number;
  displayId: string;
  title: string;
  deadline: string;
  editorStatus: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export default function EditorCalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch('/api/v2/editor/queue', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to fetch orders');
        toast.error('Failed to load calendar');
        setOrders([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to replace date-fns
  const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getMonthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const getDaysInMonth = (start: Date, end: Date) => {
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };
  const isSameDay = (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() && 
    date1.getMonth() === date2.getMonth() && 
    date1.getDate() === date2.getDate();
  const isSameMonth = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();

  const monthStart = getMonthStart(currentMonth);
  const monthEnd = getMonthEnd(currentMonth);
  const daysInMonth = getDaysInMonth(monthStart, monthEnd);

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => isSameDay(new Date(order.deadline), date));
  };

  const selectedDateOrders = selectedDate ? getOrdersForDate(selectedDate) : [];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      normal: 'bg-blue-500',
      low: 'bg-gray-400',
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order Calendar</h1>
          <p className="text-gray-600 mt-1">View your assigned orders by deadline</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-3 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-3">
                {daysInMonth.map(day => {
                  const dayOrders = getOrdersForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-4 min-h-[80px] border rounded-lg text-left hover:border-[#ff8c42] transition-all
                        ${isSelected ? 'border-[#ff8c42] bg-orange-50' : 'border-gray-200 bg-white'}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {format(day, 'd')}
                      </div>
                      {dayOrders.length > 0 && (
                        <div className="space-y-1">
                          {dayOrders.slice(0, 2).map(order => (
                            <div
                              key={order.id}
                              className={`w-full h-1.5 rounded-full ${getPriorityColor(order.priority)}`}
                            />
                          ))}
                          {dayOrders.length > 2 && (
                            <div className="text-xs text-gray-600">
                              +{dayOrders.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-gray-600">Urgent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span className="text-gray-600">High</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Normal</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gray-400" />
                  <span className="text-gray-600">Low</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Click on a date to view orders</p>
                </div>
              ) : selectedDateOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No orders due on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateOrders.map(order => (
                    <Link
                      key={order.id}
                      href={`/editor/review-v2/${order.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-[#ff8c42] hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900">{order.displayId}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${order.priority === 'urgent' ? 'border-red-500 text-red-700' : ''}`}
                        >
                          {order.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{order.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(order.deadline), 'h:mm a')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
