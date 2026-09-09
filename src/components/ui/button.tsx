/**
 * Module: Dashboard button primitive
 * Purpose: Provide a small shadcn-style button API without adding a new styling runtime
 * Used by: Dashboard metric and modal action surfaces
 * Dependencies: React and dashboard semantic CSS tokens
 * Public functions: Button()
 * Side effects: None; renders accessible interactive controls
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={`ui-button ui-button-${variant} ui-button-${size}${className ? ` ${className}` : ""}`}
      {...props}
    />
  ),
);

Button.displayName = "Button";
