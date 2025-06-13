CREATE TABLE IF NOT EXISTS cve_records (
  id SERIAL PRIMARY KEY,
  cve_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  cvss_score REAL,
  severity TEXT,
  published TEXT,
  modified TEXT,
  epss_score REAL,
  epss_percentile REAL,
  cvss_vector TEXT,
  attack_vector TEXT,
  attack_complexity TEXT,
  privileges TEXT,
  user_interaction TEXT,
  affected_products TEXT,
  known_exploits TEXT,
  related_news TEXT,
  rhel_advisory TEXT,
  shodan_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  cve_id TEXT NOT NULL,
  description TEXT,
  search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 