export interface ConfidenceMetrics {
  overallConfidence: number;
  fieldConfidences: Record<string, number>;
  validationScore: number;
  processingTime: number;
  timestamp: Date;
}

export class ConfidenceMonitor {
  private metrics: ConfidenceMetrics[] = [];
  
  addMetrics(metrics: ConfidenceMetrics) {
    this.metrics.push(metrics);
    
    // Keep only last 100 entries
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Log warnings for low confidence
    if (metrics.overallConfidence < 0.8) {
      console.warn(`⚠️ Low parsing confidence: ${(metrics.overallConfidence * 100).toFixed(1)}%`);
    }
    
    // Log field-specific issues
    Object.entries(metrics.fieldConfidences).forEach(([field, confidence]) => {
      if (confidence < 0.7) {
        console.warn(`⚠️ Low confidence for ${field}: ${(confidence * 100).toFixed(1)}%`);
      }
    });
  }
  
  getAverageConfidence(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.overallConfidence, 0) / this.metrics.length;
  }
  
  getFieldAccuracyTrends(): Record<string, number> {
    const fieldTrends: Record<string, number[]> = {};
    
    this.metrics.forEach(metric => {
      Object.entries(metric.fieldConfidences).forEach(([field, confidence]) => {
        if (!fieldTrends[field]) fieldTrends[field] = [];
        fieldTrends[field].push(confidence);
      });
    });
    
    const averages: Record<string, number> = {};
    Object.entries(fieldTrends).forEach(([field, confidences]) => {
      averages[field] = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    });
    
    return averages;
  }
  
  generateReport(): string {
    const avgConfidence = this.getAverageConfidence();
    const fieldTrends = this.getFieldAccuracyTrends();
    
    let report = `# Parsing Confidence Report\n\n`;
    report += `**Overall Average Confidence:** ${(avgConfidence * 100).toFixed(1)}%\n\n`;
    report += `**Field-Level Confidence:**\n`;
    
    Object.entries(fieldTrends)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, confidence]) => {
        const status = confidence >= 0.9 ? '✅' : confidence >= 0.7 ? '⚠️' : '❌';
        report += `- ${status} ${field}: ${(confidence * 100).toFixed(1)}%\n`;
      });
    
    return report;
  }
}

// Export singleton instance
export const confidenceMonitor = new ConfidenceMonitor();
