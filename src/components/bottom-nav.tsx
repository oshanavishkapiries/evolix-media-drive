"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "TV Shows", href: "/tv", icon: Tv },
];

export function BottomNav() {
    const pathname = usePathname();

    // Hide on watch pages
    if (pathname?.startsWith("/watch")) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                            <span className="text-xs font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
