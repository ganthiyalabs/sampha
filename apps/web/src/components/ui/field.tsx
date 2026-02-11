import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-2", className)} {...props} />
  ),
);
Field.displayName = "Field";

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-4", className)} {...props} />
  ),
);
FieldGroup.displayName = "FieldGroup";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => <Label ref={ref} className={cn(className)} {...props} />);
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
FieldDescription.displayName = "FieldDescription";

const FieldSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex items-center justify-center text-xs uppercase", className)}
      {...props}
    >
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative bg-background px-2 text-muted-foreground">{children}</div>
    </div>
  ),
);
FieldSeparator.displayName = "FieldSeparator";

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator };
