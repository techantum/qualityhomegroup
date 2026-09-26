-- Custom header/footer scripts assigned to one or more site pages

CREATE TABLE IF NOT EXISTS site_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('header', 'footer')),
  page_slugs TEXT[] NOT NULL DEFAULT '{}',
  applies_to_all BOOLEAN NOT NULL DEFAULT FALSE,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_scripts_placement ON site_scripts(placement);
CREATE INDEX IF NOT EXISTS idx_site_scripts_active ON site_scripts(is_active);

ALTER TABLE site_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_site_scripts ON site_scripts;
CREATE POLICY public_read_site_scripts ON site_scripts FOR SELECT USING (true);

DROP POLICY IF EXISTS auth_write_site_scripts ON site_scripts;
CREATE POLICY auth_write_site_scripts ON site_scripts
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
