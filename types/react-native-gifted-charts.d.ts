declare module 'react-native-gifted-charts' {
  import { Component } from 'react';
    import { TextStyle, ViewStyle } from 'react-native';

  export interface BarChartData {
    value: number;
    label?: string;
    frontColor?: string;
    gradientColor?: string;
    spacing?: number;
    labelWidth?: number;
    labelTextStyle?: TextStyle;
    topLabelComponent?: () => React.ReactElement;
    topLabelContainerStyle?: ViewStyle;
    showGradient?: boolean;
    gradientColor?: string;
    isAnimated?: boolean;
    animationDuration?: number;
    barWidth?: number;
    barBorderRadius?: number;
    roundedTop?: boolean;
    roundedBottom?: boolean;
    hideRules?: boolean;
    rulesType?: 'solid' | 'dashed';
    rulesColor?: string;
    rulesThickness?: number;
    xAxisThickness?: number;
    yAxisThickness?: number;
    xAxisColor?: string;
    yAxisColor?: string;
    xAxisLabelTextStyle?: TextStyle;
    yAxisTextStyle?: TextStyle;
    maxValue?: number;
    noOfSections?: number;
    initialSpacing?: number;
    spacing?: number;
  }

  export interface LineChartData {
    value: number;
    label?: string;
    labelTextStyle?: TextStyle;
    dataPointText?: string;
    textShiftX?: number;
    textShiftY?: number;
    textColor?: string;
    textFontSize?: number;
    hideDataPoint?: boolean;
    dataPointColor?: string;
    dataPointRadius?: number;
    dataPointWidth?: number;
    dataPointHeight?: number;
    stripColor?: string;
    stripOpacity?: number;
    stripWidth?: number;
    stripHeight?: number;
  }

  export interface PieChartData {
    value: number;
    color: string;
    text?: string;
    textColor?: string;
    textSize?: number;
    shiftX?: number;
    shiftY?: number;
    gradientCenterColor?: string;
    focused?: boolean;
  }

  export interface BarChartProps {
    data: BarChartData[];
    width?: number;
    height?: number;
    spacing?: number;
    barWidth?: number;
    initialSpacing?: number;
    noOfSections?: number;
    maxValue?: number;
    hideRules?: boolean;
    rulesType?: 'solid' | 'dashed';
    rulesColor?: string;
    xAxisThickness?: number;
    yAxisThickness?: number;
    xAxisColor?: string;
    yAxisColor?: string;
    xAxisLabelTextStyle?: TextStyle;
    yAxisTextStyle?: TextStyle;
    frontColor?: string;
    gradientColor?: string;
    showGradient?: boolean;
    isAnimated?: boolean;
    animationDuration?: number;
    roundedTop?: boolean;
    roundedBottom?: boolean;
    barBorderRadius?: number;
    horizontal?: boolean;
    showVerticalLines?: boolean;
    verticalLinesColor?: string;
    style?: ViewStyle;
  }

  export interface LineChartProps {
    data: LineChartData[];
    width?: number;
    height?: number;
    thickness?: number;
    color?: string;
    hideDataPoints?: boolean;
    dataPointsColor?: string;
    dataPointsRadius?: number;
    textColor?: string;
    textFontSize?: number;
    textShiftX?: number;
    textShiftY?: number;
    areaChart?: boolean;
    startFillColor?: string;
    endFillColor?: string;
    startOpacity?: number;
    endOpacity?: number;
    initialSpacing?: number;
    spacing?: number;
    hideRules?: boolean;
    rulesType?: 'solid' | 'dashed';
    rulesColor?: string;
    rulesThickness?: number;
    xAxisThickness?: number;
    yAxisThickness?: number;
    xAxisColor?: string;
    yAxisColor?: string;
    xAxisLabelTextStyle?: TextStyle;
    yAxisTextStyle?: TextStyle;
    maxValue?: number;
    noOfSections?: number;
    isAnimated?: boolean;
    curved?: boolean;
    onPress?: () => void;
    pointerConfig?: any;
    style?: ViewStyle;
  }

  export interface PieChartProps {
    data: PieChartData[];
    radius?: number;
    innerRadius?: number;
    innerCircleColor?: string;
    innerCircleBorderWidth?: number;
    innerCircleBorderColor?: string;
    centerLabelComponent?: () => React.ReactElement;
    focusOnPress?: boolean;
    onPress?: (item: PieChartData, index: number) => void;
    donut?: boolean;
    showGradient?: boolean;
    gradientCenterColor?: string;
    textColor?: string;
    textSize?: number;
    sectionAutoFocus?: boolean;
    style?: ViewStyle;
  }

  export class BarChart extends Component<BarChartProps> {}
  export class LineChart extends Component<LineChartProps> {}
  export class PieChart extends Component<PieChartProps> {}
}
