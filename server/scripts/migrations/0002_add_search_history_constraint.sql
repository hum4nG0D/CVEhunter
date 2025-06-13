-- Add unique constraint to search_history table
ALTER TABLE search_history ADD CONSTRAINT search_history_cve_id_key UNIQUE (cve_id); 