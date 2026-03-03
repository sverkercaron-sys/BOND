"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface PulseWeekly {
  week_start: string;
  connection: number;
  communication: number;
  appreciation: number;
  fun: number;
  trust: number;
}

interface PulseChartProps {
  data: PulseWeekly[];
}

const COLORS = {
  connection: "#4A90D9",
  communication: "#2ECC71",
  appreciation: "#E8B931",
  fun: "#E74C3C",
  trust: "#9B59B6",
};

const LABELS = {
  connection: "Närhet",
  communication: "Kommunikation",
  appreciation: "Uppskattning",
  fun: "Lek",
  trust: "Trygghet",
};

export default function PulseChart({ data }: PulseChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    week_label: format(new Date(item.week_start), "d MMM", { locale: sv }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bond-bg-alt p-3 rounded-lg border border-bond-primary">
          <p className="text-sm font-semibold text-bond-text mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {LABELS[entry.dataKey as keyof typeof LABELS]}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96 bg-bond-bg-alt p-4 rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
          <XAxis
            dataKey="week_label"
            stroke="#888888"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            domain={[1, 5]}
            stroke="#888888"
            style={{ fontSize: "12px" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            formatter={(value) => LABELS[value as keyof typeof LABELS]}
          />
          <Line
            type="monotone"
            dataKey="connection"
            stroke={COLORS.connection}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="communication"
            stroke={COLORS.communication}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="appreciation"
            stroke={COLORS.appreciation}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="fun"
            stroke={COLORS.fun}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="trust"
            stroke={COLORS.trust}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
