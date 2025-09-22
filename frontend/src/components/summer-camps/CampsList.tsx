
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CampFilters } from '@/types/summerCamps';
import { useCamps } from './hooks/useCamps';
import CampCard from './CampCard';
import { Pagination } from '@/components/ui/pagination';
import { Loader2, Tent } from 'lucide-react';
import { formatNumber } from '@/lib/translationUtils';

interface CampsListProps {
  type: "available" | "registered" | "managed";
  filters: CampFilters;
  searchQuery: string;
}

const CampsList: React.FC<CampsListProps> = ({ type, filters, searchQuery }) => {
  const { 
    camps, 
    loading, 
    totalCount,
    enrolledCamps, 
    pagination, 
    handleEnroll, 
    handleCancelEnrollment 
  } = useCamps(type, filters, searchQuery);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal mb-4" />
        <p className="text-muted-foreground">Loading camps...</p>
      </div>
    );
  }

  if (camps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Tent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Camps Found</h3>
          <p className="text-muted-foreground">
            {searchQuery || Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true))
              ? 'Try adjusting your search or filter criteria.'
              : type === "registered" 
                ? 'You haven\'t registered for any camps yet.'
                : type === "managed"
                  ? 'You haven\'t created any camps yet.'
                  : 'No camps are currently available.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Camps Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {camps.map((camp) => (
          <CampCard
            key={camp.id}
            camp={camp}
            onEnroll={() => handleEnroll(camp.id)}
            onCancelEnrollment={() => handleCancelEnrollment(camp.id)}
            isEnrolled={!!enrolledCamps[camp.id]}
            showActions={type !== "managed"}
          />
        ))}
      </div>

      {/* Pagination Controls - only show for available and managed camps */}
      {(type === "available" || type === "managed") && totalCount > pagination.pageSize && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.getTotalPages(totalCount)}
            onPageChange={pagination.setCurrentPage}
            hasNextPage={pagination.hasNextPage(totalCount)}
            hasPreviousPage={pagination.hasPreviousPage()}
          />
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-sm text-muted-foreground">
        {type === "available" || type === "managed" ? (
          <>
            Showing {formatNumber(((pagination.currentPage - 1) * pagination.pageSize) + 1)} to{' '}
            {formatNumber(Math.min(pagination.currentPage * pagination.pageSize, totalCount))} of{' '}
            {formatNumber(totalCount)} camp{totalCount !== 1 ? 's' : ''}
          </>
        ) : (
          <>
            {formatNumber(totalCount)} camp{totalCount !== 1 ? 's' : ''} found
          </>
        )}
      </div>
    </div>
  );
};

export default CampsList;
