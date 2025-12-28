"use client";

import Image from "next/image";
import {
  FaFileCirclePlus,
  FaFolderOpen,
  FaGear,
  FaImage,
  FaStar,
  FaTrash,
} from "react-icons/fa6";
import { IoGrid } from "react-icons/io5";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/_ui/sidebar";

interface AppSidebarProps {
  onHomeClick: () => void;
  onImportClick: () => void;
}

export function AppSidebar({ onHomeClick, onImportClick }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Image src="/logo.svg" alt="Sheets" width={35} height={35} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onHomeClick}
                  tooltip="All Files"
                  className="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <IoGrid className="text-muted-foreground" />
                  <span>All Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Photo" disabled>
                  <FaImage className="text-muted-foreground" />
                  <span className="text-muted-foreground">Photo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Favorite" disabled>
                  <FaStar className="text-muted-foreground" />
                  <span className="text-muted-foreground">Favorite</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Shared Files" disabled>
                  <FaFolderOpen className="text-muted-foreground" />
                  <span className="text-muted-foreground">Shared Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Delete Files" disabled>
                  <FaTrash className="text-muted-foreground" />
                  <span className="text-muted-foreground">Delete Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" disabled>
                  <FaGear className="text-muted-foreground" />
                  <span className="text-muted-foreground">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onImportClick}
                  tooltip="Import File"
                >
                  <FaFileCirclePlus />
                  <span>Import File</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Recent Files">
              <FaFolderOpen />
              <span className="text-xs text-muted-foreground">
                Files stored locally in your browser
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
