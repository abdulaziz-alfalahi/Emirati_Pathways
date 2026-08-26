import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, RefreshCw, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { restClient } from '@/utils/api';

interface CompanyCandidate {
    company_id: string;
    company_name: string;
    contact_email: string;
    vacancy_count: number;
    last_import_date: string;
    is_verified: boolean;
}

export const GrowthOperations: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
    const [minVacancies, setMinVacancies] = useState(5);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    // How much of the vacancy pool the current threshold covers. Without this
    // the slider is a guess: an operator working "the top of the list" cannot
    // see where the 80% actually falls.
    const [concentration, setConcentration] = useState<{
        total_companies: number; total_vacancies: number;
        selected_companies: number; selected_vacancies: number;
        coverage_percent: number | null; company_percent?: number;
        suggested_min_vacancies: number | null;
    } | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCandidates = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await restClient.get(`/api/growth/candidates`, {
                params: { min_vacancies: minVacancies }
            });
            if (response.data.success) {
                setCandidates(response.data.candidates || []);
                setConcentration(response.data.concentration || null);
                setSelectedCompanies([]);
            } else {
                setError(response.data.error || 'Failed to fetch candidates');
                setCandidates([]);
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to fetch growth candidates';
            setError(errorMessage);
            toast.error(errorMessage);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCandidates();
        }, 500);

        return () => clearTimeout(timer);
    }, [minVacancies]);

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCompanies(candidates.map(c => c.company_id));
        } else {
            setSelectedCompanies([]);
        }
    };

    const toggleSelectCompany = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedCompanies(prev => [...prev, id]);
        } else {
            setSelectedCompanies(prev => prev.filter(cid => cid !== id));
        }
    };

    const handleBulkSend = async () => {
        if (selectedCompanies.length === 0) return;

        if (!confirm(`Are you sure you want to send verification emails to ${selectedCompanies.length} companies?`)) {
            return;
        }

        setSending(true);
        try {
            const response = await restClient.post(`/api/growth/send-emails`, {
                company_ids: selectedCompanies
            });

            if (response.data.success) {
                const report = response.data.report;
                toast.success(`Sent: ${report.sent}, Failed: ${report.failed}`);
                setSelectedCompanies([]);
                fetchCandidates();
            } else {
                toast.error(response.data.error || "Failed to send emails");
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to trigger email send';
            toast.error(errorMessage);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>Target high-value companies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Min Vacancies</Label>
                                <span className="font-bold text-teal-600">{minVacancies}</span>
                            </div>
                            <Slider
                                value={[minVacancies]}
                                onValueChange={(vals) => setMinVacancies(vals[0])}
                                min={1}
                                max={50}
                                step={1}
                                className="py-4"
                            />
                            <p className="text-xs text-slate-500">
                                Showing companies with {minVacancies} or more pending jobs.
                            </p>

                            {/* What this threshold actually buys. Reported as a
                                share of vacancies, not of companies: the effort
                                is per company visited, the return is per vacancy
                                reached, and those are different denominators. */}
                            {concentration && concentration.total_vacancies > 0 ? (
                                <div className="rounded-md bg-teal-50 border border-teal-100 p-3 space-y-1">
                                    <p className="text-xs text-teal-900">
                                        <span className="font-bold">
                                            {concentration.selected_companies}
                                        </span>{' '}
                                        of {concentration.total_companies} companies
                                        {typeof concentration.company_percent === 'number'
                                            ? ` (${concentration.company_percent}%)`
                                            : ''}{' '}
                                        hold{' '}
                                        <span className="font-bold">
                                            {concentration.coverage_percent}%
                                        </span>{' '}
                                        of all {concentration.total_vacancies} pending vacancies.
                                    </p>
                                    {concentration.suggested_min_vacancies !== null &&
                                     concentration.suggested_min_vacancies !== minVacancies && (
                                        <button
                                            type="button"
                                            onClick={() => setMinVacancies(
                                                concentration.suggested_min_vacancies as number)}
                                            className="text-xs text-teal-700 underline hover:text-teal-900"
                                        >
                                            Use {concentration.suggested_min_vacancies}+ to cover 80% of vacancies
                                        </button>
                                    )}
                                </div>
                            ) : concentration ? (
                                <p className="text-xs text-slate-500">
                                    No pending vacancies to rank yet — import a NAFIS
                                    vacancy sheet first.
                                </p>
                            ) : null}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={fetchCandidates}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-slate-50 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-lg">Campaign Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-3xl font-bold text-slate-800">{candidates.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Companies Found</div>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-3xl font-bold text-teal-600">
                                {candidates.reduce((acc, c) => acc + c.vacancy_count, 0)}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Vacancies</div>
                        </div>
                        <div className="p-4 bg-white rounded-lg shadow-sm border-teal-200 border">
                            <div className="text-3xl font-bold text-teal-700">{selectedCompanies.length}</div>
                            <div className="text-xs text-teal-600 uppercase tracking-wider mt-1">Selected for Email</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 py-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                        <Button variant="outline" size="sm" onClick={fetchCandidates} className="ms-auto">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Target List</CardTitle>
                        <CardDescription>Companies awaiting onboarding</CardDescription>
                    </div>
                    <Button
                        onClick={handleBulkSend}
                        disabled={selectedCompanies.length === 0 || sending}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {sending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send className="h-4 w-4 me-2" />
                                Send Onboarding Emails ({selectedCompanies.length})
                            </>
                        )}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={candidates.length > 0 && selectedCompanies.length === candidates.length}
                                            onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                                        />
                                    </TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-end">Vacancies</TableHead>
                                    <TableHead>Imported</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                                            Loading candidates...
                                        </TableCell>
                                    </TableRow>
                                ) : candidates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No companies found matching criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    candidates.map((company) => (
                                        <TableRow key={company.company_id} className={selectedCompanies.includes(company.company_id) ? "bg-slate-50" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCompanies.includes(company.company_id)}
                                                    onCheckedChange={(checked) => toggleSelectCompany(company.company_id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {company.company_name}
                                            </TableCell>
                                            <TableCell>{company.contact_email}</TableCell>
                                            <TableCell className="text-end">
                                                <Badge variant="secondary" className="bg-slate-100">
                                                    {company.vacancy_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(company.last_import_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {company.is_verified ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Verified</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
