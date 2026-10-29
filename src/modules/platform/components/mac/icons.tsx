import {
  AppWindowIcon,
  BellIcon,
  BookOpenIcon,
  CalendarBlankIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CommandIcon,
  CrosshairIcon,
  DesktopIcon,
  FileTextIcon,
  FlagIcon,
  FlaskIcon,
  FunnelIcon,
  GaugeIcon,
  GlobeIcon,
  InfoIcon,
  LightbulbIcon,
  LightningIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  NewspaperIcon,
  NotebookIcon,
  PlugIcon,
  ScalesIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
  SquaresFourIcon,
  StackIcon,
  StarIcon,
  TrendUpIcon,
  UserIcon,
  UsersThreeIcon,
  WalletIcon,
  WifiHighIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { IconWeight } from "@phosphor-icons/react";

/**
 * Platform icon set: Phosphor (MIT), chosen over lucide for its SF Symbols–like
 * weights (see README). The SSR entry has no context, so it renders in both
 * Server and Client Components.
 */
const ICONS = {
  app: AppWindowIcon,
  bell: BellIcon,
  book: BookOpenIcon,
  calendar: CalendarBlankIcon,
  chevron: CaretRightIcon,
  bars: ChartBarIcon,
  chart: ChartLineUpIcon,
  message: ChatCircleTextIcon,
  check: CheckCircleIcon,
  clock: ClockIcon,
  command: CommandIcon,
  target: CrosshairIcon,
  desktop: DesktopIcon,
  file: FileTextIcon,
  flag: FlagIcon,
  flask: FlaskIcon,
  filter: FunnelIcon,
  gauge: GaugeIcon,
  globe: GlobeIcon,
  info: InfoIcon,
  lightbulb: LightbulbIcon,
  zap: LightningIcon,
  link: LinkSimpleIcon,
  lock: LockSimpleIcon,
  search: MagnifyingGlassIcon,
  mic: MicrophoneIcon,
  news: NewspaperIcon,
  journal: NotebookIcon,
  plug: PlugIcon,
  scale: ScalesIcon,
  shield: ShieldCheckIcon,
  sliders: SlidersHorizontalIcon,
  sparkle: SparkleIcon,
  grid: SquaresFourIcon,
  layers: StackIcon,
  star: StarIcon,
  trend: TrendUpIcon,
  user: UserIcon,
  users: UsersThreeIcon,
  wallet: WalletIcon,
  wifi: WifiHighIcon,
  close: XIcon,
} as const;

export type PlatformIcon = keyof typeof ICONS;

export function PIcon({
  name,
  size = 18,
  weight = "regular",
  className = "",
  label,
}: {
  name: PlatformIcon;
  size?: number;
  weight?: IconWeight;
  className?: string;
  label?: string;
}) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      weight={weight}
      className={`shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
