import { useTheme } from "next-themes";
import vetbalanceLogoDark from "@/assets/vetbalance-logo.png";
import vetbalanceLogoLight from "@/assets/vetbalance-logo-light.png";

interface VetBalanceLogoProps {
  className?: string;
  alt?: string;
}

export const VetBalanceLogo = ({ className = "h-12 w-12 object-contain", alt = "VetBalance Logo" }: VetBalanceLogoProps) => {
  const { resolvedTheme } = useTheme();
  
  // Use dark logo for dark theme, light logo for light theme
  const logoSrc = resolvedTheme === "dark" ? vetbalanceLogoDark : vetbalanceLogoLight;
  
  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
    />
  );
};
