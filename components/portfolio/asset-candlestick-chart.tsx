import { THEME } from '@/lib/theme';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, View } from 'react-native';
import { CandlestickChart, useCandleData } from 'react-native-wagmi-charts';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useCallback, useMemo, useState } from 'react';
import { useUniwind } from 'uniwind';
import { Text } from '../ui/text';
import { Spacer } from '@/components/ui/spacer';
import { ChartPointTypes } from '@/lib/api/asset';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.4;
const LEGEND_PADDING = 80;

type CandleDataTypes = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type PriceCellPropsTypes = {
  label: string;
  type: 'open' | 'high' | 'low' | 'close';
  textColor: string;
  currency: string | null | undefined;
};

const formatPrice = (num: number, currency: string | null | undefined): string => {
  if (!isFinite(num) || num <= 0) return '';
  const isKrw = currency === 'KRW';
  const fixed = isKrw ? Math.round(num).toFixed(0) : num.toFixed(2);
  const parts = fixed.split('.');
  const chars = parts[0].split('');
  let intPart = '';
  for (let i = 0; i < chars.length; i++) {
    if (i > 0 && (chars.length - i) % 3 === 0) intPart += ',';
    intPart += chars[i];
  }
  const sym = isKrw ? '₩' : '$';
  return sym + intPart + (parts[1] !== undefined ? '.' + parts[1] : '');
};

const PriceCell = ({ label, type, textColor, currency }: PriceCellPropsTypes) => {
  const candle = useCandleData();
  const [text, setText] = useState('');

  const updateText = useCallback(
    (value: number) => {
      setText(formatPrice(value, currency));
    },
    [currency]
  );

  useAnimatedReaction(
    () => candle.value[type],
    (value, prev) => {
      if (value === prev) return;
      runOnJS(updateText)(value);
    },
    [type, updateText]
  );

  return (
    <View className="bg-muted/50 flex-1 flex-row items-center justify-between rounded-md px-3 py-1">
      <Text className="text-muted-foreground text-xs">{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          color: textColor,
          fontSize: 11,
          fontWeight: '600',
          flexShrink: 1,
          textAlign: 'right',
          marginLeft: 8,
        }}>
        {text}
      </Text>
    </View>
  );
};

type AssetCandlestickChartProps = {
  points?: ChartPointTypes[];
  isLoading?: boolean;
  containerHeight?: number;
  currency?: string | null;
};

export const AssetCandlestickChart = ({
  points,
  isLoading,
  containerHeight,
  currency,
}: AssetCandlestickChartProps) => {
  const { theme } = useUniwind();
  const colors = theme === 'dark' ? THEME.dark : THEME.light;
  const [width, setWidth] = useState(0);

  const resolvedContainerHeight = containerHeight ?? CONTAINER_HEIGHT;
  const resolvedChartHeight = resolvedContainerHeight - LEGEND_PADDING;

  const chartData: CandleDataTypes[] = useMemo(
    () =>
      (points ?? []).map((point) => ({
        timestamp: new Date(point.date).getTime(),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    [points]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setWidth((prev: number) => (prev === w ? prev : w));
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center" style={{ height: resolvedContainerHeight }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height: resolvedContainerHeight }}>
        <Text className="text-muted-foreground">차트 데이터가 없습니다</Text>
      </View>
    );
  }

  const hasSize = width > 0;

  return (
    <View className="w-full py-4" style={{ height: resolvedContainerHeight }} onLayout={onLayout}>
      <Spacer height={12} />
      {hasSize && (
        <CandlestickChart.Provider data={chartData}>
          <CandlestickChart width={width} height={resolvedChartHeight}>
            <CandlestickChart.Candles
              positiveColor={colors.stockUp}
              negativeColor={colors.stockDown}
            />
            {/* <CandlestickChart.Crosshair /> */}
            <CandlestickChart.Crosshair>
              <CandlestickChart.Tooltip
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  alignItems: 'center',
                  minWidth: 80,
                }}>
                <CandlestickChart.DatetimeText
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 11,
                    fontWeight: '500',
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                  options={{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }}
                />
                <CandlestickChart.PriceText
                  type="close"
                  style={{
                    color: colors.foreground,
                    fontSize: 13,
                    fontWeight: '700',
                    marginTop: 2,
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                />
              </CandlestickChart.Tooltip>
            </CandlestickChart.Crosshair>
          </CandlestickChart>

          <CandlestickChart.DatetimeText
            style={{
              color: colors.mutedForeground,
              fontSize: 11,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 6,
              height: 16,
            }}
            options={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
          />

          <View className="mt-2 px-4" style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <PriceCell
                label="시가"
                type="open"
                textColor={colors.foreground}
                currency={currency}
              />
              <PriceCell label="고가" type="high" textColor={colors.stockUp} currency={currency} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <PriceCell label="저가" type="low" textColor={colors.stockDown} currency={currency} />
              <PriceCell
                label="종가"
                type="close"
                textColor={colors.foreground}
                currency={currency}
              />
            </View>
          </View>
        </CandlestickChart.Provider>
      )}
    </View>
  );
};
