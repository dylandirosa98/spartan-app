-- Seed Spartan Exteriors company and Dylan user
-- NOTE: You'll need to replace 'YOUR_ENCRYPTED_API_KEY' with the actual encrypted Twenty CRM API key

-- Insert Spartan Exteriors company
INSERT INTO companies (
  name,
  contact_email,
  contact_phone,
  address,
  city,
  state,
  zip_code,
  twenty_api_url,
  twenty_api_key,
  is_active
) VALUES (
  'Spartan Exteriors',
  'dylan@thespartanexteriors.com',
  '555-0100',
  '123 Main Street',
  'Chicago',
  'IL',
  '60601',
  'https://crm.thespartanexteriors.com/rest',
  'YOUR_ENCRYPTED_API_KEY_HERE', -- Replace with encrypted key from admin panel
  true
) ON CONFLICT (name) DO NOTHING;

-- Insert Dylan as owner for Spartan Exteriors
-- Password: Bubs2shiesty$ (you should hash this properly in production)
INSERT INTO users (
  company_id,
  name,
  email,
  password_hash,
  role,
  is_active
) VALUES (
  (SELECT id FROM companies WHERE name = 'Spartan Exteriors'),
  'Dylan DiRosa',
  'dylan@thespartanexteriors.com',
  'Bubs2shiesty$', -- WARNING: This should be properly hashed in production!
  'owner',
  true
) ON CONFLICT (email) DO NOTHING;
