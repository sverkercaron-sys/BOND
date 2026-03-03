'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface KPIData {
  totalUsers: number;
  activeCouples: number;
  pendingInvites: number;
  averageStreak: number;
}

interface ChartData {
  date: string;
  completions: number;
}

interface RegistrationData {
  date: string;
  count: number;
}

interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  streak: number;
  user1: { email: string };
  user2: { email: string };
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [kpiData, setKpiData] = useState<KPIData>({
    totalUsers: 0,
    activeCouples: 0,
    pendingInvites: 0,
    averageStreak: 0,
  });
  const [completionData, setCompletionData] = useState<ChartData[]>([]);
  const [registrationData, setRegistrationData] = useState<RegistrationData[]>([]);
  const [topCouples, setTopCouples] = useState<Couple[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch KPI data
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        const { count: coupleCount } = await supabase
          .from('couples')
          .select('*', { count: 'exact', head: true })
          .not('user2_id', 'is', null);

        const { count: inviteCount } = await supabase
          .from('invites')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { data: streakData } = await supabase
          .from('couples')
          .select('streak')
          .not('user2_id', 'is', null);

        const averageStreak =
          streakData && streakData.length > 0
            ? Math.round(
                streakData.reduce((sum, c) => sum + (c.streak || 0), 0) /
                  streakData.length
              )
            : 0;

        setKpiData({
          totalUsers: userCount || 0,
          activeCouples: coupleCount || 0,
          pendingInvites: inviteCount || 0,
          averageStreak,
        });

        // Fetch completion rate data (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: completions } = await supabase
          .from('completions')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        const completionsByDate: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          completionsByDate[dateStr] = 0;
        }

        completions?.forEach((c) => {
          const dateStr = c.created_at.split('T')[0];
          completionsByDate[dateStr] = (completionsByDate[dateStr] || 0) + 1;
        });

        setCompletionData(
          Object.entries(completionsByDate).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            }),
            completions: count,
          }))
        );

        // Fetch registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: registrations } = await supabase
          .from('users')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString());

        const registrationsByDate: Record<string, number> = {};
        registrations?.forEach((u) => {
          const dateStr = u.created_at.split('T')[0];
          registrationsByDate[dateStr] =
            (registrationsByDate[dateStr] || 0) + 1;
        });

        setRegistrationData(
          Object.entries(registrationsByDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, count]) => ({
              date: new Date(date).toLocaleDateString('sv-SE', {
                month: 'short',
                day: 'numeric',
              }),
              count,
            }))
        );

        // Fetch top couples by streak
        const { data: couples } = await supabase
          .from('couples')
          .select(
            `
            id,
            user1_id,
            user2_id,
            streak,
            user1:user1_id(email),
            user2:user2_id(email)
          `
          )
          .not('user2_id', 'is', null)
          .order('streak', { ascending: false })
          .limit(10);

        setTopCouples(couples || []);

        // Fetch recent users
        const { data: users } = await supabase
          .from('users')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        setRecentUsers(users || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Överblick över BOND-plattformen</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Totalt antal användare
          </div>
          <div className="text-4xl font-bold text-gray-900">
            {kpiData.totalUsers}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Aktiva par
          </div>
          <div className="text-4xl font-bold text-primary">
            {kpiData.activeCouples}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Väntande invites
          </div>
          <div className="text-4xl font-bold text-orange-500">
            {kpiData.pendingInvites}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-gray-600 text-sm font-medium mb-2">
            Genomsnittlig streak
          </div>
          <div className="text-4xl font-bold text-green-600">
            {kpiData.averageStreak}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Genomförda övningar (senaste 7 dagar)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completions" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nya registreringar (senaste 30 dagar)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Couples */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 par efter streak
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Användare 1
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Användare 2
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {topCouples.map((couple, index) => (
                <tr key={couple.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">
                    {couple.user1?.email}
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {couple.user2?.email}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="default">{couple.streak} dagar</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Users */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Senaste registreringar
        </h2>
        <div className="space-y-3">
          {recentUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
