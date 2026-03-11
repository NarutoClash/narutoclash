import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-['Outfit'] font-semibold text-sm tracking-wide",
    "rounded-[3px]",
    "transition-all duration-150 cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-[#ffd633] to-[#cc9900]",
          "text-[#0e0900]",
          "border-t border-l border-r border-b-2",
          "border-t-[#ffe066] border-l-[#ffd633] border-r-[#996600] border-b-[#4d3300]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,200,0.35)]",
          "hover:from-[#ffe04d] hover:to-[#ddaa00]",
          "hover:shadow-[0_3px_14px_rgba(255,204,0,0.4),inset_0_1px_0_rgba(255,255,200,0.35)]",
          "active:shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
        ].join(" "),

        destructive: [
          "bg-gradient-to-b from-[#e03030] to-[#991010]",
          "text-[#ffeaea]",
          "border-t border-l border-r border-b-2",
          "border-t-[#f05050] border-l-[#e03030] border-r-[#660a0a] border-b-[#330505]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,180,180,0.15)]",
          "hover:from-[#f03c3c] hover:to-[#bb1a1a]",
          "hover:shadow-[0_3px_14px_rgba(220,30,30,0.4)]",
        ].join(" "),

        outline: [
          "bg-transparent",
          "text-[#a87800]",
          "border border-[#cc9900]",
          "hover:bg-[rgba(255,204,0,0.08)] hover:text-[#cc9900] hover:border-[#ffcc00]",
        ].join(" "),

        secondary: [
          "bg-gradient-to-b from-[#fb923c] to-[#c2410c]",
          "text-[#0e0500]",
          "border-t border-l border-r border-b-2",
          "border-t-[#fdba74] border-l-[#fb923c] border-r-[#9a3412] border-b-[#431407]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,220,180,0.2)]",
          "hover:from-[#fc9f50] hover:to-[#d95316]",
          "hover:shadow-[0_3px_14px_rgba(249,115,22,0.4)]",
        ].join(" "),

        ghost: [
          "bg-transparent border-none shadow-none",
          "text-[#a87800]",
          "hover:bg-[rgba(255,204,0,0.08)] hover:text-[#cc9900]",
        ].join(" "),

        link: [
          "bg-transparent border-none shadow-none p-0 h-auto",
          "text-[#a87800] underline-offset-4",
          "hover:underline hover:text-[#cc9900]",
        ].join(" "),
      },
      size: {
        default: "h-9 px-5 py-2 text-sm",
        sm:      "h-7 px-3 py-1 text-xs",
        lg:      "h-11 px-8 py-2 text-base",
        icon:    "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
