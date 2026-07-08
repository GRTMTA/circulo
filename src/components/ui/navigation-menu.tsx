import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function NavigationMenu({
  className,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    />
  );
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 py-2 text-base font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-white/80 hover:text-[var(--color-text-primary)] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none data-[popup-open]:bg-white/80 data-[popup-open]:text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className="size-3.5 shrink-0 transition-transform duration-200 group-data-[popup-open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-5 py-2 text-base font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-white/80 hover:text-[var(--color-text-primary)] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none data-[active=true]:bg-white data-[active=true]:text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-white/95 p-5 text-base shadow-[0_24px_60px_-36px_rgba(26,31,54,0.42)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuPortal({
  ...props
}: NavigationMenuPrimitive.Portal.Props) {
  return <NavigationMenuPrimitive.Portal data-slot="navigation-menu-portal" {...props} />;
}

function NavigationMenuPositioner({
  className,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Positioner
      data-slot="navigation-menu-positioner"
      className={cn("z-40 mt-2", className)}
      {...props}
    />
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuPrimitive.Viewport.Props) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn(
        "origin-top overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-white/95 shadow-[0_24px_60px_-36px_rgba(26,31,54,0.42)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
};
