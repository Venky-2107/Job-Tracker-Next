# Next.js + Redux Toolkit + RTK Query — Setup Reference

---

## 1. Create Next.js App

```bash
npx create-next-app@latest your-app-name
```

**Select:**
- TypeScript → Yes
- ESLint → Yes
- Tailwind CSS → Yes
- src/ directory → Yes
- App Router → Yes
- React Compiler → Yes
- Import alias → No

---

## 2. Install Packages

```bash
npm install @reduxjs/toolkit react-redux axios react-hook-form zod @hookform/resolvers
```

---

## 3. Folder Structure

```
src/
  app/
    (auth)/          # route group — invisible in URL, just for organization
      login/
        page.tsx     # renders at /login
      register/
        page.tsx     # renders at /register
    dashboard/
      page.tsx       # renders at /dashboard
    application/
      new/
        page.tsx     # renders at /application/new
      [id]/          # dynamic route — captures /application/5
        page.tsx     # renders at /application/5
        edit/
          page.tsx   # renders at /application/5/edit
    layout.tsx       # wraps every page — put providers here
    page.tsx         # renders at /
  components/        # reusable components
  store/             # redux store and slices
  hooks/             # typed redux hooks
  types/             # TypeScript interfaces
  lib/               # utility functions
  middleware.ts      # route protection — runs on server before page loads
```

---

## 4. Environment Variables

Create `.env.local` in project root:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> **Note:** `NEXT_PUBLIC_` prefix makes the variable available in the browser.
> Without it, the variable is server-only.

---

## 5. Redux Store Setup

### `src/store/index.ts`
```typescript
import { configureStore } from "@reduxjs/toolkit"
import { api } from "./api"
import authReducer from "./authSlice"

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,  // RTK Query cache
    auth: authReducer,               // auth slice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware), // RTK Query middleware for caching
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

---

## 6. RTK Query Base API

### `src/store/api.ts`
```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
      // only runs in browser, not on server
      if (typeof window !== "undefined") {
        // read token from cookie
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
        const token = match ? match[1] : null
        // attach token to every API request
        if (token) headers.set("Authorization", `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: () => ({}), // endpoints added per feature using injectEndpoints
})
```

---

## 7. Auth Slice

### `src/store/authSlice.ts`
```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

// reads token from browser cookie
const getTokenFromCookie = () => {
  if (typeof window === "undefined") return null  // server check
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
  return match ? match[1] : null
}

const initialState: AuthState = {
  token: getTokenFromCookie(),
  isAuthenticated: !!getTokenFromCookie(),
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      // set cookie — max-age in seconds (7 days here)
      document.cookie = `token=${action.payload}; path=/; max-age=${60 * 60 * 24 * 7}`
    },
    logout: (state) => {
      state.token = null
      state.isAuthenticated = false
      // max-age=0 deletes the cookie immediately
      document.cookie = "token=; path=/; max-age=0"
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
```

---

## 8. Typed Redux Hooks

### `src/hooks/redux.ts`
```typescript
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/store"

// typed versions of useDispatch and useSelector
// use these instead of the originals everywhere in your app
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector)
```

---

## 9. Connect Store to App

### `src/app/layout.tsx`
```typescript
"use client"  // needed because Provider uses React context

import { store } from "@/store"
import { Provider } from "react-redux"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {children}  {/* every page renders here */}
        </Provider>
      </body>
    </html>
  )
}
```

> **Note:** If layout.tsx has `"use client"`, you cannot export `metadata` from the same file.
> Move metadata to a separate file:

### `src/app/metadata.ts`
```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your App",
  description: "Your description",
}
```
Then in layout.tsx: `export { metadata } from "./metadata"`

---

## 10. RTK Query — Injecting Endpoints

### Pattern for each feature (e.g. `src/store/authApi.ts`)
```typescript
import { api } from "./api"

export const authApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // builder.mutation → POST, PUT, DELETE
    login: builder.mutation({
      query: (credentials: { email: string; password: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    // builder.query → GET
    getApplications: builder.query({
      query: () => "/applications",
    }),
  }),
})

// RTK Query auto-generates these hooks from endpoint names
export const { useLoginMutation, useGetApplicationsQuery } = authApi
```

> **Naming convention:**
> - `mutation` → `use{Name}Mutation`
> - `query` → `use{Name}Query`

---

## 11. Middleware — Route Protection

### `src/middleware.ts`
```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // reads token from cookie (middleware runs on server, can't access localStorage)
  const token = request.cookies.get("token")?.value

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register")

  // not logged in and trying to access protected page → redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // logged in and trying to access login/register → redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// define which routes middleware runs on
export const config = {
  matcher: ["/dashboard/:path*", "/application/:path*", "/login", "/register"],
}
```

---

## 12. Form with Zod + React Hook Form

### Pattern
```typescript
"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// 1. define schema with validation rules
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
})

// 2. extract TypeScript type from schema
type FormData = z.infer<typeof schema>

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),  // connects Zod to React Hook Form
  })

  const onSubmit = async (data: FormData) => {
    // data is fully typed and validated here
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register("password")} type="password" placeholder="Password" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## 13. Using RTK Query Hooks in Components

```typescript
// mutation (POST/PUT/DELETE)
const [login, { isLoading, isError }] = useLoginMutation()

const onSubmit = async (data) => {
  try {
    const result = await login(data).unwrap()  // unwrap gives actual data or throws error
    // handle success
  } catch (err: any) {
    const message = err.data?.detail || "Something went wrong"
    // show error to user
  }
}

// query (GET) — runs automatically on component mount
const { data, isLoading, isError } = useGetApplicationsQuery()
```

---

## Key Concepts Summary

| Concept | What it does |
|---|---|
| `"use client"` | Makes component run in browser (needed for useState, useEffect, onClick) |
| Server Component | Default in Next.js — renders on server, no interactivity |
| File-based routing | Folder + page.tsx = route. No router config needed |
| `[id]` folder | Dynamic route — captures URL param like `:id` in React Router |
| `(folder)` | Route group — organizes files without affecting URL |
| `layout.tsx` | Wraps all pages — put providers and navbar here |
| `middleware.ts` | Runs on server before page loads — used for auth protection |
| `z.infer` | Extracts TypeScript type from Zod schema — no duplication |
| `unwrap()` | Gets actual data from RTK Query promise, throws on error |
| `NEXT_PUBLIC_` | Makes env variable available in browser |
