"use client";

import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check, Sun, Moon } from 'lucide-react';

const themes = [
  { 
    value: 'professional', 
    label: 'Professional (Light)', 
    description: 'Clean Fine-Linen & Royal Purple', 
    icon: Sun,
    color: 'bg-gradient-to-r from-[#FAF8FD] to-[#5B3594]' 
  },
  { 
    value: 'dark', 
    label: 'Dark Mode', 
    description: 'Deep Obsidian & Amber Glow', 
    icon: Moon,
    color: 'bg-gradient-to-r from-[#140E24] to-[#FF7A3D]' 
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          {theme === 'dark' ? <Moon className="h-[1.1rem] w-[1.1rem] text-[#FF7A3D]" /> : <Sun className="h-[1.1rem] w-[1.1rem] text-[#5B3594]" />}
          <span className="sr-only">Change workspace theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Workspace Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value as 'professional' | 'dark')}
              className="cursor-pointer py-2.5"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-md ${t.color} border border-border flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{t.label}</span>
                    <span className="text-[10px] text-muted-foreground">{t.description}</span>
                  </div>
                </div>
                {theme === t.value && <Check className="h-4 w-4 text-[#FF7A3D]" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
