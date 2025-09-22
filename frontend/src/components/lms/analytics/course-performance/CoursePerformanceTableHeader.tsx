
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortButton } from './SortButton';
import { SortField } from './types';

interface CoursePerformanceTableHeaderProps {
  onSort: (field: SortField) => void;
}

export const CoursePerformanceTableHeader: React.FC<CoursePerformanceTableHeaderProps> = ({ onSort }) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Course Name</TableHead>
        <TableHead>
          <SortButton field="enrollments" onSort={onSort}>
            Enrollments
          </SortButton>
        </TableHead>
        <TableHead>
          <SortButton field="completionRate" onSort={onSort}>
            Completion Rate
          </SortButton>
        </TableHead>
        <TableHead>
          <SortButton field="averageScore" onSort={onSort}>
            Avg Score
          </SortButton>
        </TableHead>
        <TableHead>
          <SortButton field="engagementRate" onSort={onSort}>
            Engagement
          </SortButton>
        </TableHead>
        <TableHead>Trend</TableHead>
      </TableRow>
    </TableHeader>
  );
};
