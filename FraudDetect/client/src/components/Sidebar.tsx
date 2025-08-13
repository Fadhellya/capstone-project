import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Shield,
  Menu,
  X,
  Gauge,
  Upload,
  Brain,
  BarChart3,
  Settings,
  User,
  UserPlus,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "Dataset Upload", href: "/dataset", icon: Upload },
  { name: "ML Training", href: "/training", icon: Brain },
  { name: "Results & Analytics", href: "/results", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-gray-900"
          data-testid="button-mobile-menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="overlay-mobile-menu"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-bg-dark text-white transform transition-transform duration-300 z-40",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link href="/dashboard">
            <div className="flex items-center text-xl font-bold text-blue-400" data-testid="link-logo">
              <Shield className="mr-2" size={24} />
              FraudGuard ML
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-blue-400 transition-colors",
                    isActive && "bg-gray-800 text-blue-400"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`link-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="mr-3" size={20} />
                  {item.name}
                </div>
              </Link>
            );
          })}

          <div className="border-t border-gray-700 mt-8 pt-4">
            <a
              href="/api/logout"
              className="flex items-center px-6 py-3 text-gray-300 hover:bg-red-800 hover:text-red-400 transition-colors"
              data-testid="link-sign-out"
            >
              <LogOut className="mr-3" size={20} />
              Sign Out
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
