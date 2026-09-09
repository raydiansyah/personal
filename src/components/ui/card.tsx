/**
 * Module: Dashboard card primitives
 * Purpose: Provide shadcn-style card composition for dashboard summary surfaces
 * Used by: Dashboard metric cards and future dashboard panels
 * Dependencies: React and dashboard semantic CSS tokens
 * Public functions: Card(), CardHeader(), CardTitle(), CardContent()
 * Side effects: None; renders semantic layout containers
 */
import { forwardRef, type HTMLAttributes } from "react";

export const Card = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className = "", ...props }, ref) => (
    <article ref={ref} className={`ui-card${className ? ` ${className}` : ""}`} {...props} />
  ),
);

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`ui-card-header${className ? ` ${className}` : ""}`} {...props} />
  ),
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`ui-card-title${className ? ` ${className}` : ""}`} {...props} />
  ),
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`ui-card-content${className ? ` ${className}` : ""}`} {...props} />
  ),
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardContent.displayName = "CardContent";
