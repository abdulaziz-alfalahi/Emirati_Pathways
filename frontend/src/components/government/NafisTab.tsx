import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Award } from 'lucide-react';

interface NafisTabProps {
    isRTL: boolean;
    b: (en: string, ar: string) => string;
}

const nafisPrograms = [
    { name: ['Salary Support Program', 'برنامج دعم الرواتب'], desc: ['Monthly salary top-up for Emiratis in the private sector, up to AED 7,000/month for 5 years', 'دعم شهري لرواتب الإماراتيين في القطاع الخاص، حتى 7,000 د.إ شهرياً لمدة 5 سنوات'], beneficiaries: '45,200', budget: ['AED 2.4B', '2.4 مليار د.إ'], color: 'green' },
    { name: ['Unemployment Insurance', 'التأمين ضد التعطل'], desc: ['Financial safety net providing up to AED 20,000/month for job seekers between positions', 'شبكة أمان مالية توفر حتى 20,000 د.إ شهرياً للباحثين عن عمل'], beneficiaries: '8,400', budget: ['AED 680M', '680 مليون د.إ'], color: 'blue' },
    { name: ['Child Allowance', 'علاوة الأولاد'], desc: ['AED 800/month per child (up to 4) for Emiratis in the private sector', '800 د.إ شهرياً لكل طفل (حتى 4 أطفال) للإماراتيين في القطاع الخاص'], beneficiaries: '32,100', budget: ['AED 1.1B', '1.1 مليار د.إ'], color: 'pink' },
    { name: ['Apprenticeship (Ruwwad)', 'التدريب المهني (رواد)'], desc: ['On-the-job training with AED 3,500/month stipend for fresh graduates', 'تدريب عملي مع بدل 3,500 د.إ شهرياً للخريجين الجدد'], beneficiaries: '5,800', budget: ['AED 240M', '240 مليون د.إ'], color: 'amber' },
    { name: ['Pension Contribution Support', 'دعم مساهمات التقاعد'], desc: ['Government covers pension contribution differences between public and private sector', 'تتحمل الحكومة فروقات مساهمات التقاعد بين القطاعين العام والخاص'], beneficiaries: '52,000', budget: ['AED 3.2B', '3.2 مليار د.إ'], color: 'purple' },
    { name: ['Training & Upskilling Vouchers', 'قسائم التدريب والتطوير'], desc: ['Up to AED 20,000 in vouchers for professional certifications and skills development', 'حتى 20,000 د.إ في قسائم للشهادات المهنية وتطوير المهارات'], beneficiaries: '18,600', budget: ['AED 370M', '370 مليون د.إ'], color: 'orange' },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

const NafisTab: React.FC<NafisTabProps> = ({ isRTL, b }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <CardContent className="pt-6 pb-6 text-center">
                    <h2 className="text-xl font-dubai-bold text-slate-900 mb-2">{b('Nafis — National Program for Emiratis', 'نافس — البرنامج الوطني لتنمية الكوادر الإماراتية')}</h2>
                    <p className="text-sm text-slate-500 font-dubai-medium max-w-lg mx-auto">{b('Government-backed incentives to accelerate Emirati participation in the private sector.', 'حوافز حكومية لتسريع مشاركة الإماراتيين في القطاع الخاص.')}</p>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-emerald-100 hover:shadow-md transition-all group">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-2xl font-dubai-bold text-slate-900">{b('AED 7.8B', '7.8 مليار د.إ')}</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Total Budget', 'الميزانية الإجمالية')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-green-100 hover:shadow-md transition-all group">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <Users className="h-5 w-5 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-2xl font-dubai-bold text-slate-900">162,100</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Total Beneficiaries', 'إجمالي المستفيدين')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-blue-100 hover:shadow-md transition-all group">
                    <CardContent className="pt-5 pb-4 px-5 text-center">
                        <Award className="h-5 w-5 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-2xl font-dubai-bold text-slate-900">6</p>
                        <p className="text-xs text-slate-400 font-dubai-medium mt-1">{b('Active Programs', 'برامج نشطة')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Programs List */}
            <div className="space-y-4">
                {nafisPrograms.map((p, i) => {
                    const c = colorMap[p.color] || colorMap.green;
                    return (
                        <Card key={i} className={`bg-white border border-slate-200/80 hover:shadow-md transition-all`}>
                            <CardContent className="pt-5 pb-4 px-5" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-[280px]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-sm font-dubai-bold text-slate-800">{isRTL ? p.name[1] : p.name[0]}</h3>
                                            <Badge className={`${c.bg} ${c.text} ${c.border} text-[10px] font-dubai-medium`}>{b('Active', 'نشط')}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 font-dubai-medium leading-relaxed mb-3">{isRTL ? p.desc[1] : p.desc[0]}</p>
                                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-dubai-medium">
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.beneficiaries} {b('beneficiaries', 'مستفيد')}</span>
                                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {isRTL ? p.budget[1] : p.budget[0]}</span>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-dubai-medium text-xs self-center">
                                        {b('View Details', 'عرض التفاصيل')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default NafisTab;
