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
import { useNavigate } from "@tanstack/react-router"

export function SearchCommand({
  open,
  setOpen,
  workspace,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  workspace: string
}) {
  const navigate = useNavigate()

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

  const calendarViews = [
    { value: "month", label: "Month", shortcut: "M" },
    { value: "week", label: "Week", shortcut: "W" },
    { value: "day", label: "Day", shortcut: "D" },
    { value: "agenda", label: "Agenda", shortcut: "A" },
  ] as const

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
          {calendarViews.map((view) => (
            <CommandItem 
              key={view.value} 
              value={view.value} 
              onSelect={() => runCommand(() => navigate({ 
                to: "/$workspace/calendar", 
                params: { workspace }, 
                search: { view: view.value } 
              }))}
            >
              <Calendar />
              <span>{view.label}</span>
              <CommandShortcut>{view.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
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
