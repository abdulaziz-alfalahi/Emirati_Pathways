import { BaseLMSService } from './baseLMSService';
import type { Certificate } from '@/types/lms';

export class CertificateService extends BaseLMSService {
  async generateCertificate(courseId: string, enrollmentId: string): Promise<Certificate> {
    try {
      const user = await this.getCurrentUser();

      const certificateNumber = `CERT-${Date.now()}-${user.id.slice(0, 8)}`;

      const { data, error } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          course_id: courseId,
          enrollment_id: enrollmentId,
          certificate_number: certificateNumber,
          template_data: {
            issueDate: new Date().toISOString(),
            recipientName: user.email
          }
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        template_data: data.template_data as Record<string, any>
      };
    } catch (error) {
      throw this.handleError(error, 'generateCertificate');
    }
  }

  async getUserCertificates(): Promise<Certificate[]> {
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          courses:course_id (
            title,
            instructor_id
          )
        `)
        .eq('user_id', user.user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        template_data: item.template_data as Record<string, any>
      }));
    } catch (error) {
      throw this.handleError(error, 'getUserCertificates');
    }
  }
}

export const certificateService = new CertificateService();
