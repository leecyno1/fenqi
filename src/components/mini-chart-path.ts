type PriceHistoryPoint = {
  timestamp: string;
  yesProbability: number;
  noProbability: number;
};

type MiniChartPoint = {
  x: number;
  y: number;
};

type MiniChartDimensions = {
  width: number;
  height: number;
};

const defaultMiniChartDimensions: MiniChartDimensions = {
  width: 112,
  height: 48,
};

export function toMiniChartPoints(
  data: PriceHistoryPoint[],
  dimensions: MiniChartDimensions = defaultMiniChartDimensions,
): MiniChartPoint[] {
  if (data.length === 0) {
    return [];
  }

  if (data.length === 1) {
    return [
      {
        x: 0,
        y: Number((dimensions.height * (1 - data[0].yesProbability)).toFixed(2)),
      },
    ];
  }

  return data.map((point, index) => {
    const progress = index / (data.length - 1);

    return {
      x: Number((dimensions.width * progress).toFixed(2)),
      y: Number((dimensions.height * (1 - point.yesProbability)).toFixed(2)),
    };
  });
}

export function buildMiniChartPath(points: MiniChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}
