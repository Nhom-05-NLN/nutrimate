ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nutrition_goal VARCHAR(20)
  CHECK (nutrition_goal IN ('lose_weight', 'maintain_weight', 'gain_weight'));
