import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import {
  getTotalUsers,
  getTotalEvents,
  getInformationOfficers,
  getStudents,
  demoteUserToStudent,
  promoteStudentToInfoOfficer,
  getAllEvents,
  deleteEvent,
  getRecentVisitors
} from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useAuth } from "@/context/auth";
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminPage = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [infoOfficers, setInfoOfficers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const { user, hasRole } = useAuth();

  const handleDemoteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to demote this user to a student?")) {
      const success = await demoteUserToStudent(userId);
      if (success) {
        alert("User demoted successfully.");
        // Refresh data
        fetchInformationOfficers();
        fetchStudents();
      } else {
        alert("Failed to demote user.");
      }
    }
  };

  const handlePromoteStudent = async (userId: string) => {
    if (window.confirm("Are you sure you want to promote this student to an information officer?")) {
      const success = await promoteStudentToInfoOfficer(userId);
      if (success) {
        alert("Student promoted successfully.");
        // Refresh data
        fetchInformationOfficers();
        fetchStudents();
      } else {
        alert("Failed to promote student.");
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEventId(eventId);
    const success = await deleteEvent(eventId);
    if (success) {
      alert("Event deleted successfully.");
      // Refresh events
      fetchEvents();
    } else {
      alert("Failed to delete event.");
    }
    setDeletingEventId(null);
  };

  const fetchInformationOfficers = async () => {
    const officers = await getInformationOfficers();
    setInfoOfficers(officers);
  };

  const fetchStudents = async () => {
    const studentsData = await getStudents();
    setStudents(studentsData);
  };

  const fetchEvents = async () => {
    const eventsData = await getAllEvents();
    setEvents(eventsData);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersCount = await getTotalUsers();
        setTotalUsers(usersCount);

        const eventsCount = await getTotalEvents();
        setTotalEvents(eventsCount);

        await fetchInformationOfficers();
        await fetchStudents();
        await fetchEvents();

        const visitors = await getRecentVisitors();
        setRecentVisitors(visitors);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !hasRole('admin')) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users, events, and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats cards */}
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>All users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
            <CardDescription>All events in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Information Officers Management */}
        <Card>
          <CardHeader>
            <CardTitle>Information Officers</CardTitle>
            <CardDescription>Manage information officer roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {infoOfficers.map((officer) => (
                  <TableRow key={officer.user_id}>
                    <TableCell>{officer.profiles?.name}</TableCell>
                    <TableCell>{officer.profiles?.email}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDemoteUser(officer.user_id)}>
                        Demote to Student
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Visitors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Visitors</CardTitle>
            <CardDescription>The most recent users who have visited the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisitors.length > 0 ? (
                  recentVisitors.map((visitor, index) => (
                    <TableRow key={`${visitor.user_id}-${index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{visitor.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{visitor.email || 'No email'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {visitor.visit_time ? (
                          <div>
                            <p className="text-sm">{format(new Date(visitor.visit_time), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-gray-500">{format(new Date(visitor.visit_time), 'h:mm a')}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unknown</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                      No recent visitors
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Events Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Events Management</CardTitle>
          <CardDescription>Manage upcoming and past events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deletingEventId === event.id}>
                          {deletingEventId === event.id ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event and remove all related data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students Management</CardTitle>
          <CardDescription>Manage student roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Events Attended</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.user_id}>
                  <TableCell>{student.profiles?.name}</TableCell>
                  <TableCell>{student.profiles?.email}</TableCell>
                  <TableCell>{student.profiles?.events_attended}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => handlePromoteStudent(student.user_id)}>
                      Promote to Info Officer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
