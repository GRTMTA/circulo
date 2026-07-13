"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { logoutAction } from "@/app/auth/actions";
import {
  Bell,
  CircleDot,
  LayoutDashboard,
  Menu,
  Search,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

// CircleSwitcher import removed as it is now redundant.
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CircleListItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export interface AppShellNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "startsWith";
  subItems?: readonly AppShellNavigationItem[];
}

export interface AppShellNavigationGroup {
  heading?: string;
  items: readonly AppShellNavigationItem[];
}

export interface AppShellUser {
  name: string;
  email?: string;
  avatarSrc?: string | null;
  avatarFallback?: string;
  badge?: string;
  description?: string;
  username?: string | null;
  walletAddress?: string | null;
}

export interface AppShellBrand {
  title: string;
  href?: string;
  full?: React.ReactNode;
  compact?: React.ReactNode;
}

interface AppShellProps {
  children: React.ReactNode;
  brand?: AppShellBrand;
  user?: AppShellUser;
  headerSearch?: React.ReactNode;
  headerActions?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  notificationCount?: number;
  defaultCollapsed?: boolean;
  circles?: CircleListItem[];
}

// defaultNavigation constant removed.

function matchesNavPath(pathname: string, item: AppShellNavigationItem) {
  if (item.match === "startsWith") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// inferCircleId helper removed.

function BrandMark({
  brand,
  compact = false,
}: {
  brand: AppShellBrand;
  compact?: boolean;
}) {
  const content = compact ? brand.compact ?? brand.full ?? brand.title : brand.full ?? brand.title;

  if (!brand.href) {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-xl text-sm font-semibold text-[var(--color-text-primary)]",
          compact ? "p-1" : "p-2"
        )}
      >
        {typeof content === "string" ? (
          <span className={cn("truncate", compact ? "text-sm" : "text-base")}>
            {content}
          </span>
        ) : (
          content
        )}
      </div>
    );
  }

  return (
    <Link
      href={brand.href}
      aria-label={`Go to ${brand.title}`}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-primary-muted)]",
        compact ? "p-1" : "p-2"
      )}
    >
      {typeof content === "string" ? (
        <span className={cn("truncate", compact ? "text-sm" : "text-base")}>
          {content}
        </span>
      ) : (
        content
      )}
    </Link>
  );
}

function NavigationGroup({
  heading,
  items,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  heading?: string;
  items: readonly AppShellNavigationItem[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div className="space-y-1">
      {heading ? (
        <p
          className={cn(
            "px-2 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground",
            collapsed && "sr-only"
          )}
        >
          {heading}
        </p>
      ) : null}
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = matchesNavPath(pathname, item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems[item.label] ?? false;

          return (
            <div
              key={item.label}
              className="space-y-0.5"
              onMouseEnter={() => {
                if (hasSubItems) {
                  setExpandedItems((prev) => ({ ...prev, [item.label]: true }));
                }
              }}
              onMouseLeave={() => {
                if (hasSubItems) {
                  setExpandedItems((prev) => ({ ...prev, [item.label]: false }));
                }
              }}
            >
              <Button
                key={item.label}
                render={<Link href={item.href} />}
                nativeButton={false}
                variant="ghost"
                className={cn(
                  "rounded-lg text-[0.8rem] font-semibold w-full justify-start gap-2 px-2.5",
                  collapsed
                    ? "mx-auto h-9 w-9 justify-center px-0"
                    : "h-8",
                  isActive
                    ? "bg-[var(--color-primary-muted)] text-[var(--color-primary-default)] hover:bg-[var(--color-primary-muted)]"
                    : "text-[var(--color-text-alternative)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-default)]"
                )}
                aria-label={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (hasSubItems) {
                    toggleExpand(item.label);
                  }
                  if (onNavigate) {
                    onNavigate();
                  }
                }}
              >
                <item.icon className="size-3.5" />
                <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
              </Button>

              {!collapsed && hasSubItems && (
                <div
                  className={cn(
                    "pl-6 space-y-0.5 border-l border-[var(--color-border-muted)] ml-4 transition-all duration-250 ease-in-out overflow-hidden",
                    isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  {item.subItems?.map((subItem) => {
                    const isSubActive = matchesNavPath(pathname, subItem);
                    return (
                      <Button
                        key={subItem.label}
                        render={<Link href={subItem.href} />}
                        nativeButton={false}
                        variant="ghost"
                        className={cn(
                          "rounded-lg text-[0.75rem] font-medium h-7 w-full justify-start gap-2 px-2.5",
                          isSubActive
                            ? "bg-[var(--color-primary-muted)] text-[var(--color-primary-default)] hover:bg-[var(--color-primary-muted)]"
                            : "text-[var(--color-text-alternative)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-default)]"
                        )}
                        onClick={onNavigate}
                      >
                        <subItem.icon className="size-3.5" />
                        <span>{subItem.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({
  children,
  brand = {
    title: "Application",
    href: "/",
  },
  user,
  headerSearch,
  headerActions,
  sidebarFooter,
  notificationCount,
  defaultCollapsed = true,
  circles = [],
}: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultCollapsed);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const userInitials = user?.avatarFallback ?? (user ? getInitials(user.name) : "U");
  const visibleNavigation = useMemo<AppShellNavigationGroup[]>(() => {
    const circleItemsList: AppShellNavigationItem[] = [];

    circles.forEach((circle) => {
      const circleBase = `/dashboard/${circle.id}`;

      circleItemsList.push({
        label: circle.name,
        href: circleBase,
        icon: CircleDot,
        match: "startsWith",
      });
    });

    return [
      {
        heading: "Circles",
        items: [
          {
            label: "All Circles",
            href: "/dashboard",
            icon: LayoutDashboard,
            match: "exact",
            subItems: circleItemsList,
          },
        ],
      },
    ];
  }, [circles]);

  return (
    <SidebarProvider
      value={{
        isSidebarCollapsed,
        toggleSidebar: () => setIsSidebarCollapsed((current) => !current),
      }}
    >
      <div className="min-h-screen bg-[var(--color-background-section)] text-[var(--color-text-default)]">
        <header className="fixed inset-x-0 top-0 z-30 h-[76px] border-b border-[var(--color-border-muted)] bg-[color:color-mix(in_srgb,var(--color-background-default)_92%,transparent)] backdrop-blur-md">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:pl-[116px]">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl text-[var(--color-text-alternative)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-primary-default)] lg:hidden"
                aria-label="Open navigation"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="lg:hidden">
                <BrandMark brand={brand} compact />
              </div>
            </div>

            {headerSearch ? (
              <div className="hidden flex-1 justify-center px-4 md:flex">{headerSearch}</div>
            ) : (
              <div className="hidden flex-1 justify-center px-4 md:flex">
                <button
                  type="button"
                  data-onboarding="header-search"
                  className="flex h-12 w-full max-w-xl items-center gap-3 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-background-default)] px-4 text-left text-sm text-muted-foreground shadow-sm transition-all hover:border-[var(--color-border-default)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-muted)]"
                >
                  <Search className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">Search</span>
                  <kbd className="hidden rounded-md bg-[var(--color-background-muted)] px-2 py-1 text-xs font-bold text-[var(--color-text-alternative)] xl:inline-flex">
                    Ctrl K
                  </kbd>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {headerActions}
              {typeof notificationCount === "number" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-onboarding="notifications"
                  className="relative size-11 rounded-xl"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />
                  {notificationCount > 0 ? (
                    <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--color-error-default)] px-1 text-[11px] font-bold text-[var(--color-error-inverse)]">
                      {notificationCount}
                    </span>
                  ) : null}
                </Button>
              ) : null}

              {user ? (
                <Popover>
                  <PopoverTrigger
                    nativeButton
                    className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-muted)] focus-visible:ring-offset-2"
                    aria-label="Open profile"
                  >
                    <Avatar className="size-11 border-[var(--color-border-muted)] bg-[var(--color-background-default)]">
                      <AvatarImage src={user.avatarSrc ?? undefined} alt={user.name} />
                      <AvatarFallback className="bg-[var(--color-background-muted)] text-[var(--color-text-default)]">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={10} className="w-64 p-3 border border-[var(--color-border-muted)] bg-[var(--color-background-default)] shadow-xl rounded-2xl">
                    <div className="flex flex-col gap-3">
                      {/* User Header */}
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 border border-[var(--color-border-muted)] bg-[var(--color-background-default)]">
                          <AvatarImage src={user.avatarSrc ?? undefined} alt={user.name} />
                          <AvatarFallback className="bg-[var(--color-background-muted)] text-[var(--color-text-default)]">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-[var(--color-text-default)]">
                            {user.name}
                          </h4>
                          <p className="truncate text-xs font-mono font-semibold text-indigo-500 mt-0.5">
                            ID: {user.username || "Not Set"}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-[var(--color-border-muted)] pt-2 flex flex-col gap-1.5">
                        {user.username ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs font-semibold h-8"
                            onClick={() => {
                              navigator.clipboard.writeText(user.username || "");
                              toast.success("User ID copied to clipboard!");
                            }}
                          >
                            Copy User ID
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs font-semibold h-8 text-[var(--color-error-default)] hover:bg-[var(--color-error-muted)] hover:text-[var(--color-error-default)]"
                          onClick={async () => {
                            await logoutAction();
                          }}
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          </div>
        </header>

        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[min(90vw,19rem)] gap-0 border-r border-[var(--color-border-muted)] bg-[var(--color-background-default)] p-0 lg:hidden"
          >
            <SheetHeader className="border-b border-[var(--color-border-muted)] p-5">
              <SheetTitle className="flex items-center gap-3 text-xl">
                <BrandMark brand={brand} compact />
                Navigation
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-3 pb-4">
                {visibleNavigation.map((group, index) => (
                  <NavigationGroup
                    key={`${group.heading ?? "group"}-${index.toString()}`}
                    heading={group.heading}
                    items={group.items}
                    pathname={pathname}
                    onNavigate={() => setIsMobileSidebarOpen(false)}
                  />
                ))}
              </div>
            </ScrollArea>
            {sidebarFooter ? (
              <div className="border-t border-[var(--color-border-muted)] p-3">
                {sidebarFooter}
              </div>
            ) : null}
          </SheetContent>
        </Sheet>

        <aside
          data-onboarding="sidebar-nav"
          className={cn(
            "fixed top-0 bottom-0 left-0 z-40 hidden bg-[var(--color-background-default)] transition-[width,box-shadow] duration-200 lg:block border-r border-[var(--color-border-muted)]",
            isSidebarCollapsed ? "w-[84px]" : "w-[260px] shadow-2xl"
          )}
          onMouseEnter={() => setIsSidebarCollapsed(false)}
          onMouseLeave={() => setIsSidebarCollapsed(true)}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "flex h-[76px] items-center border-b border-[var(--color-border-muted)]",
                isSidebarCollapsed ? "justify-center px-2" : "justify-center px-5"
              )}
            >
              <BrandMark brand={brand} compact={isSidebarCollapsed} />
            </div>
            <ScrollArea className={cn("flex-1 py-3", isSidebarCollapsed ? "px-2" : "px-3")}>
              <div className={cn("space-y-3", isSidebarCollapsed && "space-y-2")}>
                {visibleNavigation.map((group, index) => (
                  <NavigationGroup
                    key={`${group.heading ?? "group"}-${index.toString()}`}
                    heading={group.heading}
                    items={group.items}
                    pathname={pathname}
                    collapsed={isSidebarCollapsed}
                  />
                ))}
              </div>
            </ScrollArea>
            {sidebarFooter ? (
              <div
                className={cn(
                  "border-t border-[var(--color-border-muted)]",
                  isSidebarCollapsed ? "p-2" : "p-3"
                )}
              >
                {sidebarFooter}
              </div>
            ) : null}
          </div>
        </aside>

        <main className="px-4 pb-8 pt-[96px] sm:px-6 lg:pr-6 lg:pl-[108px]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
