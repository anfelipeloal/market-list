-- The starting Categories every new Household begins with. As a migration this runs exactly once
-- per database, on the deploy that first applies it, so it can never re-create Categories an Admin
-- deleted later. Normalized names were computed with the app's own normalizeName.
-- ON CONFLICT covers databases seeded earlier by the retired db:seed script.
INSERT INTO "categories" ("name", "normalized_name") VALUES
  ('Frutas', 'frutas'),
  ('Verduras', 'verduras'),
  ('Lácteos y huevos', 'lacteos y huevos'),
  ('Carnes', 'carnes'),
  ('Granos y enlatados', 'granos y enlatados'),
  ('Congelados', 'congelados'),
  ('Bebidas', 'bebidas'),
  ('Aseo', 'aseo')
ON CONFLICT ("normalized_name") DO NOTHING;
