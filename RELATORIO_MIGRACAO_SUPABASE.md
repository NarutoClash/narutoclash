# Relatório de Migração: Firebase → Supabase

## 📋 Resumo Executivo

O projeto ainda está **100% usando Firebase**. Nenhuma migração para Supabase foi realizada. Este documento lista todos os componentes, arquivos e funcionalidades que precisam ser migrados.

---

## 🔴 Status Atual

- ✅ **Firebase instalado**: `firebase@11.9.1` no `package.json`
- ❌ **Supabase NÃO instalado**: Nenhuma dependência do Supabase encontrada
- ❌ **Configuração Supabase**: Nenhum arquivo de configuração do Supabase encontrado
- ❌ **Código migrado**: 0% do código foi migrado

---

## 📦 1. DEPENDÊNCIAS (package.json)

### ❌ Falta Instalar:
```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@supabase/auth-helpers-nextjs": "^0.x.x" (opcional, para Next.js)
}
```

### ⚠️ Pode Remover (após migração completa):
- `firebase: ^11.9.1`

---

## 🔧 2. CONFIGURAÇÃO E INICIALIZAÇÃO

### ❌ Arquivos que precisam ser criados/modificados:

#### 2.1. `src/supabase/config.ts` (NOVO)
- Criar arquivo de configuração do Supabase
- Substituir `src/firebase/config.ts`
- Configurar variáveis de ambiente:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 2.2. `src/supabase/client.ts` (NOVO)
- Criar cliente Supabase para uso no cliente
- Substituir `src/firebase/index.ts`

#### 2.3. `src/supabase/server.ts` (NOVO)
- Criar cliente Supabase para uso no servidor (se necessário)

#### 2.4. Variáveis de Ambiente (`.env.local`)
- Adicionar:
  ```
  NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
  ```

---

## 🎣 3. HOOKS E PROVIDERS

### ❌ Arquivos que precisam ser criados/modificados:

#### 3.1. `src/supabase/provider.tsx` (NOVO)
- Substituir `src/firebase/provider.tsx`
- Migrar:
  - `FirebaseProvider` → `SupabaseProvider`
  - `FirebaseContext` → `SupabaseContext`
  - `useFirebase()` → `useSupabase()`
  - Gerenciamento de estado de autenticação

#### 3.2. `src/supabase/client-provider.tsx` (NOVO)
- Substituir `src/firebase/client-provider.tsx`
- Migrar `FirebaseClientProvider` → `SupabaseClientProvider`

#### 3.3. `src/supabase/index.ts` (NOVO)
- Substituir `src/firebase/index.ts`
- Exportar todos os hooks e providers do Supabase

---

## 🗄️ 4. FIRESTORE → SUPABASE DATABASE

### ❌ Hooks que precisam ser recriados:

#### 4.1. `src/supabase/hooks/use-doc.tsx` (NOVO)
- Substituir `src/firebase/firestore/use-doc.tsx`
- Migrar de `onSnapshot` (Firestore) para `useEffect` + `supabase.from().select()`
- Manter a mesma interface: `{ data, isLoading, error, setData }`

#### 4.2. `src/supabase/hooks/use-collection.tsx` (NOVO)
- Substituir `src/firebase/firestore/use-collection.tsx`
- Migrar de `onSnapshot` para subscriptions do Supabase Realtime
- Manter a mesma interface: `{ data, isLoading, error }`

#### 4.3. `src/supabase/hooks/use-memo.tsx` (NOVO)
- Substituir `useMemoFirebase` → `useMemoSupabase`
- Adaptar para referências do Supabase

---

## 🔐 5. AUTENTICAÇÃO

### ❌ Arquivos que precisam ser modificados:

#### 5.1. `src/app/(auth)/login/page.tsx`
- **Linha 27-31**: Substituir imports do Firebase Auth
- **Linha 42**: `useFirebase()` → `useSupabase()`
- **Linha 75**: `signInWithEmailAndPassword(auth, ...)` → `supabase.auth.signInWithPassword(...)`
- **Linha 77**: `userCredential.user.reload()` → Adaptar para Supabase
- **Linha 79**: `userCredential.user.emailVerified` → `user.email?.confirmed_at`
- **Linha 64**: `sendEmailVerification()` → `supabase.auth.resend()`
- **Linha 98**: `FirebaseError` → Tratar erros do Supabase

#### 5.2. `src/app/(auth)/register/page.tsx`
- **Linha 27-30**: Substituir imports do Firebase Auth
- **Linha 56**: `useFirebase()` → `useSupabase()`
- **Linha 67**: `createUserWithEmailAndPassword()` → `supabase.auth.signUp(...)`
- **Linha 68**: `sendEmailVerification()` → Remover (Supabase envia automaticamente)
- **Linha 79**: `FirebaseError` → Tratar erros do Supabase

#### 5.3. `src/app/(auth)/forgot-password/page.tsx`
- **Linha 27-30**: Substituir imports do Firebase Auth
- **Linha 41**: `useFirebase()` → `useSupabase()`
- **Linha 45**: `sendPasswordResetEmail()` → `supabase.auth.resetPasswordForEmail(...)`
- **Linha 63**: `FirebaseError` → Tratar erros do Supabase

---

## 📄 6. PÁGINAS DO DASHBOARD

### ❌ Arquivos que precisam ser modificados:

#### 6.1. `src/app/(dashboard)/layout.tsx`
- **Linha 46-48**: Substituir imports do Firebase
- **Linha 54**: `signOut` do Firebase → `supabase.auth.signOut()`
- **Linha 69**: `useFirebase()` → `useSupabase()`
- **Linha 72-77**: Adaptar referências de documentos

#### 6.2. `src/app/(dashboard)/status/page.tsx`
- **Linha 20-23**: Substituir imports do Firestore
- **Linha 257**: `useFirebase()` → `useSupabase()`
- **Linha 260**: Adaptar referências de documentos
- **Linha 21**: `increment`, `writeBatch` → Adaptar para Supabase (usar RPC ou updates diretos)

#### 6.3. `src/app/(dashboard)/missions/page.tsx`
- **Linha 7-14**: Substituir imports do Firestore
- **Linha 169**: `useFirebase()` → `useSupabase()`
- **Linha 10**: `writeBatch`, `increment` → Adaptar para Supabase

#### 6.4. `src/app/(dashboard)/hunts/page.tsx`
- **Linha 22-24**: Substituir imports do Firestore
- **Linha 58**: `useFirebase()` → `useSupabase()`
- **Linha 24**: `increment`, `writeBatch` → Adaptar para Supabase

#### 6.5. `src/app/(dashboard)/invasion/page.tsx`
- **Linha 17-23**: Substituir imports do Firestore
- **Linha 51**: `useFirebase()` → `useSupabase()`
- **Linha 18**: `writeBatch`, `increment`, `setDoc`, `getDoc` → Adaptar para Supabase

#### 6.6. `src/app/(dashboard)/cursed-seal/page.tsx`
- **Linha 14-20**: Substituir imports do Firestore
- **Linha 59**: `useFirebase()` → `useSupabase()`

#### 6.7. `src/app/(dashboard)/elements/page.tsx`
- **Linha 17-20**: Substituir imports do Firestore
- **Linha 100**: `useFirebase()` → `useSupabase()`

#### 6.8. `src/app/(dashboard)/ichiraku/page.tsx`
- **Linha 6-8**: Substituir imports do Firestore
- **Linha 64**: `useFirebase()` → `useSupabase()`
- **Linha 8**: `increment`, `writeBatch` → Adaptar para Supabase

#### 6.9. `src/app/(dashboard)/clan/page.tsx`
- **Linha 29-36**: Substituir imports do Firestore
- **Linha 57**: `useFirebase()` → `useSupabase()`
- **Linha 30**: Múltiplas funções do Firestore (`writeBatch`, `query`, `where`, etc.) → Adaptar para Supabase
- **Subcollections**: `clans/{id}/members` e `clans/{id}/joinRequests` precisam ser adaptadas (Supabase não tem subcollections, usar tabelas relacionadas)

#### 6.10. `src/app/(dashboard)/equipamentos/page.tsx`
- **Linha 8-17**: Substituir imports do Firestore
- Adaptar `arrayUnion`, `arrayRemove` → Operações de array do Supabase

#### 6.11. `src/app/(dashboard)/doujutsu/page.tsx`
- **Linha 13-19**: Substituir imports do Firestore

#### 6.12. `src/app/(dashboard)/summons/page.tsx`
- **Linha 6-15**: Substituir imports do Firestore
- **Linha 8**: `increment` → Adaptar para Supabase

#### 6.13. `src/app/(dashboard)/weapons/page.tsx`
- **Linha 6-15**: Substituir imports do Firestore
- **Linha 8**: `increment` → Adaptar para Supabase

#### 6.14. `src/app/create-character/page.tsx`
- **Linha 37-38**: Substituir imports do Firestore
- **Linha 66**: `useFirebase()` → `useSupabase()`
- **Linha 38**: `setDoc` → `supabase.from('users').insert()`

#### 6.15. `src/app/page.tsx`
- **Linha 6-8**: Substituir imports do Firebase Auth
- **Linha 12**: `useFirebase()` → `useSupabase()`
- **Linha 8**: `signOut` → `supabase.auth.signOut()`

---

## 🛠️ 7. UTILITÁRIOS E HELPERS

### ❌ Arquivos que precisam ser criados/modificados:

#### 7.1. `src/supabase/non-blocking-updates.tsx` (NOVO)
- Substituir `src/firebase/non-blocking-updates.tsx`
- Migrar funções:
  - `setDocumentNonBlocking()` → `supabase.from().insert().then()`
  - `addDocumentNonBlocking()` → `supabase.from().insert().then()`
  - `updateDocumentNonBlocking()` → `supabase.from().update().then()`
  - `deleteDocumentNonBlocking()` → `supabase.from().delete().then()`

#### 7.2. `src/supabase/errors.ts` (NOVO)
- Substituir `src/firebase/errors.ts`
- Adaptar `FirestorePermissionError` → `SupabasePermissionError`
- Adaptar para erros do Supabase (PostgreSQL/RLS)

#### 7.3. `src/supabase/error-emitter.ts` (NOVO)
- Substituir `src/firebase/error-emitter.ts`
- Manter a mesma estrutura, mas adaptar tipos de erro

---

## 🎨 8. COMPONENTES

### ❌ Arquivos que precisam ser modificados:

#### 8.1. `src/components/FirebaseErrorListener.tsx`
- Renomear para `SupabaseErrorListener.tsx`
- Substituir imports de `@/firebase/error-emitter` e `@/firebase/errors`
- Adaptar para erros do Supabase

#### 8.2. `src/app/layout.tsx`
- **Linha 4**: `FirebaseClientProvider` → `SupabaseClientProvider`
- **Linha 27**: Atualizar o provider usado

---

## 🔒 9. REGRAS DE SEGURANÇA

### ❌ Migração de Firestore Rules para RLS (Row Level Security)

#### 9.1. `firestore.rules` → Políticas RLS do Supabase
- **Arquivo atual**: `firestore.rules` (147 linhas)
- **Ação**: Criar políticas RLS no Supabase Dashboard ou via SQL migrations

#### Regras que precisam ser migradas:

1. **Dados Públicos (Read Only)**:
   - `missions`, `weapons`, `equipments`, `ichiraku`, `bosses`, `summons`, `arenas`, `matches`, `dojutsu`
   - Migrar para: Políticas RLS `SELECT` públicas

2. **Users (Private)**:
   - `users/{userId}` - apenas o próprio usuário pode ler/escrever
   - Migrar para: `auth.uid() = user_id` nas políticas

3. **World Bosses**:
   - Read público, Write autenticado
   - Migrar para: `SELECT` público, `INSERT/UPDATE` com `auth.role() = 'authenticated'`

4. **Clans** (mais complexo):
   - Read público
   - Create: apenas o líder
   - Update/Delete: apenas líder
   - **Subcollections**: `members` e `joinRequests` precisam ser tabelas separadas no Supabase
   - Migrar para: Tabelas relacionadas + políticas RLS complexas

#### 9.2. SQL Migrations (NOVO)
- Criar arquivo `supabase/migrations/001_initial_schema.sql`
- Definir todas as tabelas
- Criar políticas RLS
- Criar funções necessárias (ex: `isClanLeader`, `isClanManager`)

---

## 📊 10. ESTRUTURA DE DADOS

### ⚠️ Diferenças Importantes:

#### 10.1. Subcollections → Tabelas Relacionadas
Firebase Firestore permite subcollections:
```
clans/{clanId}/members/{userId}
clans/{clanId}/joinRequests/{userId}
```

Supabase (PostgreSQL) requer tabelas relacionadas:
```sql
clans (id, name, tag, ...)
clan_members (id, clan_id, user_id, role, ...)
clan_join_requests (id, clan_id, user_id, ...)
```

#### 10.2. Tipos de Dados
- Firestore: Documentos JSON flexíveis
- Supabase: Schema SQL rígido (mas suporta JSONB)

#### 10.3. Operações Especiais
- `increment()` → `UPDATE table SET field = field + value`
- `arrayUnion()` → `UPDATE table SET array_field = array_field || ARRAY[value]`
- `arrayRemove()` → `UPDATE table SET array_field = array_remove(array_field, value)`
- `writeBatch()` → Transações SQL ou múltiplas queries

---

## 🧪 11. TESTES E VALIDAÇÃO

### ❌ Checklist de Validação:

- [ ] Autenticação funciona (login, registro, logout)
- [ ] Verificação de email funciona
- [ ] Reset de senha funciona
- [ ] Leitura de dados públicos funciona
- [ ] Escrita de dados do usuário funciona
- [ ] Operações de increment funcionam
- [ ] Operações de array (union/remove) funcionam
- [ ] Sistema de clans funciona (mais complexo)
- [ ] World Boss funciona
- [ ] Todas as páginas do dashboard carregam corretamente
- [ ] Realtime subscriptions funcionam (se necessário)

---

## 📝 12. ARQUIVOS DE CONFIGURAÇÃO

### ❌ Arquivos que podem ser removidos (após migração):

- `firestore.rules`
- `src/firebase/` (toda a pasta)
- `src/components/FirebaseErrorListener.tsx` (renomear/migrar)

### ✅ Arquivos que precisam ser criados:

- `supabase/config.toml` (opcional, para desenvolvimento local)
- `supabase/migrations/` (pasta com migrations SQL)

---

## 🚀 13. PRÓXIMOS PASSOS RECOMENDADOS

1. **Instalar Supabase**: `npm install @supabase/supabase-js`
2. **Criar projeto no Supabase**: https://supabase.com
3. **Configurar variáveis de ambiente**
4. **Criar schema do banco de dados** (migrar estrutura do Firestore)
5. **Criar políticas RLS** (migrar regras de segurança)
6. **Migrar providers e hooks** (começar pelos básicos)
7. **Migrar autenticação** (login, registro, etc.)
8. **Migrar páginas uma por uma** (começar pelas mais simples)
9. **Testar cada funcionalidade**
10. **Remover código do Firebase**

---

## ⚠️ 14. PONTOS DE ATENÇÃO

1. **Subcollections**: O sistema de clans usa subcollections que precisam ser redesenhadas como tabelas relacionadas
2. **Realtime**: Se o projeto usa realtime do Firestore, precisa usar Supabase Realtime
3. **Batch Operations**: `writeBatch` precisa ser substituído por transações SQL
4. **Increment Operations**: Precisam ser adaptadas para SQL
5. **Array Operations**: `arrayUnion`/`arrayRemove` precisam ser adaptadas
6. **Error Handling**: Erros do Supabase são diferentes dos do Firebase

---

## 📊 Estatísticas

- **Arquivos que usam Firebase**: ~25 arquivos
- **Linhas de código a migrar**: ~2000+ linhas
- **Hooks customizados**: 3 (useDoc, useCollection, useMemoFirebase)
- **Providers**: 2 (FirebaseProvider, FirebaseClientProvider)
- **Páginas a migrar**: 15+
- **Complexidade**: Alta (especialmente clans e operações batch)

---

**Última atualização**: Análise completa do projeto realizada
**Status**: 0% migrado - Projeto ainda 100% Firebase
