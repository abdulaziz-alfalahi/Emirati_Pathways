// src/components/cv-builder/CVExportDialog.tsx
import React, { useState, useEffect } from 'react'
import { useCV } from '@/context/CVContext'
import { CVData } from '@/types/cv'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Download,
  FileText,
  File,
  Code,
  Eye,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'

interface CVExportDialogProps {
  isOpen: boolean
  onClose: () => void
  cvData?: Partial<CVData>
  cvId?: string
}

type ExportFormat = 'pdf' | 'docx' | 'json'

interface ExportOptions {
  format: ExportFormat
  language: 'en' | 'ar' | 'bilingual'
  includePhoto: boolean
  includeReferences: boolean
  optimizeForATS: boolean
  includeAnalytics: boolean
}

const EXPORT_FORMATS = [
  {
    id: 'pdf' as ExportFormat,
    name: 'PDF Document',
    description: 'Professional PDF format, perfect for email and printing',
    icon: FileText,
    recommended: true,
    features: ['ATS-Optimized', 'Print-Ready', 'Universal Compatibility'],
  },
  {
    id: 'docx' as ExportFormat,
    name: 'Word Document',
    description: 'Editable Word format for further customization',
    icon: File,
    recommended: false,
    features: ['Editable', 'Customizable', 'Track Changes'],
  },
  {
    id: 'json' as ExportFormat,
    name: 'JSON Data',
    description: 'Structured data format for developers and integrations',
    icon: Code,
    recommended: false,
    features: ['Machine Readable', 'API Integration', 'Data Backup'],
  },
]

export const CVExportDialog: React.FC<CVExportDialogProps> = ({
  isOpen,
  onClose,
  cvData,
  cvId,
}) => {
  const { exportCV, analytics, completionScore, loading } = useCV()

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    language: 'en',
    includePhoto: true,
    includeReferences: false,
    optimizeForATS: true,
    includeAnalytics: false,
  })
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    url?: string
    message?: string
  } | null>(null)

  useEffect(() => {
    setExportOptions((prev) => ({ ...prev, format: selectedFormat }))
  }, [selectedFormat])

  const handleExport = async (format: ExportFormat) => {
    if (!cvData || !cvId) {
      setExportResult({
        success: false,
        message: 'CV data not available for export',
      })
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    setExportResult(null)

    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      // Simulate progress UI
      progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Correct call signature: (cvId, format, options?)
      const result = await exportCV(cvId, format, {
        language: exportOptions.language,
        includePhoto: exportOptions.includePhoto,
        includeReferences: exportOptions.includeReferences,
        optimizeForATS: exportOptions.optimizeForATS,
        includeAnalytics: exportOptions.includeAnalytics,
      })

      if (progressInterval) clearInterval(progressInterval)
      setExportProgress(100)

      if (result?.success && result.url) {
        setExportResult({
          success: true,
          url: result.url,
          message: `CV exported successfully as ${format.toUpperCase()}`,
        })

        // Auto-download
        const link = document.createElement('a')
        link.href = result.url
        const p =
          (cvData.personalInfo ??
            (cvData as any).personal_info ??
            {}) as NonNullable<CVData['personalInfo']>
        const safeName =
          (p && (p as any).full_name) ||
          [p?.firstName, p?.lastName].filter(Boolean).join('_') ||
          'CV'
        link.download = `CV_${safeName}_${Date.now()}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setExportResult({
          success: false,
          message: result?.message || 'Export failed. Please try again.',
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export error:', error)
      setExportResult({
        success: false,
        message: 'Export failed due to an unexpected error',
      })
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  const safeCompletion = typeof completionScore === 'number' ? completionScore : 0

  const getFormatRecommendation = () => {
    if (safeCompletion < 60) {
      return {
        message: 'Complete more sections for better export quality',
        type: 'warning' as const,
      }
    }
    if (safeCompletion >= 90) {
      return {
        message: 'Your CV is ready for professional export!',
        type: 'success' as const,
      }
    }
    return {
      message: 'Good progress! Consider adding more details for optimal results',
      type: 'info' as const,
    }
  }

  const recommendation = getFormatRecommendation()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export your CV
          </DialogTitle>
          <DialogDescription>
            Choose your preferred format and options. We’ll optimize the output
            for ATS (Applicant Tracking Systems) where possible.
          </DialogDescription>
        </DialogHeader>

        {/* Analytics/Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={safeCompletion} />
              <div className="text-xs text-muted-foreground">{safeCompletion}% complete</div>
              {recommendation.type === 'success' && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ready
                </Badge>
              )}
              {recommendation.type === 'warning' && (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Improve
                </Badge>
              )}
              {recommendation.type === 'info' && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Nice Progress
                </Badge>
              )}
              <div className="text-xs">{recommendation.message}</div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Views</div>
                <div className="font-medium">
                  {(analytics?.performance_metrics?.views ??
                    analytics?.views ??
                    0) as number}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Matches</div>
                <div className="font-medium">
                  {(analytics?.performance_metrics?.matches ??
                    analytics?.matches ??
                    0) as number}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Downloads</div>
                <div className="font-medium">
                  {(analytics?.performance_metrics?.downloads ??
                    analytics?.downloads ??
                    0) as number}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Demand</div>
                <div className="font-medium">
                  {(analytics?.market_insights?.demand_score ??
                    analytics?.marketInsights?.demandLevel ??
                    '—') as number | string}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Format selection & options */}
        <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)} className="mt-4">
          <TabsList className="grid grid-cols-3">
            {EXPORT_FORMATS.map((f) => (
              <TabsTrigger key={f.id} value={f.id}>
                <div className="flex items-center gap-2">
                  <f.icon className="h-4 w-4" />
                  {f.name}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {EXPORT_FORMATS.map((f) => (
            <TabsContent key={f.id} value={f.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{f.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">{f.description}</div>
                  <div className="flex flex-wrap gap-2">
                    {f.features.map((feat) => (
                      <Badge key={feat} variant="outline">
                        {feat}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includePhoto">Include Photo</Label>
                        <Switch
                          id="includePhoto"
                          checked={exportOptions.includePhoto}
                          onCheckedChange={(checked) =>
                            setExportOptions((p) => ({ ...p, includePhoto: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeReferences">Include References</Label>
                        <Switch
                          id="includeReferences"
                          checked={exportOptions.includeReferences}
                          onCheckedChange={(checked) =>
                            setExportOptions((p) => ({ ...p, includeReferences: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="optimizeATS">Optimize for ATS</Label>
                        <Switch
                          id="optimizeATS"
                          checked={exportOptions.optimizeForATS}
                          onCheckedChange={(checked) =>
                            setExportOptions((p) => ({ ...p, optimizeForATS: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeAnalytics">Include Analytics Footer</Label>
                        <Switch
                          id="includeAnalytics"
                          checked={exportOptions.includeAnalytics}
                          onCheckedChange={(checked) =>
                            setExportOptions((p) => ({ ...p, includeAnalytics: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Label>Language:</Label>
                    <div className="flex gap-2">
                      {(['en', 'ar', 'bilingual'] as const).map((lang) => (
                        <Button
                          key={lang}
                          type="button"
                          size="sm"
                          variant={exportOptions.language === lang ? 'default' : 'outline'}
                          onClick={() =>
                            setExportOptions((p) => ({ ...p, language: lang }))
                          }
                        >
                          {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Bilingual'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => handleExport(f.id)}
                      disabled={isExporting || loading.isLoading}
                      className="gap-2"
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export as {f.name}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="gap-2"
                      title="Preview (coming soon)"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>

                    {exportOptions.language === 'bilingual' && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Bilingual output enabled
                      </Badge>
                    )}
                  </div>

                  {(isExporting || exportProgress > 0) && (
                    <div className="space-y-2 pt-2">
                      <Progress value={exportProgress} />
                      <div className="text-xs text-muted-foreground">
                        {isExporting ? 'Exporting…' : exportProgress === 100 ? 'Done' : 'Preparing…'}
                      </div>
                    </div>
                  )}

                  {exportResult && (
                    <Alert className="mt-2" variant={exportResult.success ? 'default' : 'destructive' as any}>
                      <AlertDescription className="flex items-center gap-2">
                        {exportResult.success ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {exportResult.message}
                            {exportResult.url && (
                              <a
                                href={exportResult.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            {exportResult.message}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default CVExportDialog
