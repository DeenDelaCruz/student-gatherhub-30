
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Override any props to force dark theme
  return <NextThemesProvider {...props} enableSystem={false} forcedTheme="dark">{children}</NextThemesProvider>
}
