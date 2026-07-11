-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_preferences jsonb NOT NULL,
  meal_plan jsonb NOT NULL,
  grocery_list jsonb NOT NULL,
  budget_summary jsonb NOT NULL,
  validation_passed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS meal_plans_created_at_idx ON meal_plans(created_at);

-- Enable RLS (Row Level Security) if needed for multi-user scenarios
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view only their own meal plans
CREATE POLICY "Users can view their own meal plans" ON meal_plans
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Create a policy to allow users to insert their own meal plans
CREATE POLICY "Users can insert their own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Create a policy to allow users to update their own meal plans
CREATE POLICY "Users can update their own meal plans" ON meal_plans
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Add comment to table
COMMENT ON TABLE meal_plans IS 'Stores generated meal plans with user preferences, grocery list, and budget calculations';
