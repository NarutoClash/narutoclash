# Progresso da Migração Firebase → Supabase

## ✅ Páginas Migradas Completamente

1. ✅ **Layout Principal** (`src/app/layout.tsx`)
2. ✅ **Página Inicial** (`src/app/page.tsx`)
3. ✅ **Login** (`src/app/(auth)/login/page.tsx`)
4. ✅ **Registro** (`src/app/(auth)/register/page.tsx`)
5. ✅ **Recuperação de Senha** (`src/app/(auth)/forgot-password/page.tsx`)
6. ✅ **Layout do Dashboard** (`src/app/(dashboard)/layout.tsx`)
7. ✅ **Status** (`src/app/(dashboard)/status/page.tsx`)
8. ✅ **Clan** (`src/app/(dashboard)/clan/page.tsx`) - **COMPLEXA - MIGRADA**
9. ✅ **Create Character** (`src/app/create-character/page.tsx`)

## 🔄 Páginas Restantes para Migrar

1. ⏳ **Missions** (`src/app/(dashboard)/missions/page.tsx`)
2. ⏳ **Hunts** (`src/app/(dashboard)/hunts/page.tsx`)
3. ⏳ **Invasion** (`src/app/(dashboard)/invasion/page.tsx`)
4. ⏳ **Cursed Seal** (`src/app/(dashboard)/cursed-seal/page.tsx`)
5. ⏳ **Elements** (`src/app/(dashboard)/elements/page.tsx`)
6. ⏳ **Ichiraku** (`src/app/(dashboard)/ichiraku/page.tsx`)
7. ⏳ **Equipamentos** (`src/app/(dashboard)/equipamentos/page.tsx`)
8. ⏳ **Doujutsu** (`src/app/(dashboard)/doujutsu/page.tsx`)
9. ⏳ **Summons** (`src/app/(dashboard)/summons/page.tsx`)
10. ⏳ **Weapons** (`src/app/(dashboard)/weapons/page.tsx`)

## 📝 Padrões de Migração Identificados

### Substituições Comuns Necessárias:

1. **Imports:**
   - `import { useFirebase, useMemoFirebase } from '@/firebase'` → `import { useSupabase, useMemoSupabase } from '@/supabase'`
   - `import { useDoc } from '@/firebase/firestore/use-doc'` → `import { useDoc } from '@/supabase/hooks/use-doc'`
   - `import { doc, collection, writeBatch, increment, ... } from 'firebase/firestore'` → Remover (não necessário)
   - `import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates'` → `import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates'`

2. **Hooks:**
   - `const { user, firestore } = useFirebase()` → `const { user, supabase } = useSupabase()`
   - `useMemoFirebase(() => ...)` → `useMemoSupabase(() => ...)`
   - `doc(firestore, 'users', user.uid)` → `{ table: 'profiles', id: user.id }`

3. **Operações:**
   - `increment(value)` → Calcular manualmente: `(currentValue || 0) + value`
   - `writeBatch` → Operações diretas do Supabase ou SupabaseBatch
   - `updateDocumentNonBlocking(ref, data)` → `updateDocumentNonBlocking(ref, data, supabase)`

## 🎯 Próximos Passos

Continuar migrando as páginas restantes seguindo os padrões acima.
