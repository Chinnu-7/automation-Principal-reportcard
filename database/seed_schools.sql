-- Seed Data for Schools Table
INSERT INTO schools (school_id, school_name, principal_email, district, address, phone) VALUES
('SCH001', 'Green Valley High School', 'principal@greenvalley.edu', 'North District', '123 Education Lane', '+91-9876543210'),
('SCH002', 'Sunrise Academy', 'principal@sunriseacademy.edu', 'South District', '456 Learning Street', '+91-9876543211'),
('SCH003', 'Bright Future School', 'principal@brightfuture.edu', 'East District', '789 Knowledge Road', '+91-9876543212'),
('SCH004', 'Riverdale International', 'contact@riverdale.edu', 'West District', '321 River Road', '+91-9876543213'),
('SCH005', 'St. Marys Convent', 'info@stmarys.edu', 'Central District', '555 Saint Ave', '+91-9876543214')
ON DUPLICATE KEY UPDATE school_name = VALUES(school_name);
