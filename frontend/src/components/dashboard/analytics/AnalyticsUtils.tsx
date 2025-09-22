
export const formatChartData = (results: Record<string, any>) => {
  return Object.entries(results).map(([variantId, stats]) => ({
    variant: variantId,
    clickRate: stats.clickThroughRate || 0,
    conversionRate: stats.conversionRate || 0,
    feedbackRate: stats.feedbackRate || 0,
    assignments: stats.assignments || 0
  }));
};

export const formatTooltipValue = (value: any, name: string) => {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return [`${numValue.toFixed(1)}%`, name === 'clickRate' ? 'Click Rate' : name];
};
