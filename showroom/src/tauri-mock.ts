// Stand-in for every @tauri-apps/* module: nothing native runs in the harness.
const noop = async (..._a: unknown[]): Promise<any> => undefined;
const win = {
  minimize: noop, maximize: noop, unmaximize: noop, toggleMaximize: noop, close: noop, hide: noop, show: noop,
  isMaximized: async () => false, isFullscreen: async () => false, isFocused: async () => true,
  onResized: async () => () => {}, onFocusChanged: async () => () => {}, onMoved: async () => () => {},
  listen: async () => () => {}, setTitle: noop, startDragging: noop, label: "main",
};
export const getCurrentWindow = () => win;
export const getCurrentWebview = () => ({ ...win, onDragDropEvent: async () => () => {} });
export const getCurrentWebviewWindow = getCurrentWindow;
export const Window = class {};
export const Webview = class {};
export const WebviewWindow = class {};
export const invoke = async (cmd: string): Promise<any> => (/list|get|recent|logs/i.test(cmd) ? [] : null);
export const listen = async () => () => {};
export const once = listen;
export const emit = noop;
export const emitTo = noop;
export const convertFileSrc = (p: string) => p;
export class Channel { onmessage: unknown; }
export const SERIALIZE_TO_IPC_FN = "__TAURI_TO_IPC_KEY__";
export type InvokeArgs = Record<string, unknown>;
export type InvokeOptions = Record<string, unknown>;
export const getVersion = async () => "0.0.0";
export const appDataDir = async () => "/";
export const open = noop;
export const save = noop;
export const openUrl = noop;
export const revealItemInDir = noop;
export const readFile = async () => new Uint8Array();
export const exit = noop;
export const relaunch = noop;
export const isPermissionGranted = async () => false;
export const requestPermission = async () => "denied";
export const sendNotification = noop;
export const mockIPC = noop;
export const mockWindows = noop;
export const mockConvertFileSrc = noop;
export const clearMocks = noop;
