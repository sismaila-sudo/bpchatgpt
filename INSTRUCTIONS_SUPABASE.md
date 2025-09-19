# 🔨 INSTRUCTIONS SUPABASE - CRÉER LES TABLES

## 📋 ÉTAPES À SUIVRE

### 1. **Aller dans Supabase Dashboard**
- Ouvrir : https://supabase.com/dashboard
- Sélectionner le projet : **nddimpfyofoopjnroswf**
- Aller dans : **SQL Editor**

### 2. **Exécuter le script SQL**
Copier-coller le contenu ci-dessous dans l'éditeur SQL et cliquer **"Run"** :

```sql
-- Table pour les sections générées du business plan
CREATE TABLE IF NOT EXISTS public.business_plan_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('resume', 'presentation', 'marche', 'strategie', 'organisation', 'risques', 'conclusion')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'final')),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    metrics_used TEXT[],
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les informations du porteur de projet
CREATE TABLE IF NOT EXISTS public.project_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    title TEXT,
    experience_years INTEGER,
    motivation TEXT,
    vision TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_project_owner UNIQUE (project_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_business_plan_sections_project_id ON public.business_plan_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_owners_project_id ON public.project_owners(project_id);

-- Fonction pour compter les mots
CREATE OR REPLACE FUNCTION calculate_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le nombre de mots
CREATE TRIGGER business_plan_sections_word_count
    BEFORE INSERT OR UPDATE OF content ON public.business_plan_sections
    FOR EACH ROW
    EXECUTE FUNCTION calculate_word_count();

SELECT 'Tables créées avec succès!' as message;
```

### 3. **Vérifier la création**
Après exécution, tu devrais voir : **"Tables créées avec succès!"**