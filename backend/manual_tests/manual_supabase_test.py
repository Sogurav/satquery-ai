from app.db.supabase import supabase

print("Supabase connection created successfully!")
print("Project URL:", supabase.supabase_url)

response = supabase.table("profiles").select("*").execute()

print("Database connection successful!")
print("Profiles rows:", response.data)