import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { RecruiterAnalyticsCharts } from '@/components/recruiter/analytics/RecruiterAnalyticsCharts';
import { KeyInsights } from '@/components/recruiter/analytics/KeyInsights';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API = (p: string) => `${p}`;

export default function RecruiterAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API('/api/hr/analytics/recruiter/summary'), { headers: H as any });
        if (r.ok) setData(await r.json());
      } catch { }
    })();
  }, [H]);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('recruitment-analytics.pdf');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportCSV = () => {
    // Mock CSV export
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Metric,Value\n"
      + "Total Jobs," + (data?.data?.jobs?.total_jobs || 0) + "\n"
      + "Published Jobs," + (data?.data?.jobs?.published_jobs || 0) + "\n"
      + "Total Offers," + (data?.data?.offers?.total_offers || 0) + "\n"
      + "Offers Accepted," + (data?.data?.offers?.offers_accepted || 0);

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recruitment_metrics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const d = data?.data || {};

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Real-time insights into your recruitment pipeline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} className="bg-teal-600 hover:bg-teal-700">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{d.jobs?.total_jobs ?? '-'}</div>
              <p className="text-xs text-slate-500 mt-1">
                {d.jobs?.published_jobs ?? '-'} published
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Offers Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{d.offers?.offers_accepted ?? '-'}</div>
              <p className="text-xs text-slate-500 mt-1">
                {d.offers?.total_offers ?? '-'} total offers sent
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Avg Time to Hire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {d.offers?.avg_time_to_fill_days?.toFixed?.(1) ?? '-'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Days</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Shortlisted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{d.shortlist?.total_shortlisted ?? '-'}</div>
              <p className="text-xs text-slate-500 mt-1">Candidates</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Charts Area */}
          <div className="lg:col-span-2">
            <RecruiterAnalyticsCharts />
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <KeyInsights />

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Pipeline Summary</CardTitle>
                <CardDescription>Conversion snapshots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Jobs Draft</span>
                  <span className="font-medium">{d.pipeline?.jobs_draft ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Jobs Published</span>
                  <span className="font-medium">{d.pipeline?.jobs_published ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Candidates Shortlisted</span>
                  <span className="font-medium">{d.pipeline?.candidates_shortlisted ?? '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Offers Total</span>
                  <span className="font-medium">{d.pipeline?.offers_total ?? '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
