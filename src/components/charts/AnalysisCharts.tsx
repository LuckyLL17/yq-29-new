import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type {
  DraftAngleResult,
  WallThicknessResult,
  MoldingCycleResult,
  SectionThicknessSample,
} from '@/types';

interface DraftAngleChartProps {
  result: DraftAngleResult;
}

const COLORS = ['#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4'];

export function DraftAngleChart({ result }: DraftAngleChartProps) {
  const data = result.angleDistribution.map((item) => ({
    name: item.range,
    count: item.count,
    percentage: item.percentage.toFixed(1) + '%',
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ThicknessChartProps {
  result: WallThicknessResult;
}

export function ThicknessChart({ result }: ThicknessChartProps) {
  const data = result.thicknessDistribution.map((item) => ({
    name: item.range,
    count: item.count,
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CyclePieChartProps {
  result: MoldingCycleResult;
}

export function CyclePieChart({ result }: CyclePieChartProps) {
  const data = [
    { name: '吸浆', value: result.suctionTime, color: '#06b6d4' },
    { name: '压制', value: result.pressingTime, color: '#8b5cf6' },
    { name: '干燥', value: result.dryingTime, color: '#f97316' },
    { name: '脱模', value: result.demoldingTime, color: '#22c55e' },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}s`]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SectionThicknessCurveProps {
  samples: SectionThicknessSample[];
  minThickness: number;
  maxThickness: number;
  avgThickness: number;
}

export function SectionThicknessCurve({
  samples,
  minThickness,
  maxThickness,
  avgThickness,
}: SectionThicknessCurveProps) {
  const data = samples
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      position: Number(s.position.toFixed(1)),
      thickness: Number(s.thickness.toFixed(3)),
    }));

  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-content-faint text-xs">
        无壁厚采样数据
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis
            dataKey="position"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            label={{
              value: '截面周长位置 (mm)',
              position: 'insideBottom',
              offset: -2,
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            domain={[minThickness * 0.9, maxThickness * 1.05]}
            label={{
              value: '壁厚',
              angle: -90,
              position: 'insideLeft',
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: 11,
            }}
            formatter={(value: number) => [`${value} mm`, '壁厚']}
            labelFormatter={(label) => `位置: ${label} mm`}
          />
          <ReferenceLine
            y={avgThickness}
            stroke="#f97316"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            label={{
              value: `均值 ${avgThickness.toFixed(2)}`,
              fill: '#f97316',
              fontSize: 10,
              position: 'right',
            }}
          />
          <Line
            type="monotone"
            dataKey="thickness"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ r: 1.5, fill: '#06b6d4' }}
            activeDot={{ r: 4, fill: '#22d3ee' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
