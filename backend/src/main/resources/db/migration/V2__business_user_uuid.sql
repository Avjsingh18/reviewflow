ALTER TABLE businesses
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

ALTER TABLE businesses
  ADD CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
