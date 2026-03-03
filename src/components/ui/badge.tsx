"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-bond-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-bond-primary text-white hover:bg-bond-primary/80",
        secondary:
          "border-transparent bg-bond-secondary text-white hover:bg-bond-secondary/80",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-600/80",
        outline: "text-gray-950 border-gray-200",
        appreciation:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        curiosity:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        memories:
          "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        reciprocity:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        play: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
