
import { useState, useMemo } from 'react';

export interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  offset: number;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  getTotalPages: (totalCount: number) => number;
  hasNextPage: (totalCount: number) => boolean;
  hasPreviousPage: () => boolean;
}

export const usePagination = ({ 
  initialPage = 1, 
  pageSize = 20 
}: PaginationConfig = {}): PaginationState => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);

  const nextPage = () => setCurrentPage(prev => prev + 1);
  const previousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

  const getTotalPages = (totalCount: number) => Math.ceil(totalCount / pageSize);
  const hasNextPage = (totalCount: number) => currentPage < getTotalPages(totalCount);
  const hasPreviousPage = () => currentPage > 1;

  return {
    currentPage,
    pageSize,
    offset,
    setCurrentPage,
    nextPage,
    previousPage,
    getTotalPages,
    hasNextPage,
    hasPreviousPage
  };
};
