# Next.js + Redux Toolkit + RTK Query — Setup Reference

> **How to use this file:** Each section has the code + plain English explanation of why it exists and what each import/line does. Read it top to bottom once, then use it as a lookup when you forget something.

---

## 1. Create Next.js App

```bash
npx create-next-app@latest your-app-name
```

**What this does:** Scaffolds a new Next.js project with all config files, folder structure, and dependencies pre-set.

**Select these options:**
- TypeScript → Yes (type safety)
- ESLint → Yes (catches code errors)
- Tailwind CSS → Yes (utility-first styling)
- src/ directory → Yes (cleaner structure — all code under src/)
- App Router → Yes (modern Next.js routing system)
- React Compiler → Yes (auto-optimizes components)
- Import alias → No (not needed for now)

---

## 2. Install Packages

```bash
npm install @reduxjs/toolkit react-redux axios react-hook-form zod @hookform/resolvers
```

**What each package does:**
- `@reduxjs/toolkit` — Redux made simple. Replaces old verbose Redux. Includes RTK Query.
- `react-redux` — connects Redux store to React components via Provider and hooks
- `axios` — HTTP client (may not be used if you use RTK Query for all calls)
- `react-hook-form` — manages form state, handles submit, tracks validation errors
- `zod` — schema validation library. Define rules once, get TypeScript types for free
- `@hookform/resolvers` — bridge that connects Zod validation to React Hook Form

---

## 3. Folder Structure

```
src/
  app/
    (auth)/          # route group — folder name in () is invisible in URL
      login/
        page.tsx     # URL: /login
      register/
        page.tsx     # URL: /register
    dashboard/
      page.tsx       # URL: /dashboard
    application/
      new/
        page.tsx     # URL: /application/new
      [id]/          # dynamic segment — [id] captures any number/string in the URL
        page.tsx     # URL: /application/5  (id = 5)
        edit/
          page.tsx   # URL: /application/5/edit
    layout.tsx       # shell that wraps every page — providers go here
    page.tsx         # URL: /  (home/root route)
  components/        # reusable UI components (cards, modals, forms)
  store/             # Redux store, slices, RTK Query api files
  hooks/             # custom typed hooks (useAppDispatch, useAppSelector)
  types/             # TypeScript interfaces shared across the app
  lib/               # helper/utility functions
  middleware.ts      # interceptor — runs on server before any page loads
```

**Key rule:** Every folder inside `app/` needs a `page.tsx` to become a route. Just a folder alone is not enough.

---

## 4. Environment Variables

Create `.env.local` in the project root (same level as `package.json`):

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

**Why `NEXT_PUBLIC_` prefix?**
Next.js runs code on both server and browser. By default, env variables are server-only (for security). Adding `NEXT_PUBLIC_` tells Next.js to expose this variable to the browser too.

**Rule:** Any env variable your frontend JavaScript needs → must have `NEXT_PUBLIC_` prefix.

**On Vercel:** Add the same variable in Project → Settings → Environment Variables, then redeploy.

---

## 5. Redux Store Setup

### `src/store/index.ts`

```typescript
import { configureStore } from "@reduxjs/toolkit"
// configureStore — creates the central Redux store. Replaces old createStore from Redux.

import { api } from "./api"
// api — our RTK Query base API. It needs its own reducer and middleware in the store.

import authReducer from "./authSlice"
// authReducer — manages auth state (token, isAuthenticated)

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    // api.reducerPath is a string key (defaults to "api")
    // api.reducer stores all RTK Query cache data (fetched API responses)

    auth: authReducer,
    // auth section of the store — holds token and isAuthenticated
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
    // api.middleware handles caching, invalidation, and refetching automatically
    // must be added or RTK Query won't work properly
})

// RootState — TypeScript type of the entire store shape
// Used in useAppSelector so TypeScript knows what's in the store
export type RootState = ReturnType<typeof store.getState>

// AppDispatch — TypeScript type for the dispatch function
// Used in useAppDispatch for type-safe action dispatching
export type AppDispatch = typeof store.dispatch
```

---

## 6. RTK Query Base API

### `src/store/api.ts`

```typescript
import { createApi, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
// createApi — creates the RTK Query API instance. One per app.
// fetchBaseQuery — built-in fetch wrapper (like axios but simpler)
// FetchBaseQueryError — TypeScript type for error responses

// Step 1 — define the base fetch behavior
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  // all API calls will use this as the base URL
  // e.g. "/auth/login" becomes "http://127.0.0.1:8000/auth/login"

  prepareHeaders: (headers) => {
    // runs before every API request — like axios request interceptor
    if (typeof window !== "undefined") {
      // typeof window check — makes sure this only runs in browser, not on server
      // (Next.js runs code on server too, and document.cookie doesn't exist there)

      const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
      // document.cookie is one big string: "token=abc123; other=xyz"
      // regex extracts just the token value from it

      const token = match ? match[1] : null
      if (token) headers.set("Authorization", `Bearer ${token}`)
      // attaches token to every request so the backend knows who you are
    }
    return headers
  },
})

// Step 2 — wrap baseQuery to handle 401 globally
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions)

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    // 401 = token expired or invalid
    document.cookie = "token=; path=/; max-age=0"  // delete cookie
    window.location.href = "/login"                  // force redirect to login
  }

  return result
}
// This replaces the axios response interceptor you wrote before

export const api = createApi({
  reducerPath: "api",
  // the key name this API uses in the Redux store

  tagTypes: ["Applications", "Contacts", "Notes"],
  // register cache tags here — used for automatic refetching after mutations

  baseQuery: baseQueryWithReauth,
  // use our wrapper (with 401 handling) instead of plain baseQuery

  endpoints: () => ({}),
  // empty here — each feature adds its own endpoints using injectEndpoints
})
```

---

## 7. Auth Slice

### `src/store/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
// createSlice — creates a slice of the Redux store with reducers and actions combined
// PayloadAction — TypeScript type for actions that carry data (payload)

interface AuthState {
  token: string | null
  isAuthenticated: boolean
}
// defines the shape of the auth section of the store

// helper to read token from cookie on page load
const getTokenFromCookie = () => {
  if (typeof window === "undefined") return null
  // server-side check — document doesn't exist on server

  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
  return match ? match[1] : null
}

const initialState: AuthState = {
  token: getTokenFromCookie(),
  isAuthenticated: !!getTokenFromCookie(),
  // !! converts the value to boolean — null becomes false, string becomes true
}

const authSlice = createSlice({
  name: "auth",
  // name prefix for all actions — actions become "auth/setCredentials", "auth/logout"

  initialState,

  reducers: {
    setCredentials: (state, action: PayloadAction<string>) => {
      // called after successful login
      // action.payload = the JWT token string
      state.token = action.payload
      state.isAuthenticated = true
      document.cookie = `token=${action.payload}; path=/; max-age=${60 * 60 * 24 * 7}`
      // path=/ — cookie available on all pages
      // max-age — expiry in seconds (7 days = 60*60*24*7)
      // stored in cookie (not localStorage) so middleware can read it on server
    },

    logout: (state) => {
      state.token = null
      state.isAuthenticated = false
      document.cookie = "token=; path=/; max-age=0"
      // max-age=0 immediately expires and deletes the cookie
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
// RTK auto-generates action creators from reducer function names
// export them so components can dispatch them

export default authSlice.reducer
// export the reducer so the store can include it
```

**Why cookies instead of localStorage?**
Middleware runs on the server. The server can read cookies (sent with every request) but cannot access localStorage (browser-only). Using cookies lets middleware check auth before the page loads.

---

## 8. Typed Redux Hooks

### `src/hooks/redux.ts`

```typescript
import { useDispatch, useSelector } from "react-redux"
// useDispatch — hook to get the dispatch function (to send actions to the store)
// useSelector — hook to read data from the store

import type { RootState, AppDispatch } from "@/store"
// import types from store — needed for TypeScript to know the store's shape

export const useAppDispatch = () => useDispatch<AppDispatch>()
// typed version of useDispatch
// use this instead of useDispatch directly — gives autocomplete on dispatch calls

export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector)
// typed version of useSelector
// use this instead of useSelector directly — TypeScript knows what's in state
```

**Why create these custom hooks?**
The original `useDispatch` and `useSelector` don't know your store's TypeScript types. These wrappers add type information so you get autocomplete and error checking everywhere.

**Usage in any component:**
```typescript
const dispatch = useAppDispatch()
const token = useAppSelector(state => state.auth.token)
```

---

## 9. Connect Store to App

### `src/app/layout.tsx`

```typescript
"use client"
// required because Provider uses React context internally
// React context only works in client components

import { store } from "@/store"
import { Provider } from "react-redux"
// Provider — wraps your app and makes the Redux store available to all child components
// Same concept as AuthProvider you wrote before, but for Redux

import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {children}
          {/* children = whatever page.tsx renders for the current route */}
          {/* Provider here means every page automatically has access to Redux */}
        </Provider>
      </body>
    </html>
  )
}
```

**Important gotcha:** When `layout.tsx` has `"use client"`, you cannot export `metadata` from the same file (metadata is server-only). Move it to a separate file:

### `src/app/metadata.ts`
```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your App",
  description: "Your description",
}
```
Then in `layout.tsx`: `export { metadata } from "./metadata"`

---

## 10. RTK Query — Injecting Endpoints

Each feature gets its own api file. All of them inject into the same base `api`.

### Pattern — `src/store/authApi.ts`

```typescript
import { api } from "./api"
// import the base api to inject endpoints into it

export const authApi = api.injectEndpoints({
  overrideExisting: true,
  // prevents warning when hot reload injects endpoints twice in dev mode

  endpoints: (builder) => ({

    login: builder.mutation({
    // builder.mutation — for POST, PUT, DELETE (anything that changes data)
      query: (credentials: { email: string; password: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
        // DO NOT add Content-Type header manually
        // RTK Query sets application/json automatically
      }),
    }),

    getApplications: builder.query({
    // builder.query — for GET requests (fetching data)
    // query hooks run automatically when the component mounts
      query: () => "/applications",
    }),

  }),
})

// RTK Query auto-generates hooks from endpoint names
// mutation → use{Name}Mutation
// query → use{Name}Query
export const { useLoginMutation, useGetApplicationsQuery } = authApi
```

**Common mistake:** Never add `Content-Type: application/x-www-form-urlencoded` when sending a JS object as body. It sends the object as `[object Object]` string. Let RTK Query handle Content-Type automatically.

---

## 11. Middleware — Route Protection

### `src/middleware.ts`

```typescript
import { NextResponse } from "next/server"
// NextResponse — used to build responses (redirect, continue, etc.)

import type { NextRequest } from "next/server"
// NextRequest — TypeScript type for incoming requests in middleware

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  // read token from cookie
  // middleware runs on server — cannot use localStorage or document.cookie here
  // cookies are automatically sent with every request, so server can read them

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register")
  // check if user is trying to visit login or register page

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
    // no token + trying to visit protected page → send to login
    // page never loads — user is redirected before any React code runs
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
    // has token + trying to visit login/register → send to dashboard
    // prevents logged-in users from seeing the login page
  }

  return NextResponse.next()
  // all good — let the request through normally
}

export const config = {
  matcher: ["/dashboard/:path*", "/application/:path*", "/login", "/register"],
  // tells Next.js which routes to run this middleware on
  // :path* means the route and all sub-routes under it
  // routes NOT in this list skip middleware entirely
}
```

**How middleware is connected:** You don't import it anywhere. Next.js automatically picks it up because the file is named `middleware.ts` and lives in `src/`. The `config.matcher` tells it which routes to intercept.

---

## 12. Form with Zod + React Hook Form

```typescript
"use client"
// forms have interactivity (onChange, onSubmit) — must be client component

import { useForm } from "react-hook-form"
// useForm — manages form state, handles validation, tracks errors

import { z } from "zod"
// z — Zod's main object for building schemas

import { zodResolver } from "@hookform/resolvers/zod"
// zodResolver — bridge that connects Zod schema to React Hook Form
// without this, you'd have to wire them up manually

// Step 1 — define what the form data looks like and its validation rules
const schema = z.object({
  email: z.string().email("Invalid email"),
  // z.string() — must be a string
  // .email() — must be valid email format, show this message if not

  password: z.string().min(6, "Minimum 6 characters"),
  // .min(6) — must be at least 6 characters

  date_of_interview: z.string().optional(),
  // .optional() — field is not required
})

// Step 2 — extract TypeScript type from schema automatically
// no need to define a separate interface
type FormData = z.infer<typeof schema>

export default function MyForm() {
  const {
    register,       // connects input fields to the form
    handleSubmit,   // validates then calls your onSubmit function
    formState: { errors }, // contains validation error messages per field
    reset,          // resets form to default values (used in edit mode)
  } = useForm<FormData>({
    resolver: zodResolver(schema),  // Zod handles all validation
    defaultValues: {},              // optional — prefills fields (used for edit)
  })

  const onSubmit = async (data: FormData) => {
    // data is fully typed — TypeScript knows it has email and password
    // only called if all validations pass
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
    {/* handleSubmit(onSubmit) — first validates, then calls onSubmit */}

      <input {...register("email")} placeholder="Email" />
      {/* {...register("email")} — connects this input to the form, tracks its value */}

      {errors.email && <p>{errors.email.message}</p>}
      {/* shows Zod error message if validation fails for this field */}

      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## 13. Using RTK Query Hooks in Components

```typescript
// MUTATION (POST/PUT/DELETE) — returns array [triggerFn, statusObject]
const [login, { isLoading, isError, isSuccess, data, error }] = useLoginMutation()
// login — function you call to trigger the API request
// isLoading — true while request is in flight (show spinner)
// isError — true if request failed
// isSuccess — true if request succeeded
// data — response data on success
// error — error object on failure

const onSubmit = async (formData) => {
  try {
    const result = await login(formData).unwrap()
    // .unwrap() — extracts actual response data from RTK Query wrapper
    // without unwrap: result = { data: {...}, error: undefined } — never throws
    // with unwrap: result = actual data — throws error if request failed
    // use unwrap when you want try/catch to work properly

  } catch (err: any) {
    const message = err.data?.detail || "Something went wrong"
    // err.data.detail — matches FastAPI's error response format
    // Array.isArray check needed if FastAPI returns validation errors as array
  }
}

// QUERY (GET) — runs automatically on component mount, no useEffect needed
const { data, isLoading, isError } = useFetchApplicationsQuery(undefined)
// undefined — pass when the query takes no arguments
// data — the fetched data (undefined while loading)
// always handle loading and error states before rendering data
```

---

## 14. RTK Query — Cache Invalidation with Tags

Tags automatically keep your UI in sync with the backend after create/update/delete.

```typescript
// Step 1 — register tags in base api.ts
export const api = createApi({
  tagTypes: ["Applications", "Contacts", "Notes"],
  // declare all tag names you'll use across the app
  ...
})

// Step 2 — assign tags in feature api files
FetchApplications: builder.query({
  query: () => ({ url: "/application/" }),
  providesTags: ["Applications"],
  // this query "owns" the Applications cache
  // when Applications tag is invalidated, this query automatically refetches
}),

CreateApplication: builder.mutation({
  query: (body) => ({ url: "/application/", method: "POST", body }),
  invalidatesTags: ["Applications"],
  // after this mutation succeeds, mark Applications cache as stale
  // RTK Query then automatically refetches FetchApplications
  // dashboard updates without any manual refresh or useEffect
}),
```

**Flow:** Create/Update/Delete succeeds → `invalidatesTags` fires → RTK Query refetches all queries with matching `providesTags` → UI updates automatically.

---

## 15. Reusable Form Component Pattern

When the same form handles both create and edit:

```typescript
interface FormProps {
  defaultValues?: FormData
  // undefined = create mode (empty form)
  // filled = edit mode (prefilled form)

  onSubmit: (data: FormData) => void
  // parent decides what to do on submit (create vs update API call)

  isLoading: boolean
  // parent controls loading state
}

export default function ApplicationForm({ defaultValues, onSubmit, isLoading }: FormProps) {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
    // React Hook Form uses this to prefill inputs
    // only works if passed on initial render — see important note below
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      ...
      <button type="submit">
        {defaultValues
          ? (isLoading ? "Updating..." : "Update")   // edit mode
          : (isLoading ? "Creating..." : "Create")}   // create mode
      </button>
    </form>
  )
}
```

**Important:** `defaultValues` only works if it exists when the component first mounts. Don't mount the form while data is still loading — wait for it:

```typescript
// In edit page — wait for data before rendering form
if (isLoading || !data) return <p>Loading...</p>
return <ApplicationForm defaultValues={data} onSubmit={handleUpdate} isLoading={isUpdating} />
```

---

## 16. Dynamic Route Params in Next.js 16

In Next.js 16, `params` is a Promise — cannot be accessed directly.

```typescript
import { use } from "react"
// use() — React hook that unwraps a Promise synchronously inside a component

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // unwrap the params Promise to get the actual id value
  // id is always a string — convert to number where needed: Number(id)
}
```

---

## 17. Cookie vs localStorage — Why It Matters

| | localStorage | Cookie |
|---|---|---|
| Where it lives | Browser only | Browser + sent to server |
| Server can read it | No | Yes |
| Middleware can read it | No | Yes |
| JavaScript can read it | Yes | Yes |

**Rule:** Store JWT token in a cookie so Next.js middleware (server-side) can check authentication before the page loads. localStorage is browser-only — middleware runs on the server and can't see it.

---

## Key Concepts Quick Reference

| Concept | What it does | When to use |
|---|---|---|
| `"use client"` | Makes component run in browser | Any file with useState, useEffect, onClick, hooks |
| Server Component | Renders on server, sends HTML | Read-only pages with no interactivity |
| `page.tsx` | Defines a route | Every route needs one |
| `layout.tsx` | Wraps all pages | Providers, navbar, global shell |
| `[id]` folder | Dynamic URL segment | Routes with variable IDs |
| `(folder)` | Route group, invisible in URL | Organizing files without affecting routes |
| `middleware.ts` | Runs on server before page | Auth protection, redirects |
| `z.infer` | Extracts TS type from Zod schema | Avoid defining types twice |
| `unwrap()` | Gets data or throws from RTK mutation | When you need try/catch to work |
| `providesTags` | Marks what a query caches | On GET queries |
| `invalidatesTags` | Triggers refetch after mutation | On POST/PUT/DELETE mutations |
| `NEXT_PUBLIC_` | Exposes env variable to browser | API URLs, public config |
| `typeof window !== "undefined"` | Checks if running in browser | Before using localStorage or document |
| `React.use(params)` | Unwraps params Promise | In dynamic route pages (Next.js 16+) |
