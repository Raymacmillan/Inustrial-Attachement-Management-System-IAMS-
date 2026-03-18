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