'use client';

import * as React from 'react';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  XIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

const toast = ToastPrimitive.createToastManager();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full',
        className
      )}
      {...props}
    />
  );
}

function Toast({
  className,
  toastType,
  ...props
}: ToastPrimitive.Root.Props & { toastType?: string }) {
  const typeStyles = {
    success:
      'bg-emerald-600 border-emerald-700 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)]',
    error: 'bg-rose-600 border-rose-700 text-white shadow-[0_8px_30px_rgba(244,63,94,0.3)]',
    warning: 'bg-amber-500 border-amber-600 text-white shadow-[0_8px_30px_rgba(245,158,11,0.3)]',
    info: 'bg-blue-600 border-blue-700 text-white shadow-[0_8px_30px_rgba(59,130,246,0.3)]',
    loading: 'bg-zinc-800 border-zinc-700 text-white shadow-lg',
  };

  const currentStyle = toastType
    ? typeStyles[toastType as keyof typeof typeStyles]
    : 'bg-popover text-popover-foreground border-border';

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        'toast-root group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        currentStyle,
        className
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        'flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100',
        className
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  toastType,
  ...props
}: ToastPrimitive.Description.Props & { toastType?: string }) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-xs', toastType ? 'text-white/90' : 'text-muted-foreground', className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  toastType,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props & { toastType?: string }) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 after:absolute after:-inset-2 after:content-[''] rounded-md focus-visible:ring-2 focus-visible:outline-hidden",
        toastType
          ? 'text-white/80 hover:text-white hover:bg-white/10 focus-visible:ring-white/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === 'success') {
    icon = <CircleCheckIcon aria-hidden="true" />;
  }

  if (type === 'info') {
    icon = <InfoIcon aria-hidden="true" />;
  }

  if (type === 'warning') {
    icon = <TriangleAlertIcon aria-hidden="true" />;
  }

  if (type === 'error') {
    icon = <OctagonXIcon aria-hidden="true" />;
  }

  if (type === 'loading') {
    icon = <Loader2Icon className="animate-spin" aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem} toastType={toastItem.type}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastTitle className="font-extrabold text-sm" />
          <ToastDescription toastType={toastItem.type} />
        </div>
        <ToastAction />
        <ToastClose toastType={toastItem.type} />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({ children, toastManager = toast, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
