'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityDay, VolumeWeek } from '@/lib/admin-stats';

// Admin console charts. Thin wrappers over the same recharts setup the
// member progress charts use.
export function AdminActivityChart({ days }: { days: ActivityDay[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Activity - last {days.length} days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sessions" fill="hsl(22 92% 49%)" name="Sessions" />
              <Bar dataKey="enrollments" fill="#6096c6" name="Enrollments" />
              <Bar dataKey="payments" fill="#35C759" name="Payments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminUserCharts({ weeks, unit }: { weeks: VolumeWeek[]; unit: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Training - last {weeks.length} weeks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeks} margin={{ top: 4, right: 0, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="sessions" fill="hsl(22 92% 49%)" name="Days trained" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#6096c6"
                dot={false}
                name={`Volume (${unit})`}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
