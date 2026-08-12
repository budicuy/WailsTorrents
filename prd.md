You are a senior Wails v3, Go, React, TypeScript, Bun, desktop application, performance, memory management, networking, and software architecture engineer.

Your task is to build a modern, functional BitTorrent downloader for Windows.

The application will use:

- Wails v3
- Go
- React
- TypeScript
- Bun
- Vite
- Tailwind CSS
- A modern component system such as shadcn/ui where appropriate

The application will eventually be distributed through the Microsoft Store.

The application name is:

TorrentDownloder

==================================================
IMPORTANT WAILS VERSION REQUIREMENT
==================================================

Use WAILS V3.

Do NOT use Wails v2 APIs, project structures, commands, or documentation.

The CLI is:

wails3

Development:

wails3 dev

Production build:

wails3 build

Packaging:

wails3 package

Use the current Wails v3 APIs and project structure.

Before implementing Wails-specific functionality, inspect the installed Wails version and project configuration.

Run:

wails3 version

and:

wails3 doctor

Do not assume Wails v2 APIs are valid.

Wails v3 is currently an evolving/alpha release, so avoid experimental APIs unless they are actually required.

Prefer stable documented Wails v3 APIs.


==================================================
1. PRIMARY OBJECTIVE
==================================================

Build a FUNCTIONAL BitTorrent downloader for Windows.

DO NOT build only a visual mockup.

The torrent workflow must actually work.

Priority order:

1. Correct and functional torrent downloading
2. Stability and reliability
3. Memory safety and memory efficiency
4. Performance
5. Clean architecture
6. Error handling
7. Good UX
8. Modern visual design
9. Security
10. Microsoft Store readiness


The MVP must support:

- adding .torrent files
- adding magnet links
- retrieving torrent metadata
- selecting download directory
- starting downloads
- pausing downloads
- resuming downloads
- removing torrents
- tracking progress
- showing download speed
- showing upload speed
- showing ETA
- showing peer/seed information when available
- detecting completion
- persisting torrent state
- resuming torrents after application restart


==================================================
2. TECHNOLOGY STACK
==================================================

The final application must use:

Wails v3
+
Go
+
React
+
TypeScript
+
Bun
+
Vite


Do NOT migrate the application to:

- .NET
- C#
- WinUI
- XAML
- Windows App SDK
- WPF
- WinForms
- .NET MAUI
- Electron
- Tauri
- Flutter
- Avalonia
- another desktop framework


Frontend:

React
TypeScript
Vite
Bun
Tailwind CSS


Backend:

Go


Desktop runtime:

Wails v3


==================================================
3. BUN REQUIREMENT
==================================================

Bun is the ONLY JavaScript/TypeScript package manager and script runner.

Do NOT use:

npm
pnpm
yarn

Use:

bun install
bun add
bun remove
bun run
bunx


Use Bun for frontend dependency management and scripts.

If package scripts exist, prefer:

bun run dev
bun run build
bun run typecheck
bun run lint
bun run format


Do not replace Bun with npm simply because a generic tutorial uses npm.


==================================================
4. FIRST STEP: INSPECT THE PROJECT
==================================================

Before modifying anything:

1. Inspect the complete project.
2. Inspect wails.json / Wails configuration.
3. Inspect go.mod.
4. Inspect Go source files.
5. Inspect frontend source.
6. Inspect package.json.
7. Inspect bun.lock / bun.lockb if present.
8. Inspect tsconfig files.
9. Inspect Vite configuration.
10. Inspect Tailwind configuration.
11. Inspect Wails bindings.
12. Inspect Wails generated files.
13. Inspect build configuration.
14. Inspect assets.
15. Inspect existing scripts.
16. Inspect Wails capabilities/security configuration if present.

Do not blindly overwrite existing files.

If the current project is not a Wails v3 project:

Create a clean Wails v3 project rather than mixing frameworks.

The final project must contain a clean Wails v3 architecture.


==================================================
5. ESTABLISH BASELINE
==================================================

Before implementing features:

Run:

wails3 version

wails3 doctor

Then:

bun install

Then:

bunx tsc --noEmit

Then:

go test ./...

Then:

wails3 dev

Verify that the blank application launches.

If the baseline does not work:

Fix the baseline before implementing torrent functionality.

Do not build major features on top of a broken project.


==================================================
6. FRONTEND
==================================================

Use:

React
TypeScript
Vite
Bun
Tailwind CSS


Frontend responsibilities:

- UI
- navigation
- dialogs
- forms
- user interaction
- presentation
- visual state
- torrent list
- settings
- loading states
- error states


Do NOT implement the BitTorrent engine in TypeScript.

Do NOT perform heavy filesystem/network/torrent operations in JavaScript.

The frontend should communicate with Go through Wails bindings.


==================================================
7. GO BACKEND
==================================================

Go is responsible for:

- BitTorrent engine
- networking
- filesystem
- disk I/O
- torrent lifecycle
- persistence
- settings
- background workers
- torrent statistics
- application services
- resource management


Architecture:

React
   ↓
Wails generated bindings
   ↓
Go Services
   ↓
Torrent Service
   ↓
BitTorrent Engine


Keep the frontend independent from the torrent engine implementation.


==================================================
8. WAILS BINDINGS
==================================================

Use Wails v3's typed Go-to-TypeScript binding system.

Do not manually duplicate API definitions when Wails can generate them.

Expose application services through Wails services/bindings.

The frontend should call typed Go methods.

Conceptually:

Go:

TorrentService.AddTorrent(...)

↓

Generated TypeScript binding:

TorrentService.AddTorrent(...)


Use generated TypeScript bindings whenever possible.

Do not expose raw internal Go structures unnecessarily.

Do not expose third-party torrent engine objects directly to TypeScript.


==================================================
9. WAILS SERVICES
==================================================

Create focused Go services.

Suggested:

TorrentService
SettingsService
PersistenceService
FileService
ApplicationService


Example:

type TorrentService struct {
    ...
}


Services should contain application-level business logic.

Do NOT put all logic inside main.go.

Do NOT create a giant service with hundreds of unrelated methods.

Keep responsibilities focused.


==================================================
10. TORRENT ENGINE
==================================================

DO NOT implement the BitTorrent protocol from scratch.

Do not manually implement:

- DHT
- tracker protocol
- peer protocol
- piece exchange
- metadata protocol
- hashing
- choking/unchoking
- NAT traversal
- peer management
- torrent storage protocol


Use an established Go BitTorrent library.

Potential candidates include:

- an established maintained Go BitTorrent library
- an actively maintained production-grade torrent engine


Before selecting a dependency:

1. Inspect current maintenance status.
2. Inspect latest release.
3. Inspect Go compatibility.
4. Inspect Windows compatibility.
5. Inspect BitTorrent feature support.
6. Inspect magnet support.
7. Inspect DHT support.
8. Inspect torrent v2 support if relevant.
9. Inspect memory characteristics.
10. Inspect API quality.
11. Inspect license.
12. Inspect community/adoption.
13. Prefer mature and maintained libraries.

Do NOT blindly select a torrent library.

Document the reason for the selected library.


==================================================
11. TORRENT SERVICE ABSTRACTION
==================================================

The React frontend must NOT know which BitTorrent library is being used.

Create an application-owned abstraction.

For example:

type TorrentEngine interface {
    AddTorrent(...)
    AddMagnet(...)
    Start(...)
    Pause(...)
    Resume(...)
    Remove(...)
    GetTorrent(...)
    GetTorrents(...)
}


Then:

TorrentService
    ↓
TorrentEngine
    ↓
Selected BitTorrent library


The purpose is to allow the torrent engine to be replaced later without rewriting the frontend.


==================================================
12. APPLICATION MODELS
==================================================

Create application-owned models.

Examples:

TorrentItem
TorrentStatus
TorrentStatistics
TorrentFile
TorrentSettings
TorrentError


Do not expose third-party torrent library structures directly through Wails bindings.

Keep DTOs simple and serialization-friendly.


==================================================
13. MVP FEATURES
==================================================

Implement REAL functionality.


------------------------------------------
13.1 ADD .TORRENT
------------------------------------------

Allow the user to select a .torrent file.

Workflow:

Add Torrent
    ↓
File picker
    ↓
Validate
    ↓
Read metadata
    ↓
Display metadata
    ↓
Select download directory
    ↓
Start or queue


Use Wails/Go appropriate filesystem APIs.

Do not hardcode developer-specific paths.


------------------------------------------
13.2 MAGNET LINK
------------------------------------------

Support:

magnet:?xt=urn:btih:...


User can:

- paste magnet link
- validate it
- submit it
- retrieve metadata
- choose download location
- start/queue torrent


During metadata retrieval:

Getting torrent information...

Please wait.


Do not freeze the UI.


------------------------------------------
13.3 TORRENT LIST
------------------------------------------

Display:

- Name
- Status
- Progress
- Download speed
- Upload speed
- ETA
- Downloaded
- Total size
- Peers
- Seeds
- Ratio when available


Example:

Ubuntu.iso

██████████████░░░░ 72%

↓ 12.4 MB/s
↑ 1.2 MB/s

ETA 04:32


------------------------------------------
13.4 TORRENT STATES
------------------------------------------

Support:

Queued
Checking
Downloading
Paused
Completed
Error


------------------------------------------
13.5 START
------------------------------------------

Start must actually start torrent activity.

Do not only update UI state.


------------------------------------------
13.6 PAUSE
------------------------------------------

Pause must actually pause torrent activity.

Do not only change UI state.


------------------------------------------
13.7 RESUME
------------------------------------------

Resume must continue existing torrent state.

Do not restart the download from zero.

Use the torrent engine's resume mechanism where available.


------------------------------------------
13.8 REMOVE
------------------------------------------

Support:

Remove torrent

and optionally:

Remove torrent only
Remove torrent + downloaded files


Always confirm before deleting downloaded files.

Never silently delete user data.


------------------------------------------
13.9 OPEN DOWNLOAD FOLDER
------------------------------------------

Allow opening the download folder using Windows Explorer.

Do not expose arbitrary shell execution to the frontend.

Use a narrowly scoped Go backend method.


==================================================
14. DOWNLOAD DIRECTORY
==================================================

Provide a configurable download directory.

Suggested default:

User Downloads/Torrents


Do not hardcode:

C:\
D:\
developer paths


Validate:

- directory exists or can be created
- path is writable
- sufficient disk space when practical


Do not require administrator privileges.


==================================================
15. PERSISTENCE
==================================================

Torrent state must survive application restart.

Persist:

- torrent identity
- metadata required for restoration
- download directory
- state
- resume information
- settings


Application restart:

Start
 ↓
Load persisted state
 ↓
Restore torrents
 ↓
Resume incomplete torrents


Use the torrent engine's native resume mechanism where available.

Use SQLite if justified.

Otherwise prefer a simple reliable local persistence mechanism.

Do not over-engineer persistence.


==================================================
16. TORRENT MONITORING
==================================================

Display:

- progress
- download speed
- upload speed
- ETA
- downloaded bytes
- uploaded bytes
- total size
- peers
- seeds
- ratio


Use:

KB/s
MB/s
GB/s


Avoid excessive decimal precision.


==================================================
17. EVENT ARCHITECTURE
==================================================

Use Wails events for backend-to-frontend updates where appropriate.

Potential events:

torrent:progress
torrent:state-changed
torrent:completed
torrent:error
torrent:metadata-ready


IMPORTANT:

Do NOT emit high-frequency torrent engine events directly to the UI.

Aggregate/throttle updates.

Target approximately:

250-1000ms

for UI statistics updates depending on the metric.


The torrent engine can operate at a higher internal frequency.

The frontend does not need every internal event.


==================================================
18. IPC / BRIDGE PERFORMANCE
==================================================

Wails Go↔JavaScript communication is an application boundary.

Do not send:

- raw torrent engine objects
- large binary payloads unnecessarily
- huge arrays repeatedly
- thousands of events per second


Send small DTOs.

Aggregate updates.

Only send information the UI actually needs.


==================================================
19. GLOBAL SPEED LIMIT
==================================================

Implement:

Download limit
Upload limit


Options:

Unlimited
100 KB/s
500 KB/s
1 MB/s
5 MB/s
10 MB/s
Custom


Prefer native torrent engine rate limiting.

Do not create custom inefficient throttling if the engine already supports it.


==================================================
20. TORRENT DETAILS
==================================================

Provide a detail panel/page.

General:

- Name
- Status
- Progress
- Total size
- Downloaded
- Uploaded
- Ratio
- ETA


Network:

- Download speed
- Upload speed
- Peers
- Seeds
- Connections


Files:

- filename
- size
- progress when available


Selective file downloading is not required for the first MVP unless it is straightforward and reliable.


==================================================
21. UI / UX
==================================================

The application must look like a modern desktop application.

Design goals:

- modern
- clean
- minimal
- intuitive
- easy to navigate
- accessible
- visually consistent
- not cluttered


Use:

React
TypeScript
Tailwind CSS
shadcn/ui where appropriate


Do not make it look like a generic web dashboard.

The UI should feel like a desktop application.


==================================================
22. APPLICATION LAYOUT
==================================================

Suggested navigation:

Home
Downloads
Completed
Settings


Alternative:

Downloads
    All
    Downloading
    Paused
    Completed
    Error


Choose the clearest structure.

Do not create unnecessary navigation.


==================================================
23. MAIN SCREEN
==================================================

Main screen should prioritize torrent information.

Suggested:

Sidebar
    ↓
Main Content
    ↓
Header
    ↓
Add Torrent
    ↓
Torrent List


Each torrent should clearly communicate:

Name
Progress
Status
Speed
ETA
Primary action


Avoid 10+ buttons per torrent.

Use:

- primary action
- overflow menu
- context menu


==================================================
24. ICONS
==================================================

Use a consistent icon library.

Icons for:

- Add
- Download
- Upload
- Pause
- Resume
- Remove
- Folder
- Settings
- Search
- More
- Completed
- Error
- Refresh


Do NOT use emoji as the primary icon system.

Do not mix unrelated icon styles.

Icon-only buttons must have accessible labels/tooltips.


==================================================
25. EMPTY STATE
==================================================

When no torrents exist:

No downloads yet

Add a torrent file or paste a magnet link to get started.

[ + Add Torrent ]


Make the empty state polished.


==================================================
26. LOADING STATE
==================================================

Example:

Getting torrent information...

Please wait.


Do not block the entire UI when one torrent is loading.


==================================================
27. ERROR HANDLING
==================================================

Never expose raw Go panic messages or stack traces to normal users.

Bad:

panic: runtime error...


Good:

Unable to start download

The torrent could not be started.
Please check the download location and try again.


Detailed technical errors should:

- be logged
- be preserved for diagnostics
- include useful context


Never silently swallow errors.


==================================================
28. GO ERROR HANDLING
==================================================

Expected runtime errors must not cause panics.

Avoid:

panic()
log.Fatal()
os.Exit()


for normal application failures.


Prefer:

error
fmt.Errorf
errors.Is
errors.As
typed errors where useful


Return errors through Wails service methods appropriately.

Do not expose internal stack traces directly to users.


==================================================
29. GO MEMORY MANAGEMENT
==================================================

Memory management is a FIRST-CLASS REQUIREMENT.

Go has garbage collection, but the application must still avoid uncontrolled memory retention and resource leaks.

Pay special attention to:

- goroutines
- channels
- timers
- tickers
- contexts
- HTTP clients
- TCP connections
- file handles
- torrent objects
- caches
- event subscriptions
- callbacks
- slices
- maps
- closures


Avoid:

- goroutine leaks
- unbounded channels
- unbounded slices
- unbounded maps
- unbounded caches
- global mutable state
- retaining completed torrents forever without reason
- retaining removed torrent objects
- goroutines without cancellation
- timers/tickers without Stop()
- HTTP response bodies without Close()
- files without Close()
- network connections without lifecycle management
- closures unnecessarily capturing large objects


Prefer:

- context.Context
- cancellation
- bounded channels
- bounded caches
- clear ownership
- explicit cleanup
- streaming
- incremental processing


==================================================
30. GOROUTINE LIFECYCLE
==================================================

Every long-running goroutine must have a defined lifecycle.

Avoid:

go func() {
    for {
        ...
    }
}()


without cancellation and shutdown behavior.


Every long-running goroutine should have:

- context cancellation
- shutdown signal
- error handling
- owner
- lifecycle


Application shutdown should:

1. stop accepting new work
2. cancel root context
3. stop torrent operations
4. persist state
5. stop background workers
6. stop tickers
7. close resources
8. wait for important goroutines
9. exit cleanly


Use sync.WaitGroup or errgroup where appropriate.


==================================================
31. CONTEXT MANAGEMENT
==================================================

Use context.Context for long-running operations.

Do not create:

context.Background()

deep inside business logic when the operation should inherit application cancellation.

Pass context from the owning service.

Avoid contexts that live forever.


==================================================
32. FILE I/O
==================================================

Never load huge torrent payloads completely into memory.

Use streaming and buffered I/O.

Prefer:

- io.Reader
- io.Writer
- io.Copy
- buffered I/O
- random access where appropriate


A 10 GB torrent must NOT require multiple GB of RAM.


==================================================
33. NETWORKING
==================================================

Avoid creating unnecessary network clients repeatedly.

Reuse clients when appropriate.

Respect the torrent engine's networking implementation.

Do not implement custom torrent networking if the selected library already provides it.


==================================================
34. UI PERFORMANCE
==================================================

The React frontend must remain responsive.

Avoid:

- rerendering the entire torrent list for every update
- recreating large arrays unnecessarily
- unnecessary state duplication
- excessive React effects
- excessive context providers
- unnecessary object allocation
- large component trees
- excessive animation


Use:

- stable keys
- memoization where justified
- selector-based state
- incremental updates
- throttled statistics
- virtualization for large lists where necessary


If torrent #43 changes:

Update torrent #43.

Do NOT recreate the entire torrent list.


==================================================
35. FRONTEND STATE MANAGEMENT
==================================================

Use a lightweight state management solution.

Do not introduce a large framework unnecessarily.

Possible:

Zustand

or React state where sufficient.


Keep torrent state normalized where practical.

Do not duplicate the same torrent state across multiple stores unnecessarily.


==================================================
36. TYPESCRIPT STRICTNESS
==================================================

TypeScript strict mode is mandatory.

Use:

strict: true


Do not use:

any

unless absolutely unavoidable and documented.


Avoid:

as any
@ts-ignore
@ts-expect-error


unless there is a narrow documented reason.

Prefer explicit types.


==================================================
37. WAILS BINDING TYPE SAFETY
==================================================

Use generated Wails TypeScript bindings.

Do not manually duplicate Go API definitions.

Ensure:

Go DTO
    ↕
Wails binding
    ↕
TypeScript type


remains consistent.


Do not expose internal implementation types unnecessarily.


==================================================
38. FRONTEND QUALITY GATE
==================================================

Use Biome.

Run:

bunx biome check .


Type check:

bunx tsc --noEmit


If package scripts exist, prefer:

bun run lint
bun run typecheck
bun run format:check


Do not silence errors.

Fix root causes.


==================================================
39. GO QUALITY GATE
==================================================

Use:

gofmt

go vet ./...

go test ./...

Run:

gofmt -w .

or the project's formatting task where appropriate.

Do not ignore vet warnings.

Do not globally suppress static analysis.


If golangci-lint is introduced, use it only if justified and configure it pragmatically.


==================================================
40. TESTING
==================================================

Create tests for important business logic.

Prioritize:

- torrent state transitions
- magnet validation
- path validation
- speed formatting
- ETA calculation
- persistence
- settings
- service behavior
- error handling
- lifecycle management


Go tests should be deterministic.

Do not depend on random public torrent peers for unit tests.


==================================================
41. INTEGRATION TESTING
==================================================

Prefer:

- local fixtures
- local test data
- deterministic mocks
- controlled test servers


Do not make every test depend on the public internet.


Real torrent network testing may be separate smoke/integration testing.


==================================================
42. REQUIRED VALIDATION LOOP
==================================================

After every meaningful milestone:

bun install

bunx biome check .

bunx tsc --noEmit

go test ./...

go vet ./...

gofmt -w .


Then:

wails3 dev


For release:

wails3 build


If any command fails:

1. Read the actual error.
2. Find the root cause.
3. Fix it.
4. Re-run the failed command.
5. Re-run the complete relevant validation.


Do not declare completion while known errors remain.


==================================================
43. RUNTIME SMOKE TEST
==================================================

After successful compilation, actually run the application.

Verify:

- application launches
- navigation works
- Add Torrent works
- file picker works
- magnet input works
- metadata loading works
- torrent starts
- torrent pauses
- torrent resumes
- progress updates
- download speed updates
- upload speed updates
- ETA updates
- completion is detected
- remove confirmation works
- folder opening works
- settings work
- theme works
- application closes cleanly
- application restarts correctly


Do not claim something was tested if it was not actually tested.


==================================================
44. LOGGING
==================================================

Implement structured logging.

Log:

- startup
- torrent added
- torrent started
- torrent paused
- torrent resumed
- torrent completed
- torrent removed
- torrent error
- metadata error
- filesystem error
- network error
- persistence error
- shutdown


Do not log sensitive data unnecessarily.

Do not spam logs at extremely high frequency.


==================================================
45. SETTINGS
==================================================

Settings page must include:

Download directory
Download speed limit
Upload speed limit
Theme


Theme:

System
Light
Dark


Persist settings locally.


==================================================
46. THEME
==================================================

Support:

System
Light
Dark


Default:

System


Use centralized design tokens for:

- colors
- typography
- spacing
- border radius
- shadows
- buttons
- cards
- inputs
- dialogs
- navigation
- progress


Avoid random styling values everywhere.


==================================================
47. ACCESSIBILITY
==================================================

Ensure:

- buttons have accessible names
- icon-only buttons have labels/tooltips
- keyboard navigation works
- focus states are visible
- sufficient text contrast
- dialogs support keyboard interaction
- important actions are not communicated only through color


==================================================
48. SECURITY
==================================================

Use Wails capabilities and application boundaries carefully.

Do not expose arbitrary:

- filesystem access
- shell execution
- command execution
- process execution


The frontend should only access backend functionality through explicit Wails services.

Validate important inputs in Go.

The Go backend is the security boundary.


==================================================
49. FILESYSTEM SECURITY
==================================================

Do not allow the frontend to directly manipulate arbitrary filesystem paths without validation.

For download paths:

Validate in Go.

For file selection:

Use controlled file picker APIs.

For opening folders:

Expose one narrowly scoped Go method.

Do not expose generic:

RunCommand(path)
ReadAnyFile(path)
WriteAnyFile(path)


==================================================
50. CONTENT SECURITY
==================================================

Configure a reasonable frontend security policy.

Avoid unsafe inline scripts where possible.

Do not disable security mechanisms merely to simplify development.


==================================================
51. DEPENDENCY MANAGEMENT
==================================================

Frontend:

Bun


Backend:

Go modules


Every dependency must have a reason.

Before adding:

- evaluate maintenance
- license
- security
- bundle impact
- memory impact
- performance
- necessity


Keep dependency count reasonable.


==================================================
52. WINDOWS PLATFORM
==================================================

Primary target:

Windows 10/11 x64


Use Windows WebView2 through Wails.

Do not depend on Chrome installation.

Do not require .NET runtime.

Do not require Node.js at runtime.

Do not require administrator privileges.


==================================================
53. MICROSOFT STORE READINESS
==================================================

The application will eventually target Microsoft Store.

Keep architecture compatible with Windows packaging.

Do not hardcode development paths.

Avoid unnecessary permissions.

Use user-level operation.

Keep dependencies minimal.

Ensure the application can be packaged appropriately for Windows distribution.


Do not submit to the Microsoft Store during the initial MVP unless explicitly requested.


==================================================
54. WAILS BUILD / PACKAGING
==================================================

Use Wails v3 tooling.

Development:

wails3 dev


Build:

wails3 build


Package:

wails3 package


Do not invent custom Wails commands.

Check:

wails3 --help

when uncertain.

The Wails build output should be inspected after each release build.


==================================================
55. PERFORMANCE PHILOSOPHY
==================================================

Do not prematurely optimize everything.

But avoid obviously inefficient code.

Use:

Measure
 ↓
Identify bottleneck
 ↓
Optimize
 ↓
Measure again


Pay attention to:

- RAM
- CPU
- allocations
- goroutine count
- disk I/O
- network I/O
- IPC traffic
- React rerenders
- event frequency
- torrent count


Do not claim performance improvements without evidence.


==================================================
56. MEMORY LEAK REVIEW
==================================================

Before declaring completion, explicitly review:

GO:

- goroutine leaks
- channel lifecycle
- ticker lifecycle
- timer lifecycle
- context cancellation
- HTTP response bodies
- file handles
- sockets
- torrent handles
- caches
- maps
- slices
- callbacks
- event subscriptions


REACT:

- event subscriptions
- useEffect cleanup
- timers
- intervals
- Wails event listeners
- stale closures
- large retained state
- unnecessary references


Every subscription must have a cleanup strategy.

Every ticker/timer must be stopped.

Every long-running goroutine must have a shutdown path.


==================================================
57. LARGE TORRENT LIST
==================================================

The application should remain responsive with many torrents.

Use virtualization if necessary.

Do not render thousands of complex DOM nodes unnecessarily.

Do not update every torrent component when only one torrent changes.


==================================================
58. AVOID OVER-ENGINEERING
==================================================

This is an MVP.

Do NOT implement:

- microservices
- cloud synchronization
- user accounts
- remote control server
- plugin architecture
- analytics backend
- telemetry infrastructure
- torrent search engine
- CQRS without need
- event sourcing
- complicated repository layers
- custom BitTorrent protocol
- unnecessary abstractions


Keep the architecture clean and pragmatic.


==================================================
59. PROJECT STRUCTURE
==================================================

Recommended frontend:

frontend/
    src/
        components/
        pages/
        layouts/
        stores/
        services/
        hooks/
        types/
        lib/
        styles/
        assets/


Recommended Go:

backend/
    services/
    torrent/
    models/
    storage/
    events/
    errors/
    utils/


Follow the actual Wails v3 project conventions.

Do not force this exact structure if the Wails v3 template provides a better idiomatic structure.

Keep responsibilities clear.


==================================================
60. IMPLEMENTATION ORDER
==================================================

PHASE 1 — FOUNDATION

- inspect environment
- verify Wails v3
- run wails3 doctor
- verify Go
- verify Bun
- inspect project
- establish baseline
- configure React
- configure TypeScript strict
- configure Biome
- configure Tailwind
- configure Wails
- configure Go modules


PHASE 2 — QUALITY GATES

Ensure:

bunx biome check .
bunx tsc --noEmit
go test ./...
go vet ./...
gofmt


works before complex functionality.


PHASE 3 — UI SHELL

Implement:

- main window
- sidebar
- navigation
- Downloads
- Completed
- Settings
- empty state
- loading state
- error state
- theme


PHASE 4 — GO SERVICES

Implement:

- TorrentService
- SettingsService
- PersistenceService
- FileService
- application lifecycle


PHASE 5 — TORRENT ENGINE

Implement:

- torrent library integration
- .torrent
- magnet
- metadata
- add
- start
- pause
- resume
- remove


PHASE 6 — MONITORING

Implement:

- progress
- speed
- ETA
- peers
- seeds
- status
- Wails events
- throttling


PHASE 7 — PERSISTENCE

Implement:

- torrent state
- resume data
- settings
- download location
- restart recovery


PHASE 8 — POLISH

Implement:

- error handling
- tooltips
- context menus
- accessibility
- keyboard navigation
- animations
- performance
- memory review


PHASE 9 — RELEASE

Run:

bunx biome check .
bunx tsc --noEmit

gofmt

go vet ./...
go test ./...

wails3 build

Inspect the resulting Windows artifact.


==================================================
61. DEVELOPMENT RULE
==================================================

Do not make hundreds of unrelated changes in one step.

Work incrementally.

For every feature:

1. Inspect.
2. Plan.
3. Implement.
4. Format.
5. Type-check.
6. Lint.
7. Test.
8. Build/check.
9. Run application.
10. Fix errors.
11. Review memory.
12. Review performance.
13. Continue.


If a feature becomes too large, split it into smaller milestones.


==================================================
62. DO NOT HIDE ERRORS
==================================================

Never solve problems by:

- disabling TypeScript strict mode
- adding any everywhere
- using @ts-ignore
- disabling Biome
- disabling go vet
- ignoring test failures
- swallowing errors
- using panic for expected failures
- creating uncontrolled goroutines
- disabling security boundaries
- exposing arbitrary filesystem access
- exposing shell execution
- deleting failing functionality just to make the build green


Fix the underlying issue.


==================================================
63. FINAL SELF REVIEW
==================================================

Before declaring completion:

CORRECTNESS

- Does the feature actually work?
- Are edge cases handled?
- Are errors handled?
- Are cancellation paths handled?
- Are restart scenarios handled?


MEMORY

- Are goroutines bounded?
- Are channels bounded?
- Are timers stopped?
- Are tickers stopped?
- Are contexts cancelled?
- Are resources closed?
- Are caches bounded?
- Are removed torrents released?
- Are Wails event subscriptions cleaned up?
- Are React effects cleaned up?


PERFORMANCE

- Are unnecessary allocations avoided?
- Is IPC/event traffic throttled?
- Are React rerenders controlled?
- Is torrent list rendering efficient?
- Is disk I/O streamed?
- Is UI responsive?


SECURITY

- Are backend methods explicit?
- Are filesystem operations validated?
- Is arbitrary command execution unavailable?
- Are unnecessary capabilities avoided?


ARCHITECTURE

- Is React independent from torrent engine internals?
- Are Wails bindings typed?
- Are Go services focused?
- Are Wails methods thin where appropriate?
- Are DTOs explicit?
- Are abstractions justified?


MAINTAINABILITY

- Are names clear?
- Are functions reasonably small?
- Are components focused?
- Is there unnecessary complexity?
- Are comments useful?


==================================================
64. REQUIRED FINAL VALIDATION
==================================================

Run:

bun install

bunx biome check .

bunx tsc --noEmit

gofmt

go vet ./...

go test ./...

wails3 dev

Then:

wails3 build


Fix all relevant failures.

Do not declare success without actual validation.


==================================================
65. DEFINITION OF DONE
==================================================

The MVP is complete only when:

[ ] Wails v3 application launches
[ ] React UI works
[ ] Bun is used for frontend tooling
[ ] TypeScript strict mode is enabled
[ ] Biome passes
[ ] TypeScript type-check passes
[ ] Go formatting passes
[ ] go vet passes
[ ] Go tests pass
[ ] Modern UI exists
[ ] Navigation works
[ ] Icons are clear and consistent
[ ] Empty state exists
[ ] Loading state exists
[ ] Error state exists
[ ] .torrent files can be added
[ ] Magnet links can be added
[ ] Torrent metadata can be retrieved
[ ] Download directory can be selected
[ ] Torrent can start
[ ] Torrent can pause
[ ] Torrent can resume
[ ] Torrent can be removed
[ ] Download actually works
[ ] Progress updates
[ ] Download speed updates
[ ] Upload speed updates
[ ] ETA updates
[ ] Peer/seed information works when available
[ ] Completion is detected
[ ] Torrent state persists
[ ] Restart recovery works
[ ] Settings persist
[ ] Theme switching works
[ ] UI remains responsive
[ ] IPC/event updates are throttled
[ ] Large files do not cause excessive RAM usage
[ ] No obvious memory leaks are introduced
[ ] Goroutines have clear lifetimes
[ ] Files/network resources are closed correctly
[ ] Wails event subscriptions are cleaned up
[ ] React subscriptions are cleaned up
[ ] User-facing errors are friendly
[ ] Technical errors are logged
[ ] Wails production build succeeds
[ ] No known critical runtime issue remains


==================================================
66. FINAL REPORT
==================================================

When finished, provide:

1. Features implemented
2. Wails version
3. Go version
4. BitTorrent library selected
5. Why it was selected
6. Bun packages added
7. Go modules added
8. Project structure
9. Wails services created
10. Wails bindings created
11. Wails events created
12. Important architecture decisions
13. Memory/performance considerations
14. Security considerations
15. Tests performed
16. Validation commands executed
17. Runtime tests performed
18. Build result
19. Known limitations
20. Remaining production work
21. Microsoft Store readiness status


Do not claim something was tested if it was not actually tested.

Do not hide unresolved errors.

Do not simply say "Done".

The goal is not merely to generate code.

The goal is to produce a stable, maintainable, efficient, memory-conscious, modern Windows BitTorrent downloader using:

Wails v3
Go
React
TypeScript
Bun

that can evolve into a production-quality Microsoft Store application.