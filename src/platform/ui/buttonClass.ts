// Button class recipes (DESIGN-GUIDE §6.1). A plain function, not a client
// component, so Server Components can style links with it too.
const BUTTON_VARIANTS = {
  primary: "afvar-glass-primary font-semibold",
  secondary: "bg-(--segment-fill) text-(--text-primary) hover:bg-(--surface-3)",
  ghost: "text-(--text-secondary) hover:bg-(--surface-2) hover:text-(--text-primary)",
  danger: "afvar-glass-primary font-semibold",
} as const;

export type ButtonClassVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonClassVariant = "secondary", size: "sm" | "md" | "lg" = "md") {
  const sizes = { sm: "h-8 px-3.5 text-[13px]", md: "h-10 px-5 text-[13px]", lg: "h-12 px-6 text-[15px]" };
  return `afvar-glass-button inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-[background-color,color,transform] duration-150 active:scale-[.985] disabled:pointer-events-none disabled:opacity-45 ${sizes[size]} ${BUTTON_VARIANTS[variant]}`;
}
