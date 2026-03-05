import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [responsivePosition, setResponsivePosition] = useState<ToasterProps["position"]>("top-right")

  useEffect(() => {
    const applyPosition = () => {
      setResponsivePosition(window.innerWidth < 640 ? "top-center" : "top-right")
    }

    applyPosition()
    window.addEventListener("resize", applyPosition)
    return () => window.removeEventListener("resize", applyPosition)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={props.position ?? responsivePosition}
      className="toaster group"
      offset={{
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        right: "16px",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        left: "16px",
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast }
