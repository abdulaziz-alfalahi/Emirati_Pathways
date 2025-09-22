
import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Mock data - Would be fetched from an API in a real implementation
const trendData = {
  'short': [
    { month: 'Jan', Technology: 40, Finance: 24, Healthcare: 28, Education: 19 },
    { month: 'Feb', Technology: 45, Finance: 26, Healthcare: 29, Education: 21 },
    { month: 'Mar', Technology: 50, Finance: 28, Healthcare: 32, Education: 22 },
    { month: 'Apr', Technology: 54, Finance: 31, Healthcare: 35, Education: 24 },
    { month: 'May', Technology: 58, Finance: 33, Healthcare: 37, Education: 25 },
    { month: 'Jun', Technology: 62, Finance: 35, Healthcare: 39, Education: 27 },
  ],
  'mid': [
    { month: 'Q1 2025', Technology: 65, Finance: 38, Healthcare: 42, Education: 30 },
    { month: 'Q2 2025', Technology: 70, Finance: 41, Healthcare: 45, Education: 33 },
    { month: 'Q3 2025', Technology: 75, Finance: 43, Healthcare: 48, Education: 36 },
    { month: 'Q4 2025', Technology: 80, Finance: 45, Healthcare: 52, Education: 39 },
    { month: 'Q1 2026', Technology: 85, Finance: 47, Healthcare: 55, Education: 42 },
    { month: 'Q2 2026', Technology: 90, Finance: 49, Healthcare: 58, Education: 45 },
  ],
  'long': [
    { month: '2024', Technology: 60, Finance: 35, Healthcare: 40, Education: 28 },
    { month: '2025', Technology: 75, Finance: 42, Healthcare: 50, Education: 36 },
    { month: '2026', Technology: 90, Finance: 49, Healthcare: 58, Education: 45 },
    { month: '2027', Technology: 105, Finance: 56, Healthcare: 65, Education: 52 },
    { month: '2028', Technology: 120, Finance: 65, Healthcare: 72, Education: 58 },
    { month: '2029', Technology: 135, Finance: 73, Healthcare: 80, Education: 65 },
  ],
};

const sectorColors = {
  Technology: '#8884d8',
  Finance: '#82ca9d',
  Healthcare: '#ffc658',
  Education: '#ff8042',
};

type TimeframeType = 'short' | 'mid' | 'long';

const MarketTrendsChart = () => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('mid');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Technology', 'Healthcare']);
  
  const data = trendData[timeframe];
  
  const handleSectorToggle = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };
  
  const timeframeLabels = {
    short: '6 Months',
    mid: '18 Months',
    long: '5 Years',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <ToggleGroup 
          type="single" 
          value={timeframe}
          onValueChange={(value) => value && setTimeframe(value as TimeframeType)}
          className="justify-start"
        >
          <ToggleGroupItem value="short" aria-label="Short term" size="sm">Short</ToggleGroupItem>
          <ToggleGroupItem value="mid" aria-label="Mid term" size="sm">Mid</ToggleGroupItem>
          <ToggleGroupItem value="long" aria-label="Long term" size="sm">Long</ToggleGroupItem>
        </ToggleGroup>
        
        <div className="flex flex-wrap gap-2 items-center">
          {Object.keys(sectorColors).map(sector => (
            <Badge 
              key={sector}
              variant={selectedSectors.includes(sector) ? "default" : "outline"}
              className="cursor-pointer"
              style={{ 
                backgroundColor: selectedSectors.includes(sector) 
                  ? sectorColors[sector as keyof typeof sectorColors] 
                  : 'transparent',
                borderColor: sectorColors[sector as keyof typeof sectorColors],
                color: selectedSectors.includes(sector) ? 'white' : 'inherit'
              }}
              onClick={() => handleSectorToggle(sector)}
            >
              {sector}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <div className="text-sm text-muted-foreground mb-2">
          Projected job market growth by sector ({timeframeLabels[timeframe]})
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit="K" />
            <Tooltip 
              formatter={(value: number) => [`${value}K jobs`, '']}
            />
            <Legend />
            {Object.keys(sectorColors).map(sector => (
              selectedSectors.includes(sector) && (
                <Area
                  key={sector}
                  type="monotone"
                  dataKey={sector}
                  stroke={sectorColors[sector as keyof typeof sectorColors]}
                  fill={sectorColors[sector as keyof typeof sectorColors]}
                  fillOpacity={0.3}
                  activeDot={{ r: 8 }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <h4 className="font-medium mb-2">Key Insight</h4>
        <p className="text-sm text-muted-foreground">
          Technology roles are projected to grow 125% over the next 5 years, with AI and machine learning 
          specialists seeing the highest demand (47% of technology growth).
        </p>
      </div>
    </div>
  );
};

export default MarketTrendsChart;
