'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      // 1. Call register endpoint
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerData.error === 'Validation error' && registerData.details) {
          setFieldErrors(registerData.details);
        } else {
          setError(registerData.error || 'Failed to register user. Please try again.');
        }
        setLoading(false);
        return;
      }

      // 2. Automatically sign in upon successful registration
      const signinRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signinRes?.error) {
        router.push('/auth/sign-in?registered=true');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sign up to track your projects and tasks
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Input
            id="name"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            className="bg-card"
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive font-medium px-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="bg-card"
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive font-medium px-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="bg-card"
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive font-medium px-1">{fieldErrors.password[0]}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal px-1">
            Password must be at least 8 characters, contain one uppercase letter, one lowercase
            letter, and one number.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-hover text-white transition-all shadow-xs h-10 font-semibold cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/auth/sign-in"
          className="text-primary hover:text-primary-hover hover:underline font-medium"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
