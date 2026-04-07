"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ListOrdered,
  Users,
  Settings,
  ChevronDown,
  Activity, // 🆕 Imported Activity icon for Analytics
} from "lucide-react";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [openOverview, setOpenOverview] = useState(true);

  const itemClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
     ${pathname === path
      ? "bg-neutral-800 text-white"
      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
    }`;

  return (
    <aside className="w-64 bg-neutral-900 text-white p-5 flex flex-col">
      {/* Logo */}
      <div className="text-xl font-semibold mb-10">Ⓡ RetailIQ</div>

      {/* Menu */}
      <nav className="space-y-2 text-sm">
        {/* Overview Dropdown */}
        <button
          onClick={() => setOpenOverview(!openOverview)}
          className="w-full flex items-center justify-between px-4 py-2 text-neutral-400 hover:text-white"
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </div>
          <ChevronDown
            className={`w-4 h-4 transition ${openOverview ? "rotate-180" : ""
              }`}
          />
        </button>

        {openOverview && (
          <div className="ml-8 space-y-1">
            <Link href="/seller/dashboard" className={itemClass("/seller/dashboard")}>
              Summary
            </Link>
            <Link href="#" className="block px-4 py-2 text-neutral-500">
              Custom view
            </Link>
          </div>
        )}

        {/* 🆕 Analytics Link Added Here */}
        <Link href="/seller/analytics" className={itemClass("/seller/analytics")}>
          <Activity className="w-4 h-4" /> Analytics
        </Link>

        <Link href="/seller/products" className={itemClass("/seller/products")}>
          <Package className="w-4 h-4" /> Products
        </Link>

        <Link href="/seller/orders" className={itemClass("/seller/orders")}>
          <ListOrdered className="w-4 h-4" /> Orders
        </Link>

        <Link href="/seller/customers" className={itemClass("/seller/customers")}>
          <Users className="w-4 h-4" /> Customers
        </Link>

        <Link href="/seller/settings" className={itemClass("/seller/settings")}>
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </nav>
    </aside>
  );
}