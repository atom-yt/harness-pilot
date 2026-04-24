# harness-pilot Library Modules

This directory contains shared utility modules for all harness-pilot tools.

## Modules

### config.js
Configuration loading utilities.

- `loadConfig(filename, baseDir)` - Load a JSON config file
- `loadConfigs(filenames, baseDir)` - Load multiple config files
- `loadConfigWithDefault(filename, defaultValue, baseDir)` - Load config with fallback

**Usage:**
```js
import { loadConfig } from './lib/config.js';
const rules = loadConfig('detection-rules.json');
```

### constants.js
Centralized constants for all tools.

**Categories:**
- Harness paths (`.harness/` and subdirectories)
- Common project directories (types, utils, components, etc.)
- File extensions by language
- Config files by language
- Analysis thresholds
- Ralph Wiggum Loop constants
- Environment variable names

**Usage:**
```js
import { getManifestPath, THRESHOLDS, HARNESS_SUBDIRS } from './lib/constants.js';
const manifestPath = getManifestPath(projectDir);
```

### detect-language.js
Unified project language detection.

- `detectLanguage(projectDir)` - Detect project language
- `getExtensions(language)` - Get file extensions for a language
- `getFrameworks(language)` - Get supported frameworks for a language
- `isLanguageFile(filename, language)` - Check if file matches language
- `detectFramework(language, projectDir)` - Detect framework for a language
- `getSupportedLanguages()` - Get all supported languages

**Usage:**
```js
import { detectLanguage, getExtensions } from './lib/detect-language.js';
const lang = detectLanguage();
const extensions = getExtensions(lang);
```

### fs-utils.js
Unified file system operations with consistent error handling.

**JSON Operations:**
- `readJSON(path, defaultValue)` - Read and parse JSON file (async)
- `readJSONSync(path, defaultValue)` - Read and parse JSON file (sync)
- `writeJSON(path, data, indent)` - Write data as JSON file (async)
- `writeJSONSync(path, data, indent)` - Write data as JSON file (sync)

**Directory Operations:**
- `ensureDir(path)` - Ensure directory exists (async)
- `ensureDirSync(path)` - Ensure directory exists (sync)
- `dirExists(path)` / `dirExistsSync(path)` - Check if directory exists

**File Operations:**
- `readFile(path, defaultValue)` - Read text file (async)
- `readFileSync(path, defaultValue)` - Read text file (sync)
- `writeFile(path, content)` - Write text file (async)
- `writeFileSync(path, content)` - Write text file (sync)
- `fileExists(path)` / `fileExistsSync(path)` - Check if file exists
- `deleteFile(path)` - Delete file if exists
- `checkFileSize(path, maxSize)` - Check file size with limit

**Usage:**
```js
import { readJSON, writeJSON } from './lib/fs-utils.js';
const config = await readJSON('config.json', {});
await writeJSON('output.json', { result: 'ok' });
```
Cross-platform path handling utilities.

- `getFilename(importMetaUrl)` - Get __filename from import.meta.url
- `getDirname(importMetaUrl)` - Get __dirname from import.meta.url
- `getPathInfo(importMetaUrl)` - Get both as object
- `normalizePath(filePath)` - Normalize path for cross-platform
- `joinPath(...segments)` - Join path segments
- `resolvePath(...segments)` - Resolve to absolute path
- `getRelativePath(from, to)` - Get relative path between two paths

**Usage:**
```js
import { getDirname, joinPath } from './lib/path-utils.js';
const __dirname = getDirname(import.meta.url);
const fullPath = joinPath(__dirname, 'config.json');
```

## Why These Modules?

These modules were extracted to eliminate code duplication and improve maintainability:

1. **config.js** - Eliminated 3 copies of `loadConfig()` function
2. **path-utils.js** - Eliminated 6 copies of `fileURLToPath` boilerplate
3. **detect-language.js** - Unified language detection across tools
4. **constants.js** - Centralized hardcoded paths and thresholds

## Benefits

- **DRY**: No more duplicated code
- **Consistency**: Single source of truth for common operations
- **Maintainability**: Change once, affect all tools
- **Type Safety**: Better structure for future TypeScript migration
- **Testability**: Easier to unit test shared logic