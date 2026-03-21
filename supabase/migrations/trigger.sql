CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (new.raw_user_meta_data->>'role' = 'student') THEN
    INSERT INTO public.student_profiles (id, full_name, student_id, email)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'student_id',
      new.email
    );
  ELSIF (new.raw_user_meta_data->>'role' = 'org') THEN
    INSERT INTO public.organization_profiles (id, org_name, email)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      new.email
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();



-- Trigger Function for dynamic logbooks
CREATE OR REPLACE FUNCTION validate_logbook_week_limit()
RETURNS TRIGGER AS $$
DECLARE
    max_weeks INTEGER;
BEGIN
    SELECT duration_weeks INTO max_weeks 
    FROM placements 
    WHERE id = NEW.placement_id;

    IF NEW.week_number > max_weeks THEN
        RAISE EXCEPTION 'Week number % exceeds the allowed duration (%) for this placement.', NEW.week_number, max_weeks;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_week_limit
BEFORE INSERT OR UPDATE ON logbook_weeks
FOR EACH ROW EXECUTE FUNCTION validate_logbook_week_limit();


CREATE OR REPLACE FUNCTION handle_student_placement() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'allocated' THEN  
    UPDATE student_preferences 
    SET is_searching = false 
    WHERE student_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_placed
  AFTER UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_student_placement();


  -- 1. Add the column
ALTER TABLE organization_vacancies 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Create a function to auto-update the timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create the trigger
CREATE TRIGGER update_vacancies_modtime
    BEFORE UPDATE ON organization_vacancies
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();



CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'role' = 'org') THEN
    INSERT INTO public.organization_profiles (id, org_name, email, industry)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NEW.raw_user_meta_data->>'industry' 
    );
  ELSIF (NEW.raw_user_meta_data->>'role' = 'student') THEN
    INSERT INTO public.student_profiles (id, full_name, email)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;