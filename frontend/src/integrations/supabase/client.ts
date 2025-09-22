// Mock Supabase client for local development
// This prevents Supabase errors while using local backend

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:5001';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

console.log('Using mock Supabase client - URL:', supabaseUrl );

// Create a mock Supabase client that doesn't actually connect
export const supabase = {
  auth: {
    mfa: {
      listFactors: () => Promise.resolve({ data: [], error: null }),
      enroll: () => Promise.resolve({ data: null, error: null }),
      unenroll: () => Promise.resolve({ error: null }),
      challenge: () => Promise.resolve({ data: { id: 'dummy' }, error: null }),
      verify: () => Promise.resolve({ data: null, error: null })
    }
  },
  from: (table) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      download: () => Promise.resolve({ data: null, error: null })
    })
  }
};

// Export the URL and key as constants
export const VITE_SUPABASE_URL = supabaseUrl;
export const VITE_SUPABASE_ANON_KEY = supabaseKey;

console.log('? Mock Supabase client initialized for local development');
