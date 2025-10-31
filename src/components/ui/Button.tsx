"use client";
import React from "react";
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90",
  secondary:
    "bg-white/70 text-black border border-black/10 backdrop-blur-md shadow-sm hover:bg-white/90 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/15",
  ghost:
    "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
      {...props}
    />
  );
}

export default Button;
