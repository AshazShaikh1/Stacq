INSERT INTO public.profiles (id, username, display_name, avatar_url)
VALUES ('00000000-0000-0000-0000-000000000000', 'stacq_test_user', 'Test Curator', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;
