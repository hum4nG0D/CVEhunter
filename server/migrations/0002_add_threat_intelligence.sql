-- Add new columns for threat intelligence
ALTER TABLE cve_records
ADD COLUMN threat_intelligence TEXT,
ADD COLUMN threat_context TEXT; 