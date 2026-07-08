ALTER TABLE services ADD COLUMN description text;

COMMENT ON COLUMN services.description IS 'Brief service description shown in booking selector and service menu';
