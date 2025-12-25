"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "TV Shows", href: "/tv" },
];

export function Navbar() {
    const pathname = usePathname();

    // Hide navbar on watch pages for immersive video experience
    if (pathname?.startsWith("/watch")) {
        return null;
    }

    return (
        <header className="fixed top-0 z-50 w-full">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none" />

            <nav className="relative flex items-center px-4 md:px-12 py-4">
                {/* Logo and Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/svg/evolix.svg"
                            alt="Evolix"
                            width={100}
                            height={32}
                            className="h-6 w-auto"
                            priority
                        />
                    </Link>

                    {/* Navigation Links - hidden on mobile/tablet, shown in bottom nav */}
                    <ul className="hidden lg:flex items-center gap-6">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-white",
                                        pathname === item.href
                                            ? "text-white"
                                            : "text-gray-300"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    );
}

