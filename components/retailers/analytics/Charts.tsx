/**
 * Chart Components for Retailer Analytics
 * Uses react-native-gifted-charts for visualization
 */

import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    BarChart,
    LineChart,
    PieChart,
} from "react-native-gifted-charts";

const { width } = Dimensions.get("window");
const chartWidth = width - 80; // Account for padding
const compactChartWidth = width - 140; // Smaller width for compact charts in cards (accounts for card padding + section padding)

interface BarChartData {
  value: number;
  label?: string;
  frontColor?: string;
  gradientColor?: string;
}

interface LineChartData {
  value: number;
  label?: string;
}

interface PieChartData {
  value: number;
  color: string;
  text?: string;
}

/**
 * Bar Chart Component
 */
export function AnalyticsBarChart({
  data,
  title,
  height = 200,
  showValues = true,
  barWidth = 40,
  spacing = 20,
  colors = ["#277874", "#FFBE5D", "#8B5CF6", "#10B981"],
  horizontal = false,
}: {
  data: BarChartData[];
  title?: string;
  height?: number;
  showValues?: boolean;
  barWidth?: number;
  spacing?: number;
  colors?: string[];
  horizontal?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const chartData = data.map((item, index) => ({
    value: item.value,
    label: item.label || "",
    frontColor: item.frontColor || colors[index % colors.length],
    gradientColor: item.gradientColor,
    spacing: spacing,
    labelWidth: 60,
    labelTextStyle: { color: "#6B7280", fontSize: 10 },
    topLabelComponent: showValues
      ? () => (
          <Text style={styles.barValue}>{item.value}</Text>
        )
      : undefined,
  }));

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={height}
          barWidth={barWidth}
          spacing={spacing}
          horizontal={horizontal}
          roundedTop
          roundedBottom
          hideRules={false}
          rulesType="solid"
          rulesColor="#F3F4F6"
          xAxisThickness={1}
          yAxisThickness={1}
          yAxisColor="#E5E7EB"
          xAxisColor="#E5E7EB"
          maxValue={yAxisMax}
          noOfSections={4}
          yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
          showVerticalLines={!horizontal}
          verticalLinesColor="#F3F4F6"
          isAnimated
        />
      </View>
    </View>
  );
}

/**
 * Line Chart Component
 */
export function AnalyticsLineChart({
  data,
  title,
  height = 200,
  colors = ["#277874"],
  showDataPoints = true,
  onPress,
}: {
  data: LineChartData[];
  title?: string;
  height?: number;
  colors?: string[];
  showDataPoints?: boolean;
  onPress?: () => void;
}) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  const chartData = data.map((item) => ({
    value: item.value,
    label: item.label || "",
    labelTextStyle: { color: "#6B7280", fontSize: 10 },
  }));

  // Use compact width when inside a card (no title means it's in a card)
  const actualWidth = title ? chartWidth : compactChartWidth;

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={actualWidth}
          height={height}
          spacing={(actualWidth / Math.max(data.length, 1)) * 0.7}
          thickness={3}
          color={colors[0]}
          hideRules={false}
          rulesType="solid"
          rulesColor="#F3F4F6"
          xAxisThickness={1}
          yAxisThickness={1}
          yAxisColor="#E5E7EB"
          xAxisColor="#E5E7EB"
          maxValue={yAxisMax}
          noOfSections={4}
          yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
          dataPointsColor={colors[0]}
          dataPointsRadius={4}
          isAnimated
          curved={data.length > 2}
          onPress={onPress}
        />
      </View>
    </View>
  );
}

/**
 * Multi-Line Chart Component with clickable lines
 * Shows all lines in a single chart view with interactive legend
 */
interface MultiLineData {
  label: string;
  data: LineChartData[];
  color: string;
  key: string;
}

/**
 * Combined Multi-Line Chart Component
 * Uses BarChart as base with multiple overlaid LineCharts for better rendering
 */
export function CombinedMultiLineChart({
  lines,
  title,
  height = 300,
  onLinePress,
  selectedLine,
}: {
  lines: MultiLineData[];
  title?: string;
  height?: number;
  onLinePress?: (key: string) => void;
  selectedLine?: string;
}) {
  if (!lines || lines.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  // Find max value across all lines for unified scale
  const allValues = lines.flatMap((line) => line.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  // Ensure all lines have the same number of data points
  const maxDataLength = Math.max(...lines.map((line) => line.data.length));
  const chartWidth = compactChartWidth - 20; // Account for padding
  const dataPointCount = maxDataLength;
  
  // Calculate spacing for BarChart
  const barSpacing = dataPointCount > 1 ? (chartWidth - 60) / (dataPointCount - 1) : 40;
  // Calculate spacing for LineChart overlay
  const lineSpacing = dataPointCount > 1 ? (chartWidth - 40) / (dataPointCount - 1) : chartWidth;

  // Prepare data for each line
  const preparedLines = lines.map((line) => {
    const chartData = line.data.map((item) => ({
      value: item.value,
      label: item.label || "",
      labelTextStyle: { color: "#6B7280", fontSize: 10 },
    }));

    return {
      ...line,
      chartData,
      isSelected: selectedLine === line.key,
    };
  });

  // Use first line for bars, rest as lines (matching reference image style)
  const barData = preparedLines[0]?.chartData.map((item) => ({
    value: item.value,
    label: item.label || "",
    labelTextStyle: { color: "#6B7280", fontSize: 10 },
    frontColor: "#277874",
    gradientColor: "#7A4FD1",
  })) || [];

  // Prepare line data for remaining metrics
  const lineMetrics = preparedLines.slice(1);

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.combinedChartWrapper}>
        {/* Chart area with BarChart base and overlaid lines */}
        <View style={[styles.chartAreaContainer, { width: chartWidth, height: height }]}>
          {/* Base BarChart with bars and axes */}
          {preparedLines.length > 0 && (
            <View style={[styles.baseChartContainer, { width: chartWidth, height: height }]}>
              <BarChart
                data={barData}
                width={chartWidth}
                height={height}
                spacing={barSpacing}
                barWidth={16}
                initialSpacing={20}
                noOfSections={4}
                maxValue={yAxisMax}
                hideRules={false}
                rulesType="solid"
                rulesColor="#F3F4F6"
                xAxisThickness={1}
                yAxisThickness={1}
                yAxisColor="#E5E7EB"
                xAxisColor="#E5E7EB"
                yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
                frontColor="#277874"
                gradientColor="#7A4FD1"
                roundedTop
                showGradient
                isAnimated={false}
              />
            </View>
          )}

          {/* Overlay line charts for remaining metrics */}
          {lineMetrics.map((line, lineIndex) => {
            const isDimmed = selectedLine && selectedLine !== line.key;
            return (
              <TouchableOpacity
                key={line.key}
                style={[
                  styles.overlayLineContainer,
                  { 
                    width: chartWidth,
                    height: height,
                    opacity: isDimmed ? 0.3 : 1,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => onLinePress?.(line.key)}
              >
                <LineChart
                  data={line.chartData}
                  width={chartWidth}
                  height={height}
                  spacing={lineSpacing}
                  thickness={line.isSelected ? 4 : 3}
                  color={line.color}
                  hideRules={true}
                  rulesType="solid"
                  rulesColor="transparent"
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisColor="transparent"
                  xAxisColor="transparent"
                  maxValue={yAxisMax}
                  noOfSections={0}
                  yAxisTextStyle={{ color: "transparent", fontSize: 1 }}
                  xAxisLabelTextStyle={{ color: "transparent", fontSize: 1 }}
                  dataPointsColor={line.color}
                  dataPointsRadius={line.isSelected ? 6 : 4}
                  isAnimated={true}
                  curved={line.chartData.length > 2}
                  pointerConfig={undefined}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Clickable Legend */}
      <View style={styles.combinedLegendContainer}>
        <Text style={styles.legendTitle}>Tap a line to view details:</Text>
        <View style={styles.legendItems}>
          {preparedLines.map((line) => {
            const isSelected = selectedLine === line.key;
            return (
              <TouchableOpacity
                key={line.key}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected,
                ]}
                onPress={() => onLinePress?.(line.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendBullet,
                    { backgroundColor: line.color },
                    isSelected && styles.legendBulletSelected,
                  ]}
                />
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
      </View>
    </View>
  );
}

export function AnalyticsMultiLineChart({
  lines,
  title,
  height = 250,
  onLinePress,
  selectedLine,
}: {
  lines: MultiLineData[];
  title?: string;
  height?: number;
  onLinePress?: (key: string) => void;
  selectedLine?: string;
}) {
  if (!lines || lines.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  // Find max value across all lines for unified scale
  const allValues = lines.flatMap((line) => line.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  // Create a combined chart by rendering multiple line charts with same scale
  // We'll use a simpler approach: show individual charts in a compact view
  // For now, let's create a unified view showing all trends together
  
  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.multiLineChartWrapper}>
        {/* Render each line as a separate chart component in a unified view */}
        {lines.map((line, index) => {
          const chartData = line.data.map((item) => ({
            value: item.value,
            label: item.label || "",
            labelTextStyle: { color: "#6B7280", fontSize: 9 },
          }));

          const isSelected = selectedLine === line.key;

          return (
            <TouchableOpacity
              key={line.key}
              style={[
                styles.lineChartItem,
                isSelected && styles.lineChartItemSelected,
              ]}
              onPress={() => onLinePress?.(line.key)}
              activeOpacity={0.7}
            >
              <View style={styles.lineChartHeader}>
                <View
                  style={[
                    styles.lineIndicator,
                    { backgroundColor: line.color },
                  ]}
                />
                <Text
                  style={[
                    styles.lineLabel,
                    isSelected && styles.lineLabelSelected,
                  ]}
                >
                  {line.label}
                </Text>
              </View>
              <View style={styles.compactChartWrapper}>
                <LineChart
                  data={chartData}
                  width={chartWidth - 40}
                  height={height / lines.length - 20}
                  spacing={((chartWidth - 40) / Math.max(chartData.length, 1)) * 0.7}
                  thickness={isSelected ? 3 : 2}
                  color={line.color}
                  hideRules={index !== lines.length - 1}
                  rulesType="solid"
                  rulesColor="#F3F4F6"
                  xAxisThickness={index === lines.length - 1 ? 1 : 0}
                  yAxisThickness={0}
                  yAxisColor="transparent"
                  xAxisColor="#E5E7EB"
                  maxValue={yAxisMax}
                  noOfSections={2}
                  yAxisTextStyle={{ color: "transparent", fontSize: 1 }}
                  xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 9 }}
                  dataPointsColor={line.color}
                  dataPointsRadius={isSelected ? 5 : 3}
                  isAnimated
                  curved={chartData.length > 2}
                  areaChart={false}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Clickable Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Tap to view details:</Text>
        <View style={styles.legendItems}>
          {lines.map((line) => {
            const isSelected = selectedLine === line.key;
            return (
              <TouchableOpacity
                key={line.key}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected,
                ]}
                onPress={() => onLinePress?.(line.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendBullet,
                    { backgroundColor: line.color },
                    isSelected && styles.legendBulletSelected,
                  ]}
                />
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
      </View>
    </View>
  );
}

/**
 * Pie Chart Component
 */
export function AnalyticsPieChart({
  data,
  title,
  radius = 80,
  showLegend = true,
}: {
  data: PieChartData[];
  title?: string;
  radius?: number;
  showLegend?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const pieData = data.map((item) => ({
    value: item.value,
    color: item.color,
    text: item.text || `${Math.round((item.value / total) * 100)}%`,
    textColor: "#FFFFFF",
    textFontSize: 12,
  }));

  // Filter out zero values for pie chart
  const validPieData = pieData.filter((item) => item.value > 0);

  if (validPieData.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.pieChartWrapper}>
        <PieChart
          data={validPieData}
          radius={radius}
          textColor="#FFFFFF"
          textSize={12}
          focusOnPress
          showGradient
          sectionAutoFocus
        />
        {showLegend && (
          <View style={styles.legendContainer}>
            {data.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[styles.legendBullet, { backgroundColor: item.color }]}
                />
                <Text style={styles.legendText}>
                  {item.text || `Item ${index + 1}`}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 8,
    overflow: "hidden",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 0,
    overflow: "hidden",
  },
  pieChartWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  emptyChartText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  barValue: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  legendContainer: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  multiLineChartWrapper: {
    gap: 8,
  },
  lineChartItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  lineChartItemSelected: {
    borderColor: "#277874",
    backgroundColor: "#F0FDF4",
  },
  lineChartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  lineIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  lineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  lineLabelSelected: {
    color: "#277874",
    fontWeight: "700",
  },
  compactChartWrapper: {
    alignItems: "center",
  },
  legendTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItemSelected: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  legendBulletSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendTextSelected: {
    fontWeight: "700",
    color: "#111827",
  },
  combinedChartWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  valueLabelsContainer: {
    width: 90,
    justifyContent: "space-between",
    paddingRight: 8,
    paddingVertical: 20,
  },
  valueLabelGroup: {
    gap: 4,
    flex: 1,
    justifyContent: "center",
    width: 90,
  },
  periodLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  valuesList: {
    gap: 3,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  valueColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  valueText: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "500",
  },
  chartAreaContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  baseChartContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
    backgroundColor: "transparent",
  },
  overlayLineContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  combinedLegendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
