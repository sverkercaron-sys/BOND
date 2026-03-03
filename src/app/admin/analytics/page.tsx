'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface RegistrationData {
  week: string;
  registrations: number;
}

interface CompletionData {
  date: string;
  rate: number;
}

interface ExerciseData {
  title: string;
  completions: number;
}

interface PulseData {
  date: string;
  averagePulse: number;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [registrationData, setRegistrationData] = useState<RegistrationData[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [pulseData, setPulseData] = useState<PulseData[]>([]);
  const [inviteStats, setInviteStats] = useState({
    totalInvites: 0,
    acceptedInvites: 0,
    pendingInvites: 0,
    acceptanceRate: 0,
  });
  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7days':
        return 7;
      case '30days':
        return 30;
      case '90days':
        return 90;
      case '1year':
        return 365;
      default:
        return 30;
    }
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const days = getDaysFromRange(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Registrations per week
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const registrationsByWeek: Record<string, number> = {};
      users?.forEach((u) => {
        const date = new Date(u.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        registrationsByWeek[weekKey] =
          (registrationsByWeek[weekKey] || 0) + 1;
      });

      setRegistrationData(
        Object.entries(registrationsByWeek)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, count]) => ({
            week: new Date(week).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            }),
            registrations: count,
          }))
      );

      // Completion rate per day
      const { data: completions } = await supabase
        .from('completions')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const completionsByDate: Record<string, number> = {};
      const totalDaysByDate: Record<string, number> = {};

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        completionsByDate[dateStr] = 0;
        totalDaysByDate[dateStr] = 1;
      }

      completions?.forEach((c) => {
        const dateStr = c.created_at.split('T')[0];
        if (completionsByDate[dateStr] !== undefined) {
          completionsByDate[dateStr]++;
        }
      });

      setCompletionData(
        Object.entries(completionsByDate)
          .map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            }),
            rate: Math.min((count / 1000) * 100, 100), // Scaled rate
          }))
          .slice(-14) // Last 14 days
      );

      // Most popular exercises
      const { data: exerciseCompletions } = await supabase
        .from('completions')
        .select('exercise_id, exercises(title)')
        .gte('created_at', startDate.toISOString());

      const exerciseCounts: Record<string, { title: string; count: number }> =
        {};
      exerciseCompletions?.forEach((c: any) => {
        const title = c.exercises?.title || 'Unknown';
        exerciseCounts[title] = {
          title,
          count: (exerciseCounts[title]?.count || 0) + 1,
        };
      });

      setExerciseData(
        Object.values(exerciseCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map((e) => ({
            title: e.title.length > 20 ? e.title.substring(0, 17) + '...' : e.title,
            completions: e.count,
          }))
      );

      // Pulse averages
      const { data: pulseReadings } = await supabase
        .from('pulse_readings')
        .select('created_at, pulse')
        .gte('created_at', startDate.toISOString());

      const pulseByDate: Record<string, number[]> = {};
      pulseReadings?.forEach((p) => {
        const dateStr = p.created_at.split('T')[0];
        if (!pulseByDate[dateStr]) {
          pulseByDate[dateStr] = [];
        }
        pulseByDate[dateStr].push(p.pulse);
      });

      setPulseData(
        Object.entries(pulseByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, pulses]) => ({
            date: new Date(date).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            }),
            averagePulse: Math.round(
              pulses.reduce((a, b) => a + b, 0) / pulses.length
            ),
          }))
          .slice(-30)
      );

      // Invite statistics
      const { count: totalInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true });

      const { count: acceptedInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted');

      const { count: pendingInvites } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const acceptanceRate =
        totalInvites && acceptedInvites
          ? Math.round((acceptedInvites / totalInvites) * 100)
          : 0;

      setInviteStats({
        totalInvites: totalInvites || 0,
        acceptedInvites: acceptedInvites || 0,
        pendingInvites: pendingInvites || 0,
        acceptanceRate,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Laddar analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Detaljerad analys av BOND-plattformen</p>
        </div>

        <div className="w-48">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Senaste 7 dagar</SelectItem>
              <SelectItem value="30days">Senaste 30 dagar</SelectItem>
              <SelectItem value="90days">Senaste 90 dagar</SelectItem>
              <SelectItem value="1year">Senaste året</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invite Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Totalt invitationer
          </div>
          <div className="text-4xl font-bold text-gray-900">
            {inviteStats.totalInvites}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Godkända
          </div>
          <div className="text-4xl font-bold text-green-600">
            {inviteStats.acceptedInvites}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Väntande
          </div>
          <div className="text-4xl font-bold text-orange-500">
            {inviteStats.pendingInvites}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Godkännandetal
          </div>
          <div className="text-4xl font-bold text-blue-600">
            {inviteStats.acceptanceRate}%
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Registreringar per vecka
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="registrations"
                fill="#8b5cf6"
                stroke="#8b5cf6"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Genomförningsgrad per dag
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#ec4899" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Most Popular Exercises */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Mest populära övningar
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={exerciseData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 300, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="title" type="category" width={290} />
            <Tooltip />
            <Bar dataKey="completions" fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Pulse Averages */}
      {pulseData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Genomsnittlig puls över tid
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pulseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="averagePulse" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
