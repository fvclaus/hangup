import NextLink from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "@/lib/utils";

export const linkVariants = cva("", {
  variants: {
    variant: {
      default: "text-blue-600 hover:text-blue-800 underline",
      footer: "text-sm text-gray-500 hover:text-gray-900 transition-colors",
      button:
        "block text-center bg-blue-600 text-white px-6 py-3 rounded-md text-base font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type NextLinkArgs = Parameters<typeof NextLink>;

const Link = React.forwardRef<
  HTMLAnchorElement,
  NextLinkArgs[0] & VariantProps<typeof linkVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <NextLink
      prefetch={false}
      ref={ref}
      {...props}
      className={cn(linkVariants({ variant, className }))}
    />
  );
});

export default Link;
