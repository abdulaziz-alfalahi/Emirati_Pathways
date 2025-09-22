
import React, { useState } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { CoursePerformanceTableHeader } from './CoursePerformanceTableHeader';
import { CoursePerformanceTableRow } from './CoursePerformanceTableRow';
import { mockCourseData } from './mockData';
import { CoursePerformance, SortField, SortDirection } from './types';

export const CoursePerformanceTable: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>('completionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = [...mockCourseData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <CoursePerformanceTableHeader onSort={handleSort} />
          <TableBody>
            {sortedData.map((course) => (
              <CoursePerformanceTableRow key={course.id} course={course} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
