"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  LogOut,
  Settings,
  X,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  ShieldCheck,
  Building,
  Mail,
} from "lucide-react";

interface TopbarUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface TopbarWorkspace {
  id: string;
  name: string;
  slug: string;
}

interface TopbarProps {
  onToggleSidebar: () => void;
}

interface SearchResults {
  leads: any[];
  companies: any[];
  opportunities: any[];
  tasks: any[];
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<TopbarUser | null>(null);
  const [workspace, setWorkspace] = useState<TopbarWorkspace | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
          if (data.data.workspace) {
            setWorkspace(data.data.workspace);
          }
        }
      })
      .catch(() => { });
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search execution
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json?.data || null);
          setShowSearchDropdown(true);
        }
      } catch {
        // ignore search error
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    setShowDropdown(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "U";

  const totalResultsCount =
    (searchResults?.leads?.length || 0) +
    (searchResults?.companies?.length || 0) +
    (searchResults?.opportunities?.length || 0) +
    (searchResults?.tasks?.length || 0);

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#ECE7DE] bg-[#FFFFFF]/95 px-3 sm:px-5 backdrop-blur-sm select-none shrink-0">
      {/* Left: Hamburger + Live Workspace Scoped Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-[#5C5850] hover:bg-[#F3EFE7] lg:hidden focus-ring shrink-0 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search with Live Workspace Results */}
        <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#8C867B] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults && totalResultsCount > 0) setShowSearchDropdown(true);
            }}
            placeholder="Search leads, companies, deals, tasks…"
            className="h-8 w-full rounded-lg border border-[#D9D2C4]/80 bg-[#FAF8F5] pl-8 pr-7 text-xs text-[#1C1B18] placeholder:text-[#8C867B] focus-ring focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
                setShowSearchDropdown(false);
              }}
              className="absolute right-2 top-2 text-[#8C867B] hover:text-[#1C1B18] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 top-10 w-full rounded-xl border border-[#D9D2C4] bg-white p-2 shadow-xl z-50 max-h-96 overflow-y-auto animate-fade-in text-xs">
              {totalResultsCount === 0 ? (
                <div className="p-3 text-center text-[#8C867B] italic">
                  No matching workspace records found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Leads */}
                  {searchResults.leads?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C867B]">
                        <Users className="w-3 h-3 text-[#8D5B28]" />
                        <span>Leads</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.leads.map((l) => (
                          <Link
                            key={l._id}
                            href={`/leads/${l._id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-[#1C1B18]">
                                {l.firstName} {l.lastName}
                              </div>
                              <div className="text-[11px] text-[#5C5850]">
                                {l.company || l.email}
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-[#8D5B28] bg-[#F6EDE3] px-1.5 py-0.5 rounded">
                              {l.priority}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deals / Opportunities */}
                  {searchResults.opportunities?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C867B]">
                        <Briefcase className="w-3 h-3 text-[#8D5B28]" />
                        <span>Opportunities</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.opportunities.map((o) => (
                          <Link
                            key={o._id}
                            href="/opportunities"
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-[#1C1B18]">{o.name}</div>
                              <div className="text-[11px] text-[#5C5850]">{o.companyName}</div>
                            </div>
                            <span className="font-bold text-[#246E47] text-[11px]">
                              ${(o.value || 0).toLocaleString()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Companies */}
                  {searchResults.companies?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C867B]">
                        <Building2 className="w-3 h-3 text-[#8D5B28]" />
                        <span>Companies</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.companies.map((c) => (
                          <Link
                            key={c._id}
                            href="/companies"
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                          >
                            <span className="font-semibold text-[#1C1B18]">{c.name}</span>
                            <span className="text-[11px] text-[#8C867B]">
                              {c.industry || c.country || "Company"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C867B]">
                        <CheckSquare className="w-3 h-3 text-[#8D5B28]" />
                        <span>Tasks</span>
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.tasks.map((t) => (
                          <Link
                            key={t._id}
                            href="/tasks"
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                          >
                            <span className="font-semibold text-[#1C1B18] truncate max-w-[200px]">
                              {t.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#5C5850] bg-[#FAF8F5] px-1.5 py-0.5 rounded">
                              {t.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Workspace Indicator + User Menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Workspace Pill */}
        {workspace && (
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] px-2.5 py-1 text-xs text-[#5C5850]">
            <Building className="w-3.5 h-3.5 text-[#8D5B28]" />
            <span className="font-semibold max-w-[140px] truncate text-[#1C1B18]">
              {workspace.name}
            </span>
          </div>
        )}

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[#F3EFE7] transition-colors focus-ring cursor-pointer"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            aria-label="User Account Menu"
          >
            {!avatarError && user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name || "User Avatar"}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="h-7 w-7 rounded-full object-cover shrink-0 border border-[#ECE7DE]"
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8D5B28] text-white shrink-0 shadow-xs"
                title={user?.email || "User Account"}
              >
                <Mail className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="hidden md:block text-xs font-semibold text-[#1C1B18] max-w-[130px] truncate">
              {user?.name || "Account"}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#D9D2C4] bg-white p-2 shadow-xl animate-fade-in z-50">
              <div className="px-2.5 py-2.5 border-b border-[#ECE7DE] mb-1">
                <div className="text-xs font-bold text-[#1C1B18] truncate">
                  {user?.name || "LeadFlow User"}
                </div>
                <div className="text-[11px] text-[#8C867B] truncate">
                  {user?.email || "Google Account"}
                </div>
                {workspace && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5C5850]">
                    <span className="truncate">Workspace: <strong>{workspace.name}</strong></span>
                    <span className="font-bold text-[#8D5B28] bg-[#F6EDE3] px-1.5 py-0.5 rounded text-[9px] uppercase">
                      {user?.role || "OWNER"}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href="/settings"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#5C5850] hover:bg-[#FAF8F5] hover:text-[#1C1B18] transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Workspace Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
