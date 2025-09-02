import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const sidebarVariants = cva(
  "relative flex flex-col bg-background text-foreground",
  {
    variants: {
      variant: {
        default: "border-r",
        outline: "border rounded-lg",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Sidebar = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(sidebarVariants({ variant, size, className }))}
      {...props}
    />
  )
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("pb-4 flex items-center", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("pt-4 mt-auto flex items-center", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarNav = React.forwardRef(({ className, ...props }, ref) => (
  <nav ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavItem = React.forwardRef(
  ({ className, active, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
)
SidebarNavItem.displayName = "SidebarNavItem"

export {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
}