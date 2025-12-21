import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, {
    Defs,
    G,
    Line,
    LinearGradient,
    Path,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  value: number;
  label: string;
  pointLabel?: string;
  pointData?: {
    type: 'promotion' | 'product';
    data: any;
  };
}

interface LineData {
  key: string;
  label: string;
  color: string;
  data: DataPoint[];
  chartType?: 'bar' | 'line';
}

interface Props {
  lines: LineData[];
  height?: number;
  width?: number;
  onLinePress?: (key: string) => void;
  selectedLine?: string;
  onPointLabelPress?: (
    pointData: { type: 'promotion' | 'product'; data: any } | undefined,
    date: string
  ) => void;
}

export const CombinedLineBarChart: React.FC<Props> = ({
  lines,
  height = 100,
  width: customWidth,
  onLinePress,
  selectedLine,
  onPointLabelPress,
}) => {
  const chartHeight = height - 160;
  const padding = 30;
  const graphHeight = chartHeight - padding * 2;

  const allValues = lines.flatMap(l => l.data.map(d => d.value));
  const maxValue = Math.max(...allValues, 1);
  const yScale = graphHeight / maxValue;

  const dataPointCount = lines[0]?.data.length || 1;
  const availableWidth = screenWidth - 105;
  const optimalSpacing = dataPointCount <= 8 ? 50 : dataPointCount <= 12 ? 40 : 35;
  const calculatedWidth = dataPointCount * optimalSpacing + padding * 2;
  const chartWidth = customWidth ?? Math.max(availableWidth, calculatedWidth);
  const graphWidth = chartWidth - padding * 2;
  // Fix: Ensure xStep is never 0, even for single data point
  const xStep = dataPointCount > 1 ? graphWidth / (dataPointCount - 1) : graphWidth;

  const barGroupWidth = Math.min(xStep * 0.7, 22);
  const barWidth = barGroupWidth / lines.length;

  /* ---------------- Bars ---------------- */

  const renderBars = () => {
    const barLines = lines.filter(l => l.chartType !== 'line');
    if (!barLines.length) return null;

    const bars: React.JSX.Element[] = [];
    barLines.forEach((line, lineIndex) => {
      line.data.forEach((point, pointIndex) => {
        const barHeight = Math.max(0, point.value * yScale);
        // Fix: Ensure minimum bar height for visibility (at least 2px)
        if (barHeight < 2 && point.value > 0) {
          // If value > 0 but bar is too small, set minimum height
          const minBarHeight = 2;
          const adjustedY = padding + graphHeight - minBarHeight;
          const x = dataPointCount === 1
            ? padding + graphWidth / 2 - barGroupWidth / 2 + lineIndex * barWidth
            : padding + pointIndex * xStep - barGroupWidth / 2 + lineIndex * barWidth;
          
          bars.push(
            <Rect
              key={`bar-${line.key}-${pointIndex}`}
              x={x}
              y={adjustedY}
              width={barWidth}
              height={minBarHeight}
              rx={4}
              ry={4}
              fill={`url(#bar-${line.key})`}
              opacity={isSelected ? 1 : 0.65}
              onPress={() => onLinePress?.(line.key)}
            />
          );
          return;
        }
        if (!barHeight) return;

        // Fix: Handle single data point positioning
        const x = dataPointCount === 1
          ? padding + graphWidth / 2 - barGroupWidth / 2 + lineIndex * barWidth
          : padding + pointIndex * xStep - barGroupWidth / 2 + lineIndex * barWidth;

        const y = padding + graphHeight - barHeight;
        const isSelected = selectedLine === line.key;

        bars.push(
          <Rect
            key={`bar-${line.key}-${pointIndex}`}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={4}
            ry={4}
            fill={`url(#bar-${line.key})`}
            opacity={isSelected ? 1 : 0.65}
            onPress={() => onLinePress?.(line.key)}
          />
        );
      });
    });
    return bars;
  };

  /* ---------------- Lines ---------------- */

  const generateSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const tension = 0.25;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const renderLines = () => {
    const lineData = lines.filter(l => l.chartType === 'line');

    return lineData.map(line => {
      const points = line.data.map((p, i) => ({
        x: padding + i * xStep,
        y: padding + graphHeight - p.value * yScale,
      }));

      const isSelected = selectedLine === line.key;

      return (
        <G key={line.key}>
          {isSelected && (
            <Path
              d={generateSmoothPath(points)}
              stroke={line.color}
              strokeWidth={6}
              opacity={0.15}
              fill="none"
            />
          )}
          <Path
            d={generateSmoothPath(points)}
            stroke={line.color}
            strokeWidth={isSelected ? 3 : 2}
            opacity={isSelected ? 1 : selectedLine ? 0.25 : 0.7}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            onPress={() => onLinePress?.(line.key)}
          />
        </G>
      );
    });
  };

  const yAxisTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxValue / 4) * i)
  );

  return (
    <View>
      <View style={styles.legend}>
        {lines.map(line => {
          const isSelected = selectedLine === line.key;
          return (
            <TouchableOpacity
              key={line.key}
              style={[
                styles.legendItem,
                isSelected && styles.legendItemSelected,
              ]}
              onPress={() => onLinePress?.(line.key)}
            >
              <View style={[styles.legendColor, { backgroundColor: line.color }]} />
              <Text style={[styles.legendText, isSelected && styles.legendTextSelected]}>
                {line.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            {lines.map(line => (
              <LinearGradient
                key={line.key}
                id={`bar-${line.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0%" stopColor={line.color} stopOpacity="0.95" />
                <Stop offset="100%" stopColor={line.color} stopOpacity="0.65" />
              </LinearGradient>
            ))}
          </Defs>

          {yAxisTicks.map((tick, i) => {
            const y = padding + graphHeight - (tick / maxValue) * graphHeight;
            return (
              <G key={i}>
                <Line
                  x1={padding}
                  x2={chartWidth - padding}
                  y1={y}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={padding - 10}
                  y={y + 4}
                  fontSize={10}
                  fill="#6B7280"
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}

          {renderBars()}
          {renderLines()}

          {lines[0]?.data.map((p, i) => {
            // Fix: Handle single data point positioning for x-axis labels
            const xPosition = dataPointCount === 1
              ? padding + graphWidth / 2
              : padding + i * xStep;
            
            return (
              <SvgText
                key={`xaxis-label-${i}-${p.label}`}
                x={xPosition}
                y={padding + graphHeight + 24}
                fontSize={10}
                fill="#374151"
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendItemSelected: {
    borderColor: '#277874',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
  legendTextSelected: {
    color: '#111827',
    fontWeight: '700',
  },
});
