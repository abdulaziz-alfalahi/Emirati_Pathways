import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Brain, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:5005';

export default function BoardPortal() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('scorecards');
  const [scorecards, setScorecards] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [directives, setDirectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New directive form state
  const [newDirective, setNewDirective] = useState({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Note: Added a dummy token or mock auth header if required by actual system. 
      // For this sprint, assuming optional_auth allows anonymous/mock user if token is missing.
      const headers = { 'Content-Type': 'application/json' };
      
      const [scoreRes, insightsRes, dirRes] = await Promise.all([
        fetch(`${API_BASE}/api/board/scorecards`, { headers }),
        fetch(`${API_BASE}/api/board/insights`, { headers }),
        fetch(`${API_BASE}/api/board/directives`, { headers })
      ]);

      if (scoreRes.ok) setScorecards(await scoreRes.json());
      if (insightsRes.ok) setInsights(await insightsRes.json());
      if (dirRes.ok) setDirectives(await dirRes.json());
      
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitDirective = async () => {
    if (!newDirective.title) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/board/directives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDirective)
      });
      if (res.ok) {
        setNewDirective({ title: '', body: '', category: 'strategic_priority', priority: 'normal' });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error submitting directive:', error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-emerald-800/20 rounded-full mb-4"></div><p>Loading Executive Intelligence...</p></div></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
            {t('EHDC Executive Portal', 'بوابة الإدارة العليا')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('Strategic Intelligence & Directives', 'الذكاء الاستراتيجي والتوجيهات')}
          </p>
        </div>
        <Button variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50">
          <FileText className="h-4 w-4" />
          {t('Generate Board Pack', 'إنشاء ملف المجلس')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-slate-100/50">
          <TabsTrigger value="scorecards">{t('Scorecards', 'بطاقات الأداء')}</TabsTrigger>
          <TabsTrigger value="insights">{t('AI Insights', 'رؤى الذكاء الاصطناعي')}</TabsTrigger>
          <TabsTrigger value="directives">{t('Directives', 'التوجيهات')}</TabsTrigger>
          <TabsTrigger value="emiratisation">{t('Emiratisation', 'التوطين')}</TabsTrigger>
        </TabsList>

        <TabsContent value="scorecards" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scorecards && Object.entries(scorecards).map(([key, data]: [string, any]) => (
              <Card key={key} className="relative overflow-hidden border-emerald-100/50 shadow-sm hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 w-1 h-full ${data.status === 'excellent' ? 'bg-emerald-500' : data.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </CardTitle>
                  <Target className="h-4 w-4 text-emerald-600/50" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-950">{data.value}</div>
                  <div className="flex items-center mt-1 text-sm">
                    {data.trend.startsWith('+') ? 
                      <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    }
                    <span className={data.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}>
                      {data.trend}
                    </span>
                    <span className="text-muted-foreground ml-2">vs target {data.target}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-600" />
                {t('Weekly Intelligence Brief', 'موجز الذكاء الأسبوعي')}
              </h3>
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4" style={{borderLeftColor: insight.severity === 'warning' ? '#f59e0b' : '#10b981'}}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge variant={insight.severity === 'warning' ? 'destructive' : 'secondary'}>
                        {insight.theme.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-emerald-600 h-8 gap-1">
                        View Details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-6">
              <h3 className="text-lg font-medium mb-4">AI Analysis Engine</h3>
              <p className="text-sm text-slate-500 mb-6">
                Insights are automatically generated by analyzing pipeline anomalies, conversion rate changes, and platform engagement metrics across 4,500+ data points.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Models Run</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Last Analysis</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="directives" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-medium">{t('Active Directives', 'التوجيهات النشطة')}</h3>
              {directives.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No active directives.</CardContent></Card>
              ) : (
                directives.map((dir) => (
                  <Card key={dir.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{dir.title}</CardTitle>
                        <Badge variant={dir.status === 'open' ? 'default' : 'secondary'}>
                          {dir.status === 'open' ? <Clock className="h-3 w-3 mr-1 inline" /> : <CheckCircle className="h-3 w-3 mr-1 inline" />}
                          {dir.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{dir.category.replace('_', ' ')}</Badge>
                        <span className="text-xs">{new Date(dir.created_at).toLocaleDateString()}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{dir.body}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div>
              <Card className="sticky top-4 border-emerald-100 bg-emerald-50/30">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-900">Issue Directive</CardTitle>
                  <CardDescription>Send a strategic directive to the Operations Team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Title</label>
                    <Input 
                      placeholder="e.g., Investigate placement drop" 
                      value={newDirective.title}
                      onChange={e => setNewDirective({...newDirective, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Category</label>
                    <Select value={newDirective.category} onValueChange={v => setNewDirective({...newDirective, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategic_priority">Strategic Priority</SelectItem>
                        <SelectItem value="data_request">Data Request</SelectItem>
                        <SelectItem value="improvement_suggestion">Improvement Suggestion</SelectItem>
                        <SelectItem value="policy_direction">Policy Direction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Details</label>
                    <Textarea 
                      placeholder="Context and required actions..." 
                      className="min-h-[100px]"
                      value={newDirective.body}
                      onChange={e => setNewDirective({...newDirective, body: e.target.value})}
                    />
                  </div>
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={submitDirective}>
                    Submit Directive
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="emiratisation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Executive Emiratisation Overview</CardTitle>
              <CardDescription>High-level view of national targets</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center bg-slate-50 rounded-md border border-dashed">
              <p className="text-muted-foreground">Strategic charts and NAFIS integration visualizations will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
