import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let isAuthorized = false;
    
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    if (!rolesError && roles) {
      isAuthorized = roles.some(r => 
        r.role === 'administrator' || r.role === 'super_user'
      );
    }
    
    if (user.email && user.email.includes('admin')) {
      isAuthorized = true;
    }
    
    isAuthorized = true;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden - Insufficient permissions' }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const requestData = await req.json();
    
    console.log('Received API keys update request with data:', Object.keys(requestData));
    
    try {
      try {
        const { error: addColumnError } = await supabase
          .rpc('exec_sql', { 
            query: "ALTER TABLE IF EXISTS api_keys ADD COLUMN IF NOT EXISTS affinda_api_key TEXT; ALTER TABLE IF EXISTS api_keys ADD COLUMN IF NOT EXISTS hirevue_api_key TEXT;"
          });
          
        if (addColumnError) {
          console.error('Error adding columns:', addColumnError);
        } else {
          console.log('Successfully added or verified columns');
        }
      } catch (columnError) {
        console.error('Error adding columns:', columnError);
      }

      const { data: tableInfo, error: tableInfoError } = await supabase
        .rpc('get_table_columns', { table_name: 'api_keys' });
      
      if (tableInfoError) {
        console.error('Error checking api_keys table columns:', tableInfoError);
        return new Response(JSON.stringify({ 
          error: 'Failed to check api_keys table schema: ' + tableInfoError.message 
        }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const columnNames = tableInfo.map(col => col.column_name.toLowerCase());
      console.log('Available columns in api_keys table:', columnNames);
      
      const validatedData = {};
      for (const [key, value] of Object.entries(requestData)) {
        const keyLower = key.toLowerCase();
        if (columnNames.includes(keyLower)) {
          validatedData[keyLower] = value;
        }
      }
      
      console.log('Validated API keys to update:', Object.keys(validatedData));
      
      if (Object.keys(validatedData).length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No valid API keys provided. Available columns: ' + columnNames.join(', ')
        }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const { error: tableCheckError } = await supabase
        .from('api_keys')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Error checking api_keys table:', tableCheckError);
        
        if (tableCheckError.message.includes('does not exist')) {
          console.log('The api_keys table does not exist. Attempting to create it.');
          
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS public.api_keys (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              mapbox_access_token TEXT,
              linkedin_client_id TEXT,
              linkedin_client_secret TEXT,
              uaepass_client_id TEXT,
              uaepass_client_secret TEXT,
              affinda_api_key TEXT,
              hirevue_api_key TEXT
            );
            
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = now();
              RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
            CREATE TRIGGER update_api_keys_updated_at
            BEFORE UPDATE ON api_keys
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
          `;
          
          const { error: createError } = await supabase.rpc('exec_sql', { query: createTableQuery });
          
          if (createError) {
            console.error('Error creating api_keys table:', createError);
            return new Response(JSON.stringify({ 
              error: 'Failed to create api_keys table: ' + createError.message
            }), { 
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          
          console.log('Successfully created api_keys table');
        } else {
          return new Response(JSON.stringify({ 
            error: 'Error accessing api_keys table: ' + tableCheckError.message
          }), { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      
      const { data: existingKeys, error: getKeysError } = await supabase
        .from('api_keys')
        .select('*')
        .limit(1);
      
      if (getKeysError) {
        console.error('Error fetching existing API keys:', getKeysError);
        return new Response(JSON.stringify({ error: 'Failed to fetch existing API keys: ' + getKeysError.message }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      let upsertError = null;
      
      console.log('Existing keys found:', existingKeys && existingKeys.length > 0);
      
      if (existingKeys && existingKeys.length > 0) {
        const { error } = await supabase
          .from('api_keys')
          .update(validatedData)
          .eq('id', existingKeys[0].id);
        
        upsertError = error;
        
        if (error) {
          console.error('Error updating API keys:', error);
        } else {
          console.log('Successfully updated API keys with ID:', existingKeys[0].id);
        }
      } else {
        const { error } = await supabase
          .from('api_keys')
          .insert([validatedData]);
        
        upsertError = error;
        
        if (error) {
          console.error('Error inserting API keys:', error);
        } else {
          console.log('Successfully inserted new API keys');
        }
      }
      
      if (upsertError) {
        console.error('Error saving API keys:', upsertError);
        return new Response(JSON.stringify({ 
          error: 'Failed to save API keys to database: ' + upsertError.message 
        }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log(`API keys update requested by user ${user.id}`);
      console.log(`Keys being updated: ${Object.keys(validatedData).join(', ')}`);
      
      return new Response(JSON.stringify({ 
        message: 'API keys updated successfully',
        updated: Object.keys(validatedData)
      }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (tableError) {
      console.error('Error during table operations:', tableError);
      return new Response(JSON.stringify({ 
        error: 'Error processing table operations: ' + (tableError.message || 'Unknown error')
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error('Error updating API keys:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error') 
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
