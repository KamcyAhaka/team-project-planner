import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side: Centered illustration on desktop */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-primary-hover/20 p-8 select-none border-r border-border">
        <div className="w-full max-w-[85%] aspect-square relative flex items-center justify-center rounded-2xl p-8 shadow-xs">
          <Image
            src="/images/auth-illustration.png"
            alt="Auth Illustration"
            width={600}
            height={600}
            priority
            className="object-contain w-auto h-auto max-h-[90%] max-w-[90%] transition-transform duration-500 hover:scale-[1.01]"
          />
        </div>
      </div>

      {/* Right side: Form container */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-md flex flex-col gap-8">
          {/* Centered Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center hover:scale-105 transition-transform">
              <Image
                src="/favicon.svg"
                alt="Logo"
                width={64}
                height={64}
                priority
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          {/* Children: Auth form pages */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
