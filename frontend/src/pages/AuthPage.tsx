import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be 128 characters or less"),
});

type AuthValues = z.infer<typeof signupSchema>;

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [requestError, setRequestError] = useState("");
  const schema = isSignup ? signupSchema : loginSchema;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(values: AuthValues) {
    setRequestError("");
    try {
      if (isSignup) await signup(values.email, values.password);
      else await login(values.email, values.password);
      const destination = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(destination ?? "/dashboard", { replace: true });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Unable to authenticate",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-10 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            HD
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            HelpDesk Lite
          </span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            Support, made simple
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup
              ? "Sign up to submit and track support requests."
              : "Sign in to manage your support tickets."}
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)}>
            <label className="field-label">
              Email address
              <input
                autoComplete="email"
                className="field-input"
                placeholder="you@company.com"
                type="email"
                {...register("email")}
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </label>
            <label className="field-label">
              Password
              <input
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="field-input"
                placeholder={isSignup ? "At least 12 characters" : "Your password"}
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </label>
            {requestError && (
              <div
                aria-live="polite"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
              >
                {requestError}
              </div>
            )}
            <button className="button-primary w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? "Already have an account?" : "New to HelpDesk Lite?"}{" "}
            <Link
              className="font-semibold text-indigo-700 hover:text-indigo-800"
              to={isSignup ? "/login" : "/signup"}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Secure support for your whole team
        </p>
      </div>
    </main>
  );
}
