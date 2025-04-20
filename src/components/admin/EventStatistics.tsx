
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Event {
  id: string;
  title: string;
  event_date: string;
  interestedCount?: number;
  attendeeCount?: number;
}

interface EventStatisticsProps {
  events: Event[];
}

export const EventStatistics = ({ events }: EventStatisticsProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const filterEventsByMonth = (events: Event[], monthDate: string) => {
    const start = startOfMonth(parseISO(monthDate + '-01'));
    const end = endOfMonth(start);
    
    return {
      upcoming: events.filter(event => {
        const eventDate = parseISO(event.event_date);
        return isAfter(eventDate, new Date());
      }),
      past: events.filter(event => {
        const eventDate = parseISO(event.event_date);
        return isBefore(eventDate, new Date());
      })
    };
  };

  const { upcoming, past } = filterEventsByMonth(events, selectedMonth);

  // Calculate total stats for the month
  const totalStats = {
    interested: past.reduce((sum, event) => sum + (event.interestedCount || 0), 0),
    attended: past.reduce((sum, event) => sum + (event.attendeeCount || 0), 0)
  };

  // Generate last 12 months for the dropdown
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Prepare data for the chart
  const chartData = past.map(event => ({
    name: event.title,
    interested: event.interestedCount || 0,
    attended: event.attendeeCount || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Monthly Statistics</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {last12Months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Totals</CardTitle>
            <CardDescription>Statistics for {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{past.length + upcoming.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Past Events</p>
                  <p className="text-2xl font-bold">{past.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Interested</p>
                  <p className="text-2xl font-bold">{totalStats.interested}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Attended</p>
                  <p className="text-2xl font-bold">{totalStats.attended}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {past.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Interest vs Attendance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    label={{ 
                      value: 'Number of People', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="interested" fill="#8884d8" />
                  <Bar dataKey="attended" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>{upcoming.length} events scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Interested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(parseISO(event.event_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{event.interestedCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>{past.length} events completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Interested</TableHead>
                    <TableHead>Attended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {past.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(parseISO(event.event_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{event.interestedCount || 0}</TableCell>
                      <TableCell>{event.attendeeCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
