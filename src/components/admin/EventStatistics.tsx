import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TopRatedEvents } from './TopRatedEvents';

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
  const [filteredEvents, setFilteredEvents] = useState<{
    upcoming: Event[];
    past: Event[];
    all: Event[];
  }>({ upcoming: [], past: [], all: [] });

  useEffect(() => {
    const filterEventsByMonth = (eventsToFilter: Event[], monthDate: string) => {
      const start = startOfMonth(parseISO(monthDate + '-01'));
      const end = endOfMonth(start);
      const currentDate = new Date();
      
      const eventsInSelectedMonth = eventsToFilter.filter(event => {
        const eventDate = parseISO(event.event_date);
        return isWithinInterval(eventDate, { start, end });
      });
      
      return {
        upcoming: eventsInSelectedMonth.filter(event => {
          const eventDate = parseISO(event.event_date);
          return isAfter(eventDate, currentDate);
        }),
        past: eventsInSelectedMonth.filter(event => {
          const eventDate = parseISO(event.event_date);
          return isBefore(eventDate, currentDate);
        }),
        all: eventsInSelectedMonth
      };
    };

    setFilteredEvents(filterEventsByMonth(events, selectedMonth));
  }, [selectedMonth, events]);

  const totalStats = {
    interested: filteredEvents.past.reduce((sum, event) => sum + (event.interestedCount || 0), 0),
    attended: filteredEvents.past.reduce((sum, event) => sum + (event.attendeeCount || 0), 0)
  };

  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  const chartData = filteredEvents.past.map(event => ({
    name: event.title,
    interested: event.interestedCount || 0,
    attended: event.attendeeCount || 0
  }));

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Monthly Statistics</h2>
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
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
                  <p className="text-2xl font-bold">{filteredEvents.all.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Past Events</p>
                  <p className="text-2xl font-bold">{filteredEvents.past.length}</p>
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

        {filteredEvents.past.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Interest vs Attendance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(70 * chartData.length, 200)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 20, left: 30, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    label={{
                      value: 'Number of People',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="interested" fill="#8884d8" />
                  <Bar dataKey="attended" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>No past events in this month to display</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
              No data available for the selected month
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopRatedEvents events={events} />
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>{filteredEvents.upcoming.length} events scheduled</CardDescription>
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
                  {filteredEvents.upcoming.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(parseISO(event.event_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{event.interestedCount || 0}</TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.upcoming.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No upcoming events for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>{filteredEvents.past.length} events completed</CardDescription>
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
                  {filteredEvents.past.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(parseISO(event.event_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{event.interestedCount || 0}</TableCell>
                      <TableCell>{event.attendeeCount || 0}</TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.past.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No past events for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
