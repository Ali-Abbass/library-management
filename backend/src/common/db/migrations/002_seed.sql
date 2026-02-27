insert into users (id, full_name, email, roles, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Demo Patron', 'patron@example.com', '{patron}', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Casey Reader', 'casey.reader@example.com', '{patron}', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Jordan Pending', 'jordan.pending@example.com', '{patron}', 'pending_approval'),
  ('00000000-0000-0000-0000-000000000004', 'Sam Staff', 'sam.staff@example.com', '{staff}', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'Avery Admin', 'avery.admin@example.com', '{admin}', 'active'),
  ('00000000-0000-0000-0000-000000000006', 'Taylor Ops', 'taylor.ops@example.com', '{staff,patron}', 'active'),
  ('00000000-0000-0000-0000-000000000007', 'Morgan Manager', 'morgan.manager@example.com', '{admin,staff}', 'active'),
  ('00000000-0000-0000-0000-000000000008', 'Riley New', 'riley.new@example.com', '{patron}', 'pending_approval')
on conflict do nothing;

insert into books (id, title, authors, description, tags, genres, page_count, status)
values
  ('11111111-1111-1111-1111-111111111111', 'The Async Journey', '{Ada Lovelace}', 'A guide to async systems.', '{systems,async}', '{technology}', 320, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Library of Light', '{James T.}', 'An overview of modern libraries.', '{libraries}', '{education}', 210, 'active'),
  ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Catalog Craft', '{Morgan Lee}', 'Building resilient metadata systems.', '{metadata,catalog}', '{technology}', 280, 'active'),
  ('44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Quiet Stacks', '{Priya Anand}', 'Designing calm reading spaces.', '{design,spaces}', '{architecture}', 196, 'active'),
  ('55555555-cccc-cccc-cccc-cccccccccccc', 'Borrowed Time', '{Leah K}', 'Loan policies and patron trust.', '{loans,policy}', '{management}', 224, 'active'),
  ('66666666-dddd-dddd-dddd-dddddddddddd', 'Data in the Margins', '{S. Rivera}', 'Notes on archival data ethics.', '{archives,ethics}', '{history}', 308, 'active'),
  ('77777777-eeee-eeee-eeee-eeeeeeeeeeee', 'Signals and Shelves', '{Omar V}', 'Finding books by meaning.', '{search,ai}', '{technology}', 254, 'active'),
  ('88888888-ffff-ffff-ffff-ffffffffffff', 'The Reading Hour', '{Nora Bell}', 'Reading habits and time.', '{reading,time}', '{education}', 180, 'active'),
  ('99999999-1111-1111-1111-111111111112', 'Genre Drift', '{K. Murphy}', 'Tracking popular genres.', '{genres,analytics}', '{technology}', 230, 'active'),
  ('99999999-1111-1111-1111-111111111113', 'Ink & Index', '{H. Park}', 'Indexing strategies for discovery.', '{indexing,search}', '{technology}', 212, 'active'),
  ('99999999-1111-1111-1111-111111111114', 'Patron Pathways', '{E. Singh}', 'Designing borrower journeys.', '{ux,patrons}', '{management}', 204, 'active'),
  ('99999999-1111-1111-1111-111111111115', 'Return to Sender', '{M. Chen}', 'Efficient return workflows.', '{returns,loans}', '{management}', 176, 'active'),
  ('99999999-1111-1111-1111-111111111116', 'Stacks at Scale', '{A. Ibrahim}', 'Scaling library operations.', '{operations,scale}', '{management}', 260, 'active'),
  ('99999999-1111-1111-1111-111111111117', 'The Catalog Atlas', '{F. Gomez}', 'Global catalog standards.', '{catalog,standards}', '{education}', 292, 'active'),
  ('99999999-1111-1111-1111-111111111118', 'Lost & Found', '{T. Yates}', 'Managing lost items.', '{inventory,policy}', '{management}', 168, 'active'),
  ('99999999-1111-1111-1111-111111111119', 'Restore & Renew', '{J. Klein}', 'Archiving and restoring books.', '{archive,restore}', '{management}', 190, 'active'),
  ('99999999-1111-1111-1111-111111111120', 'Shelf Signals', '{L. Duarte}', 'Behavioral analytics for libraries.', '{analytics,insights}', '{technology}', 248, 'active'),
  ('99999999-1111-1111-1111-111111111121', 'The Staff Ledger', '{R. Novak}', 'Operational playbooks.', '{staff,operations}', '{management}', 205, 'active'),
  ('99999999-1111-1111-1111-111111111122', 'Metadata Moments', '{P. Alvarez}', 'Small metadata, big impact.', '{metadata,quality}', '{technology}', 172, 'active'),
  ('99999999-1111-1111-1111-111111111123', 'Hours of Ink', '{D. Cho}', 'Estimating reading time.', '{reading,time}', '{education}', 150, 'active'),
  ('99999999-1111-1111-1111-111111111124', 'Semantic Streets', '{S. Ali}', 'Semantic search for discovery.', '{search,semantic}', '{technology}', 266, 'active'),
  ('99999999-1111-1111-1111-111111111125', 'Overdue Notices', '{K. Patel}', 'Designing effective alerts.', '{alerts,overdue}', '{management}', 140, 'active'),
  ('99999999-1111-1111-1111-111111111126', 'The Borrower File', '{G. Santos}', 'Patron data stewardship.', '{patrons,data}', '{management}', 188, 'active'),
  ('99999999-1111-1111-1111-111111111127', 'Rooms of Reading', '{M. Iqbal}', 'Library architecture today.', '{architecture,design}', '{architecture}', 236, 'active'),
  ('99999999-1111-1111-1111-111111111128', 'Knowledge Commons', '{A. Brooks}', 'Community-led collections.', '{community,collections}', '{education}', 220, 'active'),
  ('99999999-1111-1111-1111-111111111129', 'The Archive Map', '{J. Petrov}', 'Navigating special collections.', '{archives,collections}', '{history}', 270, 'active'),
  ('99999999-1111-1111-1111-111111111130', 'Signals of Demand', '{Y. Hassan}', 'Forecasting popular genres.', '{analytics,forecast}', '{technology}', 210, 'active'),
  ('99999999-1111-1111-1111-111111111131', 'The Copy Ledger', '{C. Nguyen}', 'Tracking copy health.', '{copies,inventory}', '{management}', 160, 'active'),
  ('99999999-1111-1111-1111-111111111132', 'Checkout Craft', '{R. Kim}', 'Designing checkout flows.', '{loans,ux}', '{management}', 182, 'active'),
  ('99999999-1111-1111-1111-111111111133', 'Index to Insight', '{B. Ahmed}', 'Analytics for catalog teams.', '{analytics,catalog}', '{technology}', 214, 'active'),
  ('99999999-1111-1111-1111-111111111134', 'The Night Shift', '{V. Costa}', 'After-hours operations.', '{operations,staff}', '{management}', 198, 'active'),
  ('99999999-1111-1111-1111-111111111135', 'Reshelving Rhythm', '{N. Park}', 'Organizing daily circulation.', '{circulation,operations}', '{management}', 156, 'active'),
  ('99999999-1111-1111-1111-111111111136', 'Tags that Work', '{I. Patel}', 'Practical tagging systems.', '{tags,metadata}', '{technology}', 172, 'active'),
  ('99999999-1111-1111-1111-111111111137', 'Digital Stacks', '{A. Harper}', 'Hybrid collections strategy.', '{digital,collections}', '{education}', 240, 'active')
on conflict do nothing;

insert into copies (id, book_id, barcode, location, status)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'BC-0001', 'Main Hall', 'available'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'BC-0002', 'Stacks', 'available')
on conflict do nothing;

insert into loan_requests (id, user_id, book_id, status, note)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'pending', 'Need for upcoming class'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'fulfilled', 'Handled at circulation desk')
on conflict do nothing;
