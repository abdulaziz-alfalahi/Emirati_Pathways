
-- Function to get column names of a table
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' AND 
    c.table_name = table_name;
END;
$$;
