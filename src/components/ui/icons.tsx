import type { ComponentType, SVGProps } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  ArrowsInIcon,
  ArrowsOutIcon,
  BroadcastIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleHalfIcon,
  CircleNotchIcon,
  CodeIcon,
  CopyIcon,
  DownloadSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  FileTextIcon,
  GaugeIcon,
  GearSixIcon,
  GraphIcon,
  HardDrivesIcon,
  InfoIcon,
  KeyIcon,
  ListIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  NetworkIcon,
  PlugIcon,
  PlusIcon,
  ScrollIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  SunIcon,
  TerminalIcon,
  TimerIcon,
  TrashIcon,
  TrayIcon,
  UploadSimpleIcon,
  UserPlusIcon,
  UsersThreeIcon,
  WarningIcon,
  XIcon,
  type IconWeight,
} from '@phosphor-icons/react';

// Phosphor icons (MIT), regular weight. Names keep the old Icon* API so call sites stay put.

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number;
  weight?: IconWeight;
}

type PhosphorComponent = ComponentType<IconProps>;

const make = (Glyph: PhosphorComponent, name: string) => {
  function Icon({ size = 20, ...props }: IconProps) {
    return <Glyph size={size} aria-hidden="true" focusable="false" {...props} />;
  }
  Icon.displayName = name;
  return Icon;
};

export const IconCopy = make(CopyIcon as PhosphorComponent, 'IconCopy');
export const IconSlidersHorizontal = make(
  SlidersHorizontalIcon as PhosphorComponent,
  'IconSlidersHorizontal'
);
export const IconKey = make(KeyIcon as PhosphorComponent, 'IconKey');
export const IconModelCluster = make(GraphIcon as PhosphorComponent, 'IconModelCluster');
export const IconFilterAll = make(SquaresFourIcon as PhosphorComponent, 'IconFilterAll');
export const IconFileText = make(FileTextIcon as PhosphorComponent, 'IconFileText');
export const IconShield = make(ShieldCheckIcon as PhosphorComponent, 'IconShield');
export const IconSettings = make(GearSixIcon as PhosphorComponent, 'IconSettings');
export const IconPlug = make(PlugIcon as PhosphorComponent, 'IconPlug');
export const IconScrollText = make(ScrollIcon as PhosphorComponent, 'IconScrollText');
export const IconInfo = make(InfoIcon as PhosphorComponent, 'IconInfo');
export const IconRefreshCw = make(ArrowClockwiseIcon as PhosphorComponent, 'IconRefreshCw');
export const IconDownload = make(DownloadSimpleIcon as PhosphorComponent, 'IconDownload');
export const IconUpload = make(UploadSimpleIcon as PhosphorComponent, 'IconUpload');
export const IconTrash2 = make(TrashIcon as PhosphorComponent, 'IconTrash2');
export const IconMaximize2 = make(ArrowsOutIcon as PhosphorComponent, 'IconMaximize2');
export const IconMinimize2 = make(ArrowsInIcon as PhosphorComponent, 'IconMinimize2');
export const IconPlus = make(PlusIcon as PhosphorComponent, 'IconPlus');
export const IconAlertTriangle = make(WarningIcon as PhosphorComponent, 'IconAlertTriangle');
export const IconCheckCircle2 = make(CheckCircleIcon as PhosphorComponent, 'IconCheckCircle2');
export const IconNetwork = make(NetworkIcon as PhosphorComponent, 'IconNetwork');
export const IconLoader2 = make(CircleNotchIcon as PhosphorComponent, 'IconLoader2');
export const IconChevronUp = make(CaretUpIcon as PhosphorComponent, 'IconChevronUp');
export const IconChevronDown = make(CaretDownIcon as PhosphorComponent, 'IconChevronDown');
export const IconChevronLeft = make(CaretLeftIcon as PhosphorComponent, 'IconChevronLeft');
export const IconSearch = make(MagnifyingGlassIcon as PhosphorComponent, 'IconSearch');
export const IconX = make(XIcon as PhosphorComponent, 'IconX');
export const IconCheck = make(CheckIcon as PhosphorComponent, 'IconCheck');
export const IconEye = make(EyeIcon as PhosphorComponent, 'IconEye');
export const IconEyeOff = make(EyeSlashIcon as PhosphorComponent, 'IconEyeOff');
export const IconInbox = make(TrayIcon as PhosphorComponent, 'IconInbox');
export const IconSatellite = make(BroadcastIcon as PhosphorComponent, 'IconSatellite');
export const IconTimer = make(TimerIcon as PhosphorComponent, 'IconTimer');
export const IconExternalLink = make(ArrowSquareOutIcon as PhosphorComponent, 'IconExternalLink');
export const IconCode = make(CodeIcon as PhosphorComponent, 'IconCode');
export const IconSidebarDashboard = make(ChartBarIcon as PhosphorComponent, 'IconSidebarDashboard');
export const IconSidebarConfig = make(
  SlidersHorizontalIcon as PhosphorComponent,
  'IconSidebarConfig'
);
export const IconSidebarAuthFiles = make(
  UsersThreeIcon as PhosphorComponent,
  'IconSidebarAuthFiles'
);
export const IconSidebarOauth = make(UserPlusIcon as PhosphorComponent, 'IconSidebarOauth');
export const IconSidebarQuota = make(GaugeIcon as PhosphorComponent, 'IconSidebarQuota');
export const IconSidebarLogs = make(TerminalIcon as PhosphorComponent, 'IconSidebarLogs');
export const IconSidebarSystem = make(HardDrivesIcon as PhosphorComponent, 'IconSidebarSystem');
export const IconRefresh = make(ArrowClockwiseIcon as PhosphorComponent, 'IconRefresh');
export const IconMenu = make(ListIcon as PhosphorComponent, 'IconMenu');
export const IconSun = make(SunIcon as PhosphorComponent, 'IconSun');
export const IconMoon = make(MoonIcon as PhosphorComponent, 'IconMoon');
export const IconThemeAuto = make(CircleHalfIcon as PhosphorComponent, 'IconThemeAuto');
export const IconLogout = make(SignOutIcon as PhosphorComponent, 'IconLogout');
