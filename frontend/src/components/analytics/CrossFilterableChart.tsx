
import React, { useCallback } from 'react';
import { ResponsiveContainer } from 'recharts';

interface CrossFilterableChartProps {
  children: React.ReactNode;
  onDataClick?: (data: any, filterType: string) => void;
  filterType: string;
  isFiltered?: boolean;
  className?: string;
}

export const CrossFilterableChart: React.FC<CrossFilterableChartProps> = React.memo(({
  children,
  onDataClick,
  filterType,
  isFiltered = false,
  className = "h-80"
}) => {
  const handleChartClick = useCallback((data: any) => {
    if (onDataClick && data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      onDataClick(clickedData, filterType);
    }
  }, [onDataClick, filterType]);

  const containerClassName = React.useMemo(() => 
    `${className} ${isFiltered ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} transition-all duration-200`,
    [className, isFiltered]
  );

  return (
    <div className={containerClassName}>
      <ResponsiveContainer width="100%" height="100%">
        <div onClick={handleChartClick} className="cursor-pointer">
          {children}
        </div>
      </ResponsiveContainer>
    </div>
  );
});

CrossFilterableChart.displayName = 'CrossFilterableChart';
