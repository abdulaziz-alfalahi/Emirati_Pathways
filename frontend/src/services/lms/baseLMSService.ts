
import { supabase } from '@/integrations/supabase/client';

export class BaseLMSService {
  protected async getCurrentUser() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    return user.user;
  }

  protected handleError(error: any, operation: string) {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }
}
