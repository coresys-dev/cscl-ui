// Entry of the CoreSys design system's components/bundle.js: the whole library
// (main, Tauri, Markdown and editor entries) on window.CoreSys, plus every lucide
// icon as CoreSys.Icons for the previews.
import * as lib from "../../src";
import * as tauri from "../../src/tauri";
import * as markdown from "../../src/markdown";
import * as editor from "../../src/editor";
import * as Icons from "lucide-react";

(window as unknown as { CoreSys: unknown }).CoreSys = { ...lib, ...tauri, ...markdown, ...editor, Icons };
