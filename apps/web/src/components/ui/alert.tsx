import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

const Alert: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive mb-5 mt-5",
      className,
    )}
    {...props}
  />
);

const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <div className="flex flex-row items-center">
    <AlertCircle className="h-6 w-6" />
    <h5
      className={cn(
        "text-lg font-semibold leading-none tracking-tight ml-2",
        className,
      )}
      {...props}
    />
  </div>
);

const AlertDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className, ...props }) => (
  <div
    className={cn("text-sm [&_p]:leading-relaxed mt-2", className)}
    {...props}
  />
);

export { Alert, AlertTitle, AlertDescription };
