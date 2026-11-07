// @coresys/cscl-ui — everything that runs in any React app.
// Tauri-only pieces (window chrome, TabBar, SyncLink) live in "@coresys/cscl-ui/tauri".

// Primitives
export * from "./primitives/Button";
export * from "./primitives/IconButton";
export * from "./primitives/Badge";
export * from "./primitives/Card";
export * from "./primitives/Chip";
export * from "./primitives/SegmentedControl";
export * from "./primitives/Switch";
export * from "./primitives/Slider";
export * from "./primitives/Kbd";
export * from "./primitives/ScrollArea";

// Inputs
export * from "./inputs/Field";
export * from "./inputs/TagInput";
export * from "./inputs/Combobox";
export * from "./inputs/HeroSearchInput";
export * from "./inputs/ShortcutRecorder";
export * from "./inputs/ColorPicker";
export * from "./inputs/ColorPickerButton";

// Overlays
export * from "./overlays/Modal";
export * from "./overlays/ConfirmDialog";
export * from "./overlays/Dialogs";
export * from "./overlays/ConsentDialog";
export * from "./overlays/DetailsDialog";
export * from "./overlays/UpdateDialog";
export * from "./overlays/IconPicker";
export * from "./overlays/Menu";
export * from "./overlays/Popover";
export * from "./overlays/Tooltip";
export * from "./overlays/CommentCard";
export * from "./overlays/CommandPalette";

// Feedback
export * from "./feedback/ToastProvider";
export * from "./feedback/InlineBanner";
export * from "./feedback/EmptyState";
export * from "./feedback/ErrorState";
export * from "./feedback/FatalErrorScreen";
export * from "./feedback/Skeleton";
export * from "./feedback/ProgressBar";
export * from "./feedback/ProgressIndicator";
export * from "./feedback/JobRow";
export * from "./feedback/JobsPopover";
export * from "./feedback/LogConsole";
export * from "./feedback/FileDrop";

// Data display
export * from "./data-display/Avatar";
export * from "./data-display/Table";
export * from "./data-display/TreeView";
export * from "./data-display/TreeItem";
export * from "./data-display/treeUtils";
export * from "./data-display/ListView";
export * from "./data-display/ListRow";
export * from "./data-display/InlineRenameInput";
export * from "./data-display/Sparkline";
export * from "./data-display/MiniWaveform";
export * from "./data-display/Waveform";
export * from "./data-display/Ring";
export * from "./data-display/Donut";
export * from "./data-display/Heatmap";
export * from "./data-display/TimeReadout";
export * from "./data-display/ImageCaption";
export * from "./data-display/CreditsList";

// Media
export * from "./media/MediaTransport";
export * from "./media/Timeline";
export * from "./media/VideoStage";

// Dashboard
export * from "./dashboard/WidgetGrid";
export * from "./dashboard/WidgetFrame";
export * from "./dashboard/WidgetBoundary";
export * from "./dashboard/WidgetEmpty";
export * from "./dashboard/useGridDrag";
export * from "./dashboard/useWidgetOverflow";
export * from "./dashboard/types";

// Calendar
export * from "./calendar/MonthGrid";
export * from "./calendar/WeekStrip";
export * from "./calendar/WeekGrid";

// Navigation
export * from "./navigation/Tabs";
export * from "./navigation/Breadcrumbs";
export * from "./navigation/SidebarTabsDialog";

// Web (sites and landing pages)
export * from "./web/SiteHeader";
export * from "./web/Hero";
export * from "./web/ProductRow";
export * from "./web/FeatureGrid";
export * from "./web/SiteFooter";
export * from "./web/Pagination";
export * from "./web/Link";
export * from "./web/Accordion";

// Branding
export * from "./branding/CoresysMark";
export * from "./branding/SplashMark";
export * from "./branding/WordTicker";
export * from "./branding/BootTransitionSplash";

// Utilities and hooks
export * from "./lib/cn";
export * from "./lib/platform";
export * from "./lib/colors";
export * from "./lib/colorPalette";
export * from "./lib/lucideIcons";
export * from "./lib/mentionTrigger";
export * from "./lib/retry";
export * from "./lib/tags";
export * from "./lib/pages";
export * from "./lib/heat";
export * from "./lib/duration";
export * from "./lib/calendar";
export * from "./lib/media";
export * from "./lib/grid";
export * from "./lib/overflow";
export * from "./lib/waveformPath";
export * from "./lib/useScrollFade";
export * from "./lib/useWheelScrollX";
export * from "./lib/hooks/useAsyncResource";
export * from "./lib/hooks/useDebouncedValue";
export * from "./lib/hooks/useInfiniteScrollSentinel";
export * from "./lib/hooks/useListKeyboardNav";
export * from "./lib/hooks/useResizableWidth";
export * from "./lib/hooks/useTheme";
export * from "./lib/hooks/useTypewriterPlaceholder";
export * from "./lib/hooks/useNow";
