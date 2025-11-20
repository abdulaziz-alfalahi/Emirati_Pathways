import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { apiClient } from '@/utils/apiClient';

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  // Note: apiClient handles authentication automatically via localStorage.getItem('access_token')

  useEffect(() => {
    (async () => {
      try {
        const result = await apiClient.get('/api/hr/analytics/recruiter/summary');
        setData(result);
      } catch {}
    })();
  }, []);

  const d = data?.data || {};
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Totals and time to publish</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Total jobs: {d.jobs?.total_jobs ?? '-'}</div>
          <div>Published: {d.jobs?.published_jobs ?? '-'}</div>
          <div>Avg time to publish (days): {d.jobs?.avg_time_to_publish_days?.toFixed?.(1) ?? '-'}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>Pipeline and time to fill</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Total offers: {d.offers?.total_offers ?? '-'}</div>
          <div>Sent: {d.offers?.offers_sent ?? '-'}</div>
          <div>Accepted: {d.offers?.offers_accepted ?? '-'}</div>
          <div>Avg time to fill (days): {d.offers?.avg_time_to_fill_days?.toFixed?.(1) ?? '-'}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Shortlist & Distribution</CardTitle>
          <CardDescription>Supporting metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Shortlisted: {d.shortlist?.total_shortlisted ?? '-'}</div>
          <div>Documents: {d.extra?.total_documents ?? '-'}</div>
          <div>Distributions: {d.extra?.total_distributions ?? '-'}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Pipeline Summary</CardTitle>
          <CardDescription>Conversion snapshots</CardDescription>
        </CardHeader>
        <CardContent>
          <div>Jobs Draft: {d.pipeline?.jobs_draft ?? '-'}</div>
          <div>Jobs Published: {d.pipeline?.jobs_published ?? '-'}</div>
          <div>Candidates Shortlisted: {d.pipeline?.candidates_shortlisted ?? '-'}</div>
          <div>Offers Total: {d.pipeline?.offers_total ?? '-'}</div>
          <div>Offers Accepted: {d.pipeline?.offers_accepted ?? '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
