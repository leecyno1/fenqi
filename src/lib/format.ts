import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPoints(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateLabel(value: string | Date) {
  return format(typeof value === "string" ? new Date(value) : value, "M月d日 HH:mm", {
    locale: zhCN,
  });
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
