import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const darkTooltipStyle = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  color: '#e2e8f0',
  fontSize: '13px',
};

const AnimatedBarChart = ({
  data,
  bars,
  xKey = 'hour',
  height = 300,
  showGrid = true,
  showLegend = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={className}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          )}
          <XAxis
            dataKey={xKey}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <Tooltip contentStyle={darkTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
            />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.fill}
              radius={bar.radius ?? [4, 4, 0, 0]}
              maxBarSize={bar.maxBarSize ?? 40}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default AnimatedBarChart;
