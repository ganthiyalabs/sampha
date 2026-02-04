import * as React from "react"
import {
  Calendar,
  Settings,
} from "lucide-react"


import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"
import { useNavigate, useParams } from "@tanstack/react-router"

export function SearchCommand({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { workspace?: string }
  const workspace = params.workspace || "default"

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement
      const isTyping = 
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      // Open with Cmd+K or Ctrl+K (original shortcut)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
        return
      }

      // Open with just "K" key (new shortcut) - but not when typing
      if (e.key === "k" && !isTyping && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Calendar">
            <CommandItem key="month" value="month" onSelect={() => runCommand(() => navigate({ to: "/$workspace/calendar", params: { workspace }, search: { view: "month" } }))}>
                <Calendar />
                <span>Month</span>
                <CommandShortcut>M</CommandShortcut>
            </CommandItem>
            <CommandItem key="week" value="week" onSelect={() => runCommand(() => navigate({ to: "/$workspace/calendar", params: { workspace }, search: { view: "week" } }))}>
                <Calendar />
                <span>Week</span>
                <CommandShortcut>W</CommandShortcut>
            </CommandItem>
            <CommandItem key="day" value="day" onSelect={() => runCommand(() => navigate({ to: "/$workspace/calendar", params: { workspace }, search: { view: "day" } }))}>
                <Calendar />
                <span>Day</span>
                <CommandShortcut>D</CommandShortcut>
            </CommandItem>
            <CommandItem key="agenda" value="agenda" onSelect={() => runCommand(() => navigate({ to: "/$workspace/calendar", params: { workspace }, search: { view: "agenda" } }))}>
                <Calendar />
                <span>Agenda</span>
                <CommandShortcut>A</CommandShortcut>
            </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem key="settings" value="settings" onSelect={() => runCommand(() => navigate({ to: "/$workspace/settings", params: { workspace } }))}>
            <Settings />
            <span>Settings</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
