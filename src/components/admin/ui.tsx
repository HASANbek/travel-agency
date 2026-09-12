import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-500 dark:text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}

const controlClass =
  "rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/[0.08] px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${controlClass} ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`${controlClass} ${className}`} {...rest} />;
}

export function LabelText(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} />;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500/40",
  secondary:
    "bg-white dark:bg-white/[0.08] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10 focus:ring-gray-400/30",
  danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/40",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500/40",
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...rest}
    />
  );
}

const iconButtonVariants = {
  secondary: "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
  danger: "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10",
};

export function iconButtonClass(variant: "secondary" | "danger" = "secondary") {
  return `rounded-md px-2 py-1 text-xs font-medium transition ${iconButtonVariants[variant]}`;
}

export function IconButton({
  variant = "secondary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "secondary" | "danger" }) {
  return <button className={`${iconButtonClass(variant)} ${className}`} {...rest} />;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          {description}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-gray-400 dark:text-white/40">
      <span className="text-3xl">📭</span>
      {message}
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-white/5" />
      ))}
    </div>
  );
}
