import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, ArrowUp, CheckCircle, AlertTriangle, Award } from 'lucide-react';

interface ComplianceTabProps {
    isRTL: boolean;
    b: (en: string, ar: string) => string;
}

const companies = [
    { name: ['Emirates NBD', 'الإمارات دبي الوطني'], sector: ['Banking', 'البنوك'], rate: 18.5, target: 15, status: 'compliant', emiratis: 3420, total: 18490, trend: '+2.1%' },
    { name: ['Etisalat (e&)', 'اتصالات (e&)'], sector: ['Telecom', 'الاتصالات'], rate: 22.3, target: 15, status: 'compliant', emiratis: 4150, total: 18610, trend: '+1.8%' },
    { name: ['ADNOC Group', 'مجموعة أدنوك'], sector: ['Oil & Gas', 'النفط والغاز'], rate: 60.2, target: 20, status: 'exemplary', emiratis: 12500, total: 20760, trend: '+0.5%' },
    { name: ['Emaar Properties', 'إعمار العقارية'], sector: ['Real Estate', 'العقارات'], rate: 12.8, target: 10, status: 'compliant', emiratis: 890, total: 6950, trend: '+3.2%' },
    { name: ['Dubai Holding', 'دبي القابضة'], sector: ['Diversified', 'متنوع'], rate: 25.1, target: 15, status: 'compliant', emiratis: 2800, total: 11160, trend: '+1.4%' },
    { name: ['Majid Al Futtaim', 'ماجد الفطيم'], sector: ['Retail', 'التجزئة'], rate: 6.2, target: 10, status: 'non_compliant', emiratis: 2480, total: 40000, trend: '+0.8%' },
    { name: ['Al Futtaim Group', 'مجموعة الفطيم'], sector: ['Automotive & Retail', 'السيارات والتجزئة'], rate: 5.8, target: 10, status: 'non_compliant', emiratis: 1160, total: 20000, trend: '+1.1%' },
    { name: ['Mashreq Bank', 'بنك المشرق'], sector: ['Banking', 'البنوك'], rate: 16.9, target: 15, status: 'compliant', emiratis: 845, total: 5000, trend: '+2.5%' },
];

const getStatusBadge = (status: string, b: (en: string, ar: string) => string) => {
    switch (status) {
        case 'compliant':
            return <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-dubai-medium"><CheckCircle className="h-3 w-3 mr-1 inline" />{b('Compliant', 'ممتثل')}</Badge>;
        case 'exemplary':
            return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-dubai-medium"><Award className="h-3 w-3 mr-1 inline" />{b('Exemplary', 'نموذجي')}</Badge>;
        case 'non_compliant':
            return <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-dubai-medium"><AlertTriangle className="h-3 w-3 mr-1 inline" />{b('Non-Compliant', 'غير ممتثل')}</Badge>;
        default:
            return null;
    }
};

const ComplianceTab: React.FC<ComplianceTabProps> = ({ isRTL, b }) => {
    const compliant = companies.filter(c => c.status === 'compliant' || c.status === 'exemplary').length;
    const nonCompliant = companies.filter(c => c.status === 'non_compliant').length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-slate-200/80">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <p className="text-3xl font-dubai-bold text-slate-900">{companies.length}</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Companies Tracked', 'شركات مراقبة')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-green-100">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <p className="text-3xl font-dubai-bold text-green-700">{compliant}</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Compliant', 'ممتثلة')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-red-100">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <p className="text-3xl font-dubai-bold text-red-700">{nonCompliant}</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Non-Compliant', 'غير ممتثلة')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Company Table */}
            <Card className="bg-white border border-slate-200/80">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-800 font-dubai-bold">
                        <Users className="h-4 w-4 text-emerald-600" />
                        {b('Company Compliance Tracker', 'متابعة امتثال الشركات')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 px-0">
                    <table className="w-full text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className={`px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Company', 'الشركة')}</th>
                                <th className={`px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Sector', 'القطاع')}</th>
                                <th className={`px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Rate', 'المعدل')}</th>
                                <th className={`px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Target', 'الهدف')}</th>
                                <th className={`px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Emiratis', 'إماراتيون')}</th>
                                <th className={`px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider font-dubai-medium ${isRTL ? 'text-right' : 'text-left'}`}>{b('Status', 'الحالة')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((c, i) => (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="font-dubai-medium text-slate-800">{isRTL ? c.name[1] : c.name[0]}</p>
                                        <span className="text-[10px] text-green-600 font-dubai-medium flex items-center gap-0.5 mt-0.5">
                                            <ArrowUp className="h-2.5 w-2.5" /> {c.trend}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-slate-500 font-dubai text-xs">{isRTL ? c.sector[1] : c.sector[0]}</td>
                                    <td className="px-3 py-3">
                                        <span className={`font-dubai-bold ${c.rate >= c.target ? 'text-green-700' : 'text-red-600'}`}>{c.rate}%</span>
                                    </td>
                                    <td className="px-3 py-3 text-slate-500 font-dubai text-xs">{c.target}%</td>
                                    <td className="px-3 py-3 text-slate-700 font-dubai text-xs">{c.emiratis.toLocaleString()}/{c.total.toLocaleString()}</td>
                                    <td className="px-3 py-3">{getStatusBadge(c.status, b)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ComplianceTab;
