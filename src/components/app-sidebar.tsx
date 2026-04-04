import * as React from "react"
import {
  Terminal,
  LayoutDashboard,
  School,
  Code2,
  Database,
  LineChart,
  Trophy,
  Bot,
  Settings,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Modules",
      url: "#",
      icon: School,
    },
    {
      title: "Challenges",
      url: "#",
      icon: Code2,
    },
    {
      title: "Repositories",
      url: "#",
      icon: Database,
    },
    {
      title: "Progress",
      url: "#",
      icon: LineChart,
    },
    {
      title: "Leaderboard",
      url: "#",
      icon: Trophy,
    },
  ],
  secondary: [
    {
      title: "AI Assistant",
      url: "#",
      icon: Bot,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-white/5 bg-black/20 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Terminal className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-display font-bold text-sm tracking-tight">Git Mastery</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">v4.0.2-stable</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-6 mb-4">Command Center</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive} className="h-12 px-6 hover:bg-primary/10 hover:text-primary transition-all">
                  <a href={item.url} className="flex items-center gap-4">
                    <item.icon className="size-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-6 mb-4">Support</SidebarGroupLabel>
          <SidebarMenu>
            {data.secondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" className="h-10 px-6 hover:bg-secondary/10 hover:text-secondary transition-all">
                  <a href={item.url} className="flex items-center gap-4">
                    <item.icon className="size-4" />
                    <span className="text-xs">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
