import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, DollarSign, Award, Info } from 'lucide-react';

interface EmiratizationROICalculatorDialogProps {
    open: boolean;
    onClose: () => void;
}

const EmiratizationROICalculatorDialog: React.FC<EmiratizationROICalculatorDialogProps> = ({
    open,
    onClose,
}) => {
    const [salary, setSalary] = useState<number>(15000);
    const [trainingCost, setTrainingCost] = useState<number>(5000);
    const [experienceLevel, setExperienceLevel] = useState<string>('mid');

    // Calculations
    const [nafisSupport, setNafisSupport] = useState<number>(0);
    const [pensionSavings, setPensionSavings] = useState<number>(0);
    const [trainingSubsidy, setTrainingSubsidy] = useState<number>(0);
    const [totalBenefit, setTotalBenefit] = useState<number>(0);

    useEffect(() => {
        calculateROI();
    }, [salary, trainingCost, experienceLevel]);

    const calculateROI = () => {
        // Nafis Salary Support Logic (Simplified for estimation)
        // Actual logic is complex and tiered, this is a "Benefit Estimator"
        let support = 0;
        if (salary < 10000) support = 5000;
        else if (salary < 20000) support = 7000;
        else support = 3000; // Capped for high earners

        // Pension Savings (Employer contribution subsidy)
        // Assuming 5% subsidy for 5 years for eligible candidates
        const pension = salary * 0.05;

        // Training Subsidy (e.g., Kafaat or other programs)
        // Assuming 50% subsidy up to a limit
        const training = Math.min(trainingCost * 0.5, 10000);

        setNafisSupport(support);
        setPensionSavings(pension);
        setTrainingSubsidy(training);
        setTotalBenefit(support + pension + (training / 12)); // Monthly equivalent for training
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-dubai-bold text-teal-700">
                        <Calculator className="h-6 w-6" />
                        Emiratization ROI Calculator
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 font-dubai-medium">
                        Estimate the financial benefits and social impact of hiring UAE Nationals.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-base font-dubai-bold">Monthly Salary (AED)</Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[salary]}
                                    onValueChange={(vals) => setSalary(vals[0])}
                                    max={50000}
                                    step={500}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    value={salary}
                                    onChange={(e) => setSalary(Number(e.target.value))}
                                    className="w-24 font-dubai-medium"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Base monthly salary excluding allowances.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-dubai-bold">Estimated Training Cost (AED/Year)</Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[trainingCost]}
                                    onValueChange={(vals) => setTrainingCost(vals[0])}
                                    max={50000}
                                    step={1000}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    value={trainingCost}
                                    onChange={(e) => setTrainingCost(Number(e.target.value))}
                                    className="w-24 font-dubai-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-dubai-bold">Experience Level</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['entry', 'mid', 'senior'].map((level) => (
                                    <Button
                                        key={level}
                                        variant={experienceLevel === level ? 'default' : 'outline'}
                                        onClick={() => setExperienceLevel(level)}
                                        className={`capitalize ${experienceLevel === level ? 'bg-teal-600' : ''}`}
                                    >
                                        {level}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-teal-600 font-dubai-bold uppercase tracking-wider">Total Monthly Benefit</p>
                                    <div className="text-4xl font-dubai-bold text-teal-800 mt-2">
                                        AED {totalBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <p className="text-xs text-teal-500 mt-1">Estimated savings & support</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-teal-50">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-dubai-medium text-slate-700">Nafis Salary Support</span>
                                        </div>
                                        <span className="font-dubai-bold text-green-600">+ AED {nafisSupport.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-teal-50">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-dubai-medium text-slate-700">Pension Subsidy (Est.)</span>
                                        </div>
                                        <span className="font-dubai-bold text-blue-600">+ AED {pensionSavings.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-teal-50">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-dubai-medium text-slate-700">Training Subsidy (Monthly Eq.)</span>
                                        </div>
                                        <span className="font-dubai-bold text-purple-600">+ AED {(trainingSubsidy / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-dubai-bold text-blue-800">Diversity Score Impact</h4>
                                    <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                                        Hiring this candidate contributes positively to your MoHRE Emiratization classification.
                                        Maintaining a Platinum or Gold status reduces your government service fees by up to 80%.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <div className="text-xs text-muted-foreground self-center">
                        * Estimates based on current Nafis guidelines. Actual amounts may vary.
                    </div>
                    <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 text-white">
                        Close Calculator
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmiratizationROICalculatorDialog;
