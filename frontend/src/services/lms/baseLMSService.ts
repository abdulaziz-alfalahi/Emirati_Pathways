export class BaseLMSService {
  protected async getCurrentUser() {
    // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    return user.user;
  }

  protected handleError(error: any, operation: string) {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }
}
