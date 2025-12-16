import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface DataPoint {
  value: number;
  label: string;
  pointLabel?: string; // Optional contextual label for the data point
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
  chartType?: 'bar' | 'line'; // Specify which chart type to use for this metric
}

interface Props {
  lines: LineData[];
  height?: number;
  onLinePress?: (key: string) => void;
  selectedLine?: string;
  onPointLabelPress?: (pointData: { type: 'promotion' | 'product'; data: any } | undefined, date: string) => void;
}

export const CombinedLineBarChart: React.FC<Props> = ({
  lines,
  height = 100,
  onLinePress,
  selectedLine,
  onPointLabelPress,
}) => {
  const chartHeight = height - 160;
  const padding = 30;
  const graphHeight = chartHeight - padding * 2;

  const maxValue = Math.max(
    ...lines.flatMap(line => line.data.map(d => d.value))
  );
  const yScale = graphHeight / maxValue;
  const dataPointCount = lines[0]?.data.length || 1;
  
  // Calculate minimum width needed for all data points
  const minPointSpacing = 25; // Minimum spacing between points for readability
  const minChartWidth = Math.max(width - 72, dataPointCount * minPointSpacing + padding * 2);
  const graphWidth = minChartWidth - padding * 2;
  const xStep = dataPointCount > 1 ? graphWidth / (dataPointCount - 1) : 0;
  
  const barGroupWidth = Math.min(xStep * 0.7, 20); // Cap bar width for many data points
  const barWidth = barGroupWidth / lines.length;

  const renderBars = () => {
    // Only render bars for metrics that should use bar charts
    const barLines = lines.filter(line => line.chartType === 'bar' || !line.chartType);
    if (barLines.length === 0) return null;
    
    return barLines.map((line, lineIndex) => {
      return line.data.map((point, pointIndex) => {
        // Only render bars for points with value > 0
        if (point.value <= 0) return null;
        
        const barHeight = point.value * yScale;
        // Center bars when there are fewer bar lines
        const totalBarWidth = barGroupWidth * (barLines.length / lines.length);
        const x = padding + pointIndex * xStep - totalBarWidth / 2 + lineIndex * barWidth;
        const y = padding + graphHeight - barHeight;
        
        const isSelected = selectedLine === line.key;
        
        return (
          <Rect
            key={`bar-${line.key}-${pointIndex}`}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={line.color}
            opacity={isSelected ? 1 : 0.7}
            onPress={() => onLinePress?.(line.key)}
          />
        );
      });
    });
  };

  const renderLines = () => {
    // Only render lines for metrics that should use line charts
    const lineOnlyLines = lines.filter(line => line.chartType === 'line');
    if (lineOnlyLines.length === 0) return null;
    
    return lineOnlyLines.map((line) => {
      const linePoints = line.data.map((point, index) => ({
        x: padding + index * xStep,
        y: padding + graphHeight - point.value * yScale,
        value: point.value,
      }));

      const linePath = linePoints
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

      const isSelected = selectedLine === line.key;

      return (
        <G key={`line-${line.key}`}>
          <Path
            d={linePath}
            fill="none"
            stroke={line.color}
            strokeWidth={isSelected ? 3 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isSelected ? 1 : 0.8}
            onPress={() => onLinePress?.(line.key)}
          />
          {linePoints.map((point, i) => (
            <Circle
              key={`point-${line.key}-${i}`}
              cx={point.x}
              cy={point.y}
              r={isSelected ? 5 : 4}
              fill={line.color}
              stroke="white"
              strokeWidth="2"
              onPress={() => onLinePress?.(line.key)}
            />
          ))}
        </G>
      );
    });
  };

  const getYAxisTicks = () => {
    const tickCount = 5;
    const step = Math.ceil(maxValue / (tickCount - 1) / 10) * 10;
    return Array.from({ length: tickCount }, (_, i) => i * step);
  };

  const yAxisTicks = getYAxisTicks();

  return (
    <View>
      <View style={styles.legend}>
        {lines.map((line) => {
          const isSelected = selectedLine === line.key;
          const chartType = line.chartType || 'bar';
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
              <Text
                style={[
                  styles.legendText,
                  isSelected && styles.legendTextSelected,
                ]}
              >
                {line.label}
              </Text>
              
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ paddingRight: 10 }}
        style={styles.chartScrollView}
      >
        <Svg width={minChartWidth} height={chartHeight}>
        {yAxisTicks.map((tick, i) => {
          const y = padding + graphHeight - (tick / maxValue) * graphHeight;
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={padding}
                y1={y}
                x2={minChartWidth - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="2"
              />
              <SvgText
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill="#6B7280"
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </G>
          );
        })}

        <Line
          x1={padding}
          y1={padding + graphHeight}
          x2={minChartWidth - padding}
          y2={padding + graphHeight}
          stroke="#374151"
          strokeWidth="2"
        />
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + graphHeight}
          stroke="#374151"
          strokeWidth="0"
        />

        {renderBars()}
        {renderLines()}

        {/* Render point labels above data points */}
        {lines.map((line) => {
          return line.data.map((point, i) => {
            if (!point.pointLabel) return null;
            
            // Only show labels for the selected line when a legend is pressed
            if (selectedLine && line.key !== selectedLine) return null;
            
            const pointValue = point.value;
            const pointY = padding + graphHeight - pointValue * yScale;
            const labelY = Math.max(padding - 5, pointY - 20); // Position above point, but not above chart
            
            // Calculate label width based on text length
            const labelWidth = Math.min(point.pointLabel.length * 5 + 10, 80);
            const isClickable = point.pointData && onPointLabelPress;
            
            return (
              <G 
                key={`point-label-${line.key}-${i}`}
                onPress={isClickable && point.pointData ? () => {
                  onPointLabelPress(point.pointData, point.label);
                } : undefined}
              >
                {/* Background rectangle for label */}
                <Rect
                  x={padding + i * xStep - labelWidth / 2}
                  y={labelY - 8}
                  width={labelWidth}
                  height={16}
                  fill="#FFFFFF"
                  stroke={line.color}
                  strokeWidth={isClickable ? "2" : "1"}
                  rx="4"
                  opacity={isClickable ? "1" : "0.95"}
                />
                {/* Label text */}
                <SvgText
                  x={padding + i * xStep}
                  y={labelY + 4}
                  fontSize="8"
                  fill={line.color}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {point.pointLabel}
                </SvgText>
              </G>
            );
          });
        })}

        {lines[0].data.map((point, i) => {
          const fontSize = dataPointCount > 8 ? 9 : 11;
          const labelY = padding + graphHeight + (dataPointCount > 8 ? 20 : 25);
          return (
            <SvgText
              key={`label-${i}`}
              x={padding + i * xStep}
              y={labelY}
              fontSize={fontSize}
              fill="#374151"
              textAnchor="middle"
              fontWeight="500"
            >
              {point.label}
            </SvgText>
          );
        })}
        </Svg>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chartScrollView: {
    marginHorizontal: 1, // Offset card padding for full-width scroll
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: -8,
    gap: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendItemSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#277874',
    borderWidth: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 6,
  },
  legendTextSelected: {
    color: '#111827',
    fontWeight: '700',
  },
});
