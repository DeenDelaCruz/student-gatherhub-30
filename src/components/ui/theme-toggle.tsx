
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Only show the toggle after component mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply the appropriate class to the body element based on theme
  useEffect(() => {
    if (mounted) {
      document.body.className = theme === "dark" ? "dark" : "light";
    }
  }, [theme, mounted]);

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-dark-300/50 dark:bg-white/10 border-white/10 hover:bg-dark-400 dark:hover:bg-white/20 light:bg-white/80 light:border-black/10 light:hover:bg-gray-100"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
