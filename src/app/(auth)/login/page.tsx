"use client";

import { z } from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/redux";
import { useLoginMutation } from "@/store/authApi";
import { setCredentials } from "@/store/authSlice";

const loginSchema = z.object({
  username: z.string().email("Invalid Email"),
  password: z.string().min(5, "Must be at least 5 characters long"),
});

// z.infer reads your schema and creates a TypeScript type automatically —
// so you don't define the type twice.
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [apiError, setApiError] = useState<string>("");
  const router = useRouter();
  const dispatch = useAppDispatch();

  /**
   * login — the function you call to make the API request
   * isLoading — true while request is in flight
   * isError — true if request failed
   */
  const [login, { isLoading, isError }] = useLoginMutation();

  /**
   *register — connects an input to the form
   *handleSubmit — validates before submitting
   *errors — contains validation error messages from Zod
   *zodResolver — connects Zod schema to React Hook Form
   */

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      // unwrap is like json.parse on the incoming daata
      const result = await login(data).unwrap();
      dispatch(setCredentials(result.access_token));
      router.push("/dashboard");
    } catch (error: any) {
      if (Array.isArray(error.data?.detail)) {
        setApiError(error.data.detail[0]?.msg || "Something went wrong");
      } else {
        setApiError(error.data?.detail || "Something went wrong");
      }
    }
  };

  return (
    <>
      {apiError && <p>{apiError}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>this is something</h1>
        {/* {...register("field name")} to connect to the hook form */}
        <input
          {...register("username")}
          type="email"
          placeholder="email"
          className="border p-2 rounded"
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username.message}</p>
        )}
        <input
          {...register("password")}
          type="text"
          placeholder="password"
          className="border p-2 rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in.." : "Login"}
        </button>
      </form>
      <p>
        Not a user?
        <button onClick={() => router.push("/register")}>Register</button>
      </p>
    </>
  );
}
