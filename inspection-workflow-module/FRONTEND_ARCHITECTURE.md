# Enterprise React Frontend Architecture
## Inspection Workflow & Data Collection Module

---

## Overview

 this document describes the enterprise-grade frontend architecture for the Inspection Workflow & Data Collection Module using React. The architecture follows modern React best practices, component-driven development, and enterprise software engineering principles suitable for government-scale deployments.

---

## Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand (global) + React Query (server state)
- **Routing:** React Router v6
- **UI Library:** TailwindCSS + shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios with interceptors
- **Icons:** Lucide React
- **Maps:** Leaflet + React Leaflet
- **Date Handling:** date-fns
- **Offline Storage:** IndexedDB via Dexie.js
- **Testing:** Vitest + React Testing Library + Playwright
- **Linting:** ESLint + Prettier

---

## Folder Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── main.tsx                          # Application entry point
│   ├── App.tsx                           # Root component with providers
│   ├── vite-env.d.ts
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── pages/
│   │   ├── __init__.ts
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── assignments/
│   │   │   ├── AssignmentListPage.tsx
│   │   │   └── AssignmentDetailPage.tsx
│   │   ├── inspections/
│   │   │   ├── InspectionWorkflowPage.tsx
│   │   │   ├── ChecklistPage.tsx
│   │   │   ├── EvidencePage.tsx
│   │   │   ├── NotesPage.tsx
│   │   │   └── StatusPage.tsx
│   │   ├── evidence/
│   │   │   ├── PhotoCapturePage.tsx
│   │   │   ├── DocumentUploadPage.tsx
│   │   │   └── EvidenceGalleryPage.tsx
│   │   ├── sync/
│   │   │   └── SyncPage.tsx
│   │   ├── location/
│   │   │   └── CheckInPage.tsx
│   │   ├── reports/
│   │   │   ├── ReportPreviewPage.tsx
│   │   │   └── ReportGenerationPage.tsx
│   │   ├── submissions/
│   │   │   ├── SubmissionPage.tsx
│   │   │   └── SubmissionStatusPage.tsx
│   │   ├── history/
│   │   │   └── InspectionHistoryPage.tsx
│   │   ├── routes/
│   │   │   └── RoutePlanningPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── error/
│   │       ├── NotFoundPage.tsx
│   │       ├── ErrorPage.tsx
│   │       └── NetworkErrorPage.tsx
│   ├── components/
│   │   ├── __init__.ts
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Input.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Card.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Modal.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Badge.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Avatar/
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Avatar.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Spinner/
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Alert/
│   │   │   │   ├── Alert.tsx
│   │   │   │   ├── Alert.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Tabs/
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Tab.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Dropdown/
│   │   │   │   ├── Dropdown.tsx
│   │   │   │   ├── Dropdown.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Chip/
│   │   │   │   ├── Chip.tsx
│   │   │   │   ├── Chip.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── ProgressBar/
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── index.ts
│   │   │   └── EmptyState/
│   │   │       ├── EmptyState.tsx
│   │   │       └── index.ts
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Header.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Sidebar.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── Footer/
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── index.ts
│   │   │   └── Layout/
│   │   │       ├── Layout.tsx
│   │   │       └── index.ts
│   │   ├── inspection/
│   │   │   ├── InspectionCard/
│   │   │   │   ├── InspectionCard.tsx
│   │   │   │   ├── InspectionCard.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── AssignmentCard/
│   │   │   │   ├── AssignmentCard.tsx
│   │   │   │   ├── AssignmentCard.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── ChecklistItem/
│   │   │   │   ├── ChecklistItem.tsx
│   │   │   │   ├── ChecklistItem.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── ChecklistSection/
│   │   │   │   ├── ChecklistSection.tsx
│   │   │   │   └── index.ts
│   │   │   ├── EvidenceCard/
│   │   │   │   ├── EvidenceCard.tsx
│   │   │   │   ├── EvidenceCard.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── NoteCard/
│   │   │   │   ├── NoteCard.tsx
│   │   │   │   ├── NoteCard.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── StatusTimeline/
│   │   │   │   ├── StatusTimeline.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ProgressBar/
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── index.ts
│   │   │   └── VerificationBadge/
│   │   │       ├── VerificationBadge.tsx
│   │   │       └── index.ts
│   │   ├── evidence/
│   │   │   ├── PhotoCapture/
│   │   │   │   ├── PhotoCapture.tsx
│   │   │   │   ├── PhotoCapture.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── PhotoPreview/
│   │   │   │   ├── PhotoPreview.tsx
│   │   │   │   └── index.ts
│   │   │   ├── PhotoGallery/
│   │   │   │   ├── PhotoGallery.tsx
│   │   │   │   └── index.ts
│   │   │   ├── DocumentUpload/
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentUpload.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── DocumentViewer/
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   └── index.ts
│   │   │   └── EvidenceUploadZone/
│   │   │       ├── EvidenceUploadZone.tsx
│   │   │       └── index.ts
│   │   ├── notes/
│   │   │   ├── NoteEditor/
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── NoteEditor.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── NoteList/
│   │   │   │   ├── NoteList.tsx
│   │   │   │   └── index.ts
│   │   │   ├── VoiceRecorder/
│   │   │   │   ├── VoiceRecorder.tsx
│   │   │   │   └── index.ts
│   │   │   └── NoteTypeChips/
│   │   │       ├── NoteTypeChips.tsx
│   │   │       └── index.ts
│   │   ├── sync/
│   │   │   ├── SyncIndicator/
│   │   │   │   ├── SyncIndicator.tsx
│   │   │   │   └── index.ts
│   │   │   ├── SyncQueue/
│   │   │   │   ├── SyncQueue.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ConflictResolver/
│   │   │   │   ├── ConflictResolver.tsx
│   │   │   │   └── index.ts
│   │   │   └── OfflineBanner/
│   │   │       ├── OfflineBanner.tsx
│   │   │       └── index.ts
│   │   ├── location/
│   │   │   ├── LocationTracker/
│   │   │   │   ├── LocationTracker.tsx
│   │   │   │   └── index.ts
│   │   │   ├── GeofenceMonitor/
│   │   │   │   ├── GeofenceMonitor.tsx
│   │   │   │   └── index.ts
│   │   │   ├── MapView/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── MapView.types.ts
│   │   │   │   └── index.ts
│   │   │   └── CheckInButton/
│   │   │       ├── CheckInButton.tsx
│   │   │       └── index.ts
│   │   ├── ai/
│   │   │   ├── VerificationStatus/
│   │   │   │   ├── VerificationStatus.tsx
│   │   │   │   └── index.ts
│   │   │   ├── VerificationAlert/
│   │   │   │   ├── VerificationAlert.tsx
│   │   │   │   └── index.ts
│   │   │   ├── RecommendationPanel/
│   │   │   │   ├── RecommendationPanel.tsx
│   │   │   │   └── index.ts
│   │   │   ├── RecommendationCard/
│   │   │   │   ├── RecommendationCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── ConfidenceMeter/
│   │   │       ├── ConfidenceMeter.tsx
│   │   │       └── index.ts
│   │   ├── reports/
│   │   │   ├── ReportViewer/
│   │   │   │   ├── ReportViewer.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ReportSummary/
│   │   │   │   ├── ReportSummary.tsx
│   │   │   │   └── index.ts
│   │   │   └── TableOfContents/
│   │   │       ├── TableOfContents.tsx
│   │   │       └── index.ts
│   │   ├── routes/
│   │   │   ├── RouteMap/
│   │   │   │   ├── RouteMap.tsx
│   │   │   │   └── index.ts
│   │   │   ├── RouteList/
│   │   │   │   ├── RouteList.tsx
│   │   │   │   └── index.ts
│   │   │   ├── StopCard/
│   │   │   │   ├── StopCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── RouteSummary/
│   │   │       ├── RouteSummary.tsx
│   │   │       └── index.ts
│   │   └── forms/
│   │       ├── LoginForm/
│   │       │   ├── LoginForm.tsx
│   │       │   └── index.ts
│   │       ├── SubmissionForm/
│   │       │   ├── SubmissionForm.tsx
│   │       │   └── index.ts
│   │       └── FilterForm/
│   │           ├── FilterForm.tsx
│   │           └── index.ts
│   ├── hooks/
│   │   ├── __init__.ts
│   │   ├── useAuth.ts
│   │   ├── useInspection.ts
│   │   ├── useAssignment.ts
│   │   ├── useChecklist.ts
│   │   ├── useEvidence.ts
│   │   ├── useNotes.ts
│   │   ├── useSync.ts
│   │   ├── useLocation.ts
│   │   ├── useAI.ts
│   │   ├── useReport.ts
│   │   ├── useSubmission.ts
│   │   ├── useRoute.ts
│   │   ├── useOffline.ts
│   │   ├── useCamera.ts
│   │   ├── useGeolocation.ts
│   │   ├── useNetworkStatus.ts
│   │   ├── useDebounce.ts
│   │   ├── useThrottle.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePrevious.ts
│   │   └── useWindowSize.ts
│   ├── contexts/
│   │   ├── __init__.ts
│   │   ├── AuthContext.tsx
│   │   ├── InspectionContext.tsx
│   │   ├── OfflineContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── NotificationContext.tsx
│   ├── services/
│   │   ├── __init__.ts
│   │   ├── api/
│   │   │   ├── __init__.ts
│   │   │   ├── client.ts                    # Axios instance with interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── inspection.service.ts
│   │   │   ├── assignment.service.ts
│   │   │   ├── checklist.service.ts
│   │   │   ├── evidence.service.ts
│   │   │   ├── notes.service.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── location.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── submission.service.ts
│   │   │   ├── route.service.ts
│   │   │   ├── i18n.service.ts
│   │   │   └── audit.service.ts
│   │   ├── storage/
│   │   │   ├── __init__.ts
│   │   │   ├── indexedDB.ts                 # Dexie.js database setup
│   │   │   ├── offlineStorage.ts
│   │   │   └── cacheStorage.ts
│   │   └── upload/
│   │       ├── __init__.ts
│   │       ├── uploadManager.ts
│   │       └── multipartUploader.ts
│   ├── stores/
│   │   ├── __init__.ts
│   │   ├── authStore.ts
│   │   ├── inspectionStore.ts
│   │   ├── offlineStore.ts
│   │   ├── uiStore.ts
│   │   └── syncStore.ts
│   ├── types/
│   │   ├── __init__.ts
│   │   ├── auth.types.ts
│   │   ├── inspection.types.ts
│   │   ├── assignment.types.ts
│   │   ├── checklist.types.ts
│   │   ├── evidence.types.ts
│   │   ├── notes.types.ts
│   │   ├── sync.types.ts
│   │   ├── location.types.ts
│   │   ├── report.types.ts
│   │   ├── submission.types.ts
│   │   ├── route.types.ts
│   │   ├── ai.types.ts
│   │   └── common.types.ts
│   ├── utils/
│   │   ├── __init__.ts
│   │   ├── date.utils.ts
│   │   ├── file.utils.ts
│   │   ├── validation.utils.ts
│   │   ├── format.utils.ts
│   │   ├── geo.utils.ts
│   │   ├── image.utils.ts
│   │   ├── string.utils.ts
│   │   └── constants.ts
│   ├── config/
│   │   ├── __init__.ts
│   │   ├── api.config.ts
│   │   ├── app.config.ts
│   │   └── storage.config.ts
│   ├── lib/
│   │   ├── __init__.ts
│   │   ├── react-query/
│   │   │   ├── __init__.ts
│   │   │   ├── queryClient.ts
│   │   │   └── queryKeys.ts
│   │   └── react-router/
│   │       ├── __init__.ts
│   │       ├── routes.tsx
│   │       └── routeGuards.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes.css
│   └── providers/
│       ├── __init__.ts
│       ├── QueryProvider.tsx
│       ├── RouterProvider.tsx
│       ├── ThemeProvider.tsx
│       ├── AuthProvider.tsx
│       ├── OfflineProvider.tsx
│       └── LanguageProvider.tsx
├── tests/
│   ├── __init__.ts
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── services/
│   ├── integration/
│   │   └── pages/
│   └── e2e/
│       └── scenarios/
├── .env.example
├── .env.local
├── .eslintrc.cjs
├── .prettierrc.json
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── Dockerfile
```

---

## Pages

### Authentication Pages

#### LoginPage
- **Purpose:** User authentication interface
- **Components:** LoginForm, OfflineIndicator, LanguageSelector
- **Hooks:** useAuth, useNetworkStatus
- **Route:** `/login`
- **Auth:** Public

#### ForgotPasswordPage
- **Purpose:** Password recovery interface
- **Components:** ForgotPasswordForm
- **Hooks:** useAuth
- **Route:** `/forgot-password`
- **Auth:** Public

---

### Dashboard Pages

#### DashboardPage
- **Purpose:** Main dashboard with overview and quick actions
- **Components:** Header, SummaryCards, Timeline, QuickActions, RecentActivity
- **Hooks:** useInspection, useAssignment, useAuth
- **Route:** `/dashboard`
- **Auth:** Required

---

### Assignment Pages

#### AssignmentListPage
- **Purpose:** List of assigned inspections with filters
- **Components:** SearchBar, FilterChips, AssignmentCard, SortDropdown, Pagination
- **Hooks:** useAssignment, useDebounce
- **Route:** `/assignments`
- **Auth:** Required

#### AssignmentDetailPage
- **Purpose:** Detailed view of a single assignment
- **Components:** SiteInfoCard, InspectionDetails, PreviousInspection, ChecklistPreview, Map, ActionButtons
- **Hooks:** useAssignment, useLocation
- **Route:** `/assignments/:id`
- **Auth:** Required

---

### Inspection Workflow Pages

#### InspectionWorkflowPage
- **Purpose:** Main inspection workflow container
- **Components:** InspectionHeader, InspectionNavigation, WorkflowProgress
- **Hooks:** useInspection, useAuth
- **Route:** `/inspections/:id/workflow`
- **Auth:** Required

#### ChecklistPage
- **Purpose:** Checklist completion interface
- **Components:** ProgressBar, SectionNavigation, ChecklistItem, AIRecommendationPanel, StickyActions
- **Hooks:** useChecklist, useAI, useOffline
- **Route:** `/inspections/:id/checklist`
- **Auth:** Required

#### EvidencePage
- **Purpose:** Evidence collection interface
- **Components:** PhotoCapture, DocumentUpload, EvidenceGallery, VerificationStatus
- **Hooks:** useEvidence, useCamera, useAI
- **Route:** `/inspections/:id/evidence`
- **Auth:** Required

#### NotesPage
- **Purpose:** Notes and observations interface
- **Components:** NoteEditor, NoteList, VoiceRecorder, NoteTypeChips
- **Hooks:** useNotes, useOffline
- **Route:** `/inspections/:id/notes`
- **Auth:** Required

#### StatusPage
- **Purpose:** Inspection status and timeline view
- **Components:** StatusTimeline, ProgressBar, CurrentStateCard, Actions, SyncStatus
- **Hooks:** useInspection, useSync
- **Route:** `/inspections/:id/status`
- **Auth:** Required

---

### Evidence Pages

#### PhotoCapturePage
- **Purpose:** Dedicated photo capture interface
- **Components:** CameraViewfinder, CaptureControls, PhotoPreview, MetadataForm, AIVerificationBadge
- **Hooks:** useCamera, useLocation, useAI
- **Route:** `/evidence/photo/:inspectionId`
- **Auth:** Required

#### DocumentUploadPage
- **Purpose:** Document upload interface
- **Components:** DocumentUploadZone, DocumentList, PreviewModal, MetadataForm
- **Hooks:** useEvidence
- **Route:** `/evidence/document/:inspectionId`
- **Auth:** Required

#### EvidenceGalleryPage
- **Purpose:** Gallery view of all evidence
- **Components:** EvidenceGrid, FilterBar, EvidenceCard, BulkActions
- **Hooks:** useEvidence
- **Route:** `/evidence/gallery/:inspectionId`
- **Auth:** Required

---

### Sync Pages

#### SyncPage
- **Purpose:** Offline sync management interface
- **Components:** ConnectionStatus, SyncQueue, ConflictResolver, StorageUsage, ManualSyncButton
- **Hooks:** useSync, useOffline, useNetworkStatus
- **Route:** `/sync`
- **Auth:** Required

---

### Location Pages

#### CheckInPage
- **Purpose:** Location check-in interface
- **Components:** MapView, LocationInfo, CheckInButton, GPSAccuracyBadge, ManualOverride
- **Hooks:** useLocation, useGeolocation
- **Route:** `/location/checkin/:inspectionId`
- **Auth:** Required

---

### Report Pages

#### ReportPreviewPage
- **Purpose:** Report preview and review interface
- **Components:** ReportViewer, TableOfContents, SummaryCard, ZoomControls, EditButton
- **Hooks:** useReport
- **Route:** `/reports/preview/:inspectionId`
- **Auth:** Required

#### ReportGenerationPage
- **Purpose:** Report generation status interface
- **Components:** GenerationProgress, TemplateSelector, FormatSelector, DownloadButton
- **Hooks:** useReport
- **Route:** `/reports/generate/:inspectionId`
- **Auth:** Required

---

### Submission Pages

#### SubmissionPage
- **Purpose:** Inspection submission interface
- **Components:** SubmissionChecklist, ReportSummary, AttachmentList, CommentsField, RecipientSelector, PrioritySelector
- **Hooks:** useSubmission, useReport
- **Route:** `/submissions/:inspectionId`
- **Auth:** Required

#### SubmissionStatusPage
- **Purpose:** Submission status tracking interface
- **Components:** StatusTimeline, ReviewerInfo, Comments, Actions
- **Hooks:** useSubmission
- **Route:** `/submissions/status/:inspectionId`
- **Auth:** Required

---

### History Pages

#### InspectionHistoryPage
- **Purpose:** Historical inspections view
- **Components:** SearchBar, FilterChips, InspectionCard, SummaryStats, ExportButton
- **Hooks:** useInspection
- **Route:** `/history`
- **Auth:** Required

---

### Route Pages

#### RoutePlanningPage
- **Purpose:** Route planning and optimization interface
- **Components:** RouteMap, RouteList, StopCard, RouteSummary, OptimizeButton
- **Hooks:** useRoute, useLocation
- **Route:** `/routes`
- **Auth:** Required

---

### Settings Pages

#### SettingsPage
- **Purpose:** Application settings interface
- **Components:** LanguageSelector, ThemeToggle, NotificationSettings, OfflineSettings, AccountInfo, LogoutButton
- **Hooks:** useAuth, useOffline
- **Route:** `/settings`
- **Auth:** Required

---

### Error Pages

#### NotFoundPage
- **Purpose:** 404 error page
- **Components:** ErrorIllustration, Message, BackButton
- **Route:** `/404`
- **Auth:** Public

#### ErrorPage
- **Purpose:** Generic error page
- **Components:** ErrorIllustration, ErrorMessage, RetryButton, SupportContact
- **Route:** `/error`
- **Auth:** Public

#### NetworkErrorPage
- **Purpose:** Network connectivity error page
- **Components:** ErrorIllustration, ConnectionStatus, RetryButton, ContinueOfflineButton
- **Route:** `/network-error`
- **Auth:** Public

---

## Components

### Common Components

#### Button
- **Purpose:** Reusable button component with variants
- **Variants:** primary, secondary, tertiary, ghost, danger
- **Sizes:** sm, md, lg
- **States:** default, loading, disabled
- **Features:** Icon support, full width option

#### Input
- **Purpose:** Reusable input component
- **Types:** text, email, password, number, tel
- **Features:** Floating label, error state, helper text, icon support
- **Validation:** Integration with React Hook Form

#### Card
- **Purpose:** Reusable card container
- **Variants:** default, elevated, outlined
- **Features:** Header, body, footer slots, hover effect

#### Modal
- **Purpose:** Reusable modal/dialog component
- **Features:** Backdrop, close on escape, close on backdrop click, animation
- **Sizes:** sm, md, lg, xl, full

#### Badge
- **Purpose:** Status and category badges
- **Variants:** success, warning, error, info, neutral
- **Shapes:** pill, rounded, square

#### Avatar
- **Purpose:** User avatar component
- **Features:** Image fallback, initials, size variants, online indicator

#### Spinner
- **Purpose:** Loading spinner
- **Variants:** default, dots, bars, pulse
- **Sizes:** sm, md, lg

#### Alert
- **Purpose:** Alert/notification component
- **Variants:** success, warning, error, info
- **Features:** Dismissible, icon support

#### Tabs
- **Purpose:** Tab navigation component
- **Features:** Active state, disabled tabs, icon support, vertical/horizontal

#### Dropdown
- **Purpose:** Dropdown menu component
- **Features:** Trigger, menu items, keyboard navigation, position options

#### Chip
- **Purpose:** Selectable/filter chips
- **Features:** Selected state, removable, icon support

#### ProgressBar
- **Purpose:** Progress indicator
- **Variants:** linear, circular
- **Features:** Percentage, indeterminate, color variants

#### EmptyState
- **Purpose:** Empty state illustration
- **Features:** Icon, title, description, action button

---

### Layout Components

#### Header
- **Purpose:** Application header
- **Components:** Logo, Navigation, UserMenu, Notifications, SyncStatus
- **Features:** Responsive, sticky, offline indicator

#### Sidebar
- **Purpose:** Navigation sidebar
- **Components:** NavigationLinks, CollapseToggle, UserSection
- **Features:** Collapsible, active state, nested items

#### Footer
- **Purpose:** Application footer
- **Components:** Copyright, Links, Version
- **Features:** Responsive, minimal

#### Layout
- **Purpose:** Main layout wrapper
- **Components:** Header, Sidebar, MainContent, Footer
- **Features:** Responsive, mobile drawer, protected routes

---

### Inspection Components

#### InspectionCard
- **Purpose:** Display inspection summary
- **Features:** Status badge, priority, date, location, actions
- **Interactions:** Click to view details, swipe actions

#### AssignmentCard
- **Purpose:** Display assignment summary
- **Features:** Site info, schedule, priority, accept/decline actions
- **Interactions:** Accept, decline, view details

#### ChecklistItem
- **Purpose:** Individual checklist item
- **Features:** Question, response options, evidence badge, AI indicator, notes button
- **Interactions:** Response selection, evidence attachment, add note

#### ChecklistSection
- **Purpose:** Checklist section container
- **Features:** Section header, progress indicator, collapsible
- **Interactions:** Expand/collapse, navigate to section

#### EvidenceCard
- **Purpose:** Display evidence item
- **Features:** Thumbnail, metadata, verification status, actions
- **Interactions:** Preview, download, delete, view details

#### NoteCard
- **Purpose:** Display note item
- **Features:** Type badge, content preview, timestamp, actions
- **Interactions:** Edit, delete, view full

#### StatusTimeline
- **Purpose:** Display inspection state history
- **Features:** Timeline view, status icons, timestamps, transition reasons
- **Interactions:** Click for details

#### VerificationBadge
- **Purpose:** Display AI verification status
- **Features:** Status icon, confidence score, color coding
- **Interactions:** Click for details

---

### Evidence Components

#### PhotoCapture
- **Purpose:** Camera capture interface
- **Features:** Viewfinder, grid overlay, flash toggle, camera switch, capture button
- **Interactions:** Capture, retake, preview

#### PhotoPreview
- **Purpose:** Photo preview with metadata
- **Features:** Image display, metadata form, GPS info, AI verification
- **Interactions:** Upload, retake, add description

#### PhotoGallery
- **Purpose:** Photo grid view
- **Features:** Grid layout, filter bar, selection mode, bulk actions
- **Interactions:** Select, delete, view details

#### DocumentUpload
- **Purpose:** Document upload interface
- **Features:** Drag & drop zone, file list, progress indicator, metadata form
- **Interactions:** Upload, remove, add metadata

#### DocumentViewer
- **Purpose:** Document preview
- **Features:** PDF viewer, page navigation, zoom controls
- **Interactions:** Navigate pages, zoom in/out

#### EvidenceUploadZone
- **Purpose:** Generic upload zone
- **Features:** Drag & drop, click to upload, file validation
- **Interactions:** Upload files, remove files

---

### Notes Components

#### NoteEditor
- **Purpose:** Rich text note editor
- **Features:** Formatting toolbar, text area, character count, voice note option
- **Interactions:** Type, format, record voice, save

#### NoteList
- **Purpose:** Notes list view
- **Features:** Filter by type, sort by date, search
- **Interactions:** View, edit, delete, filter

#### VoiceRecorder
- **Purpose:** Voice note recorder
- **Features:** Record button, waveform, duration, playback
- **Interactions:** Record, stop, playback, delete

#### NoteTypeChips
- **Purpose:** Note type selector
- **Features:** Type chips (observation, violation, general, follow-up)
- **Interactions:** Select type

---

### Sync Components

#### SyncIndicator
- **Purpose:** Sync status indicator
- **Features:** Icon, status text, last sync time, pending count
- **Interactions:** Click to sync, view details

#### SyncQueue
- **Purpose:** Sync queue display
- **Features:** Item list, status, retry button, error display
- **Interactions:** Retry item, clear completed

#### ConflictResolver
- **Purpose:** Sync conflict resolution
- **Features:** Diff view, server/local versions, resolution options
- **Interactions:** Keep server, keep local, merge

#### OfflineBanner
- **Purpose:** Offline status banner
- **Features:** Offline message, continue offline option
- **Interactions:** Dismiss, view sync status

---

### Location Components

#### LocationTracker
- **Purpose:** GPS location tracking
- **Features:** Current location display, accuracy indicator, updates
- **Interactions:** Refresh location, view on map

#### GeofenceMonitor
- **Purpose:** Geofence status display
- **Features:** Distance from site, in/out status, breach alert
- **Interactions:** View on map, check in

#### MapView
- **Purpose:** Interactive map display
- **Features:** Markers, polylines, zoom controls, fullscreen
- **Interactions:** Pan, zoom, click markers

#### CheckInButton
- **Purpose:** Check-in action button
- **Features:** Enable/disable based on geofence, distance display
- **Interactions:** Check in, manual override

---

### AI Components

#### VerificationStatus
- **Purpose:** AI verification status display
- **Features:** Overall score, discrepancy list, severity badges
- **Interactions:** View details, resolve discrepancies

#### VerificationAlert
- **Purpose:** AI discrepancy alert
- **Features:** Alert message, confidence score, resolution options
- **Interactions:** Accept, dispute, view evidence

#### RecommendationPanel
- **Purpose:** AI recommendations display
- **Features:** Collapsible panel, recommendation cards, category filter
- **Interactions:** Accept, dismiss, view details

#### RecommendationCard
- **Purpose:** Individual recommendation
- **Features:** Suggestion, category, confidence, regulatory reference
- **Interactions:** Accept, dismiss, view regulation

#### ConfidenceMeter
- **Purpose:** Confidence score display
- **Features:** Visual meter, percentage, color coding
- **Interactions:** View details

---

### Report Components

#### ReportViewer
- **Purpose:** Report document viewer
- **Features:** PDF/HTML viewer, page navigation, zoom controls
- **Interactions:** Navigate pages, zoom, download

#### ReportSummary
- **Purpose:** Report summary card
- **Features:** Compliance score, violation count, recommendations
- **Interactions:** View details, download

#### TableOfContents
- **Purpose:** Report navigation
- **Features:** Section links, active state, collapsible
- **Interactions:** Navigate to section

---

### Route Components

#### RouteMap
- **Purpose:** Route map display
- **Features:** Route polyline, stop markers, current location, ETA
- **Interactions:** Pan, zoom, click stops

#### RouteList
- **Purpose:** Route stop list
- **Features:** Stop cards, sequence, status, ETA
- **Interactions:** View details, complete stop

#### StopCard
- **Purpose:** Individual route stop
- **Features:** Site info, scheduled time, status, actions
- **Interactions:** View details, navigate, complete

#### RouteSummary
- **Purpose:** Route summary
- **Features:** Total distance, time, stops, savings
- **Interactions:** Optimize, view details

---

### Form Components

#### LoginForm
- **Purpose:** Login form
- **Features:** Email/phone input, password input, remember me, forgot password
- **Validation:** Email format, password strength
- **Hooks:** useAuth, useForm

#### SubmissionForm
- **Purpose:** Inspection submission form
- **Features:** Checklist, comments, recipient, priority, attachments
- **Validation:** Required fields, completeness check
- **Hooks:** useSubmission, useForm

#### FilterForm
- **Purpose:** Generic filter form
- **Features:** Dynamic filters, date range, select inputs
- **Validation:** Filter value validity
- **Hooks:** useForm

---

## Custom Hooks

### useAuth
- **Purpose:** Authentication state and operations
- **Returns:** `user, token, isAuthenticated, login, logout, refresh, loading, error`
- **Features:** Auto token refresh, session management
- **Dependencies:** AuthContext

### useInspection
- **Purpose:** Inspection data and operations
- **Returns:** `inspection, updateInspection, transitionState, getTimeline, loading, error`
- **Features:** React Query caching, optimistic updates
- **Dependencies:** inspection.service, inspectionStore

### useAssignment
- **Purpose:** Assignment data and operations
- **Returns:** `assignments, acceptAssignment, declineAssignment, filters, loading, error`
- **Features:** Filtering, sorting, pagination
- **Dependencies:** assignment.service

### useChecklist
- **Purpose:** Checklist data and operations
- **Returns:** `template, responses, updateResponse, validateResponses, loading, error`
- **Features:** Local state management, validation
- **Dependencies:** checklist.service, checklistStore

### useEvidence
- **Purpose:** Evidence upload and management
- **Returns:** `evidence, uploadEvidence, deleteEvidence, updateMetadata, loading, error`
- **Features:** Multipart upload, progress tracking
- **Dependencies:** evidence.service, uploadManager

### useNotes
- **Purpose:** Notes management
- **Returns:** `notes, createNote, updateNote, deleteNote, transcribeVoice, loading, error`
- **Features:** Voice transcription, offline support
- **Dependencies:** notes.service, offlineStorage

### useSync
- **Purpose:** Offline synchronization
- **Returns:** `syncStatus, pushChanges, pullChanges, resolveConflict, loading, error`
- **Features:** Automatic sync, conflict detection
- **Dependencies:** sync.service, offlineStorage

### useLocation
- **Purpose:** Location tracking and geofencing
- **Returns:** `location, accuracy, checkIn, checkGeofence, loading, error`
- **Features:** GPS tracking, geofence validation
- **Dependencies:** location.service, geolocation API

### useAI
- **Purpose:** AI integration
- **Returns:** `verification, recommendations, verifyEvidence, getRecommendations, loading, error`
- **Features:** Real-time recommendations, verification status
- **Dependencies:** ai.service

### useReport
- **Purpose:** Report generation and viewing
- **Returns:** `report, generateReport, downloadReport, previewReport, loading, error`
- **Features:** Async generation, format conversion
- **Dependencies:** report.service

### useSubmission
- **Purpose:** Inspection submission
- **Returns:** `submission, submitInspection, withdrawSubmission, getStatus, loading, error`
- **Features:** Validation, routing, status tracking
- **Dependencies:** submission.service

### useRoute
- **Purpose:** Route planning and optimization
- **Returns:** `route, optimizeRoute, completeStop, getDailyRoute, loading, error`
- **Features:** AI optimization, ETA calculation
- **Dependencies:** route.service

### useOffline
- **Purpose:** Offline capability management
- **Returns:** `isOffline, queueSize, lastSync, syncStatus, forceSync`
- **Features:** Network detection, queue management
- **Dependencies:** OfflineContext, sync.service

### useCamera
- **Purpose:** Camera access and capture
- **Returns:** `stream, capture, switchCamera, toggleFlash, error`
- **Features:** Photo/video capture, device selection
- **Dependencies:** Camera API

### useGeolocation
- **Purpose:** Geolocation access
- **Returns:** `position, accuracy, watchPosition, error`
- **Features:** GPS tracking, accuracy monitoring
- **Dependencies:** Geolocation API

### useNetworkStatus
- **Purpose:** Network connectivity monitoring
- **Returns:** `isOnline, connectionType, latency`
- **Features:** Online/offline detection, connection type
- **Dependencies:** Network Information API

### useDebounce
- **Purpose:** Debounce function calls
- **Returns:** `debouncedValue`
- **Features:** Configurable delay, cancel on unmount
- **Dependencies:** None (utility hook)

### useThrottle
- **Purpose:** Throttle function calls
- **Returns:** `throttledFunction`
- **Features:** Configurable interval
- **Dependencies:** None (utility hook)

### useLocalStorage
- **Purpose:** Local storage state management
- **Returns:** `value, setValue, removeValue`
- **Features:** Type-safe, JSON serialization
- **Dependencies:** localStorage API

### usePrevious
- **Purpose:** Get previous value
- **Returns:** `previousValue`
- **Features:** Track value changes
- **Dependencies:** None (utility hook)

### useWindowSize
- **Purpose:** Window size tracking
- **Returns:** `width, height`
- **Features:** Responsive design support
- **Dependencies:** Window API

---

## Contexts

### AuthContext
- **Purpose:** Global authentication state
- **Provider:** AuthProvider
- **State:** user, token, isAuthenticated, permissions, roles
- **Actions:** login, logout, refresh, updateProfile
- **Consumers:** useAuth hook, route guards

### InspectionContext
- **Purpose:** Current inspection state
- **Provider:** InspectionProvider
- **State:** currentInspection, checklist, evidence, notes, status
- **Actions:** updateInspection, addEvidence, addNote, transitionState
- **Consumers:** Inspection workflow components

### OfflineContext
- **Purpose:** Offline capability state
- **Provider:** OfflineProvider
- **State:** isOffline, queueSize, lastSync, syncStatus
- **Actions:** sync, clearQueue, forceSync
- **Consumers:** useOffline hook, sync components

### ThemeContext
- **Purpose:** Theme management
- **Provider:** ThemeProvider
- **State:** theme (light/dark), colorScheme
- **Actions:** toggleTheme, setTheme
- **Consumers:** Theme components, settings page

### LanguageContext
- **Purpose:** Internationalization
- **Provider:** LanguageProvider
- **State:** locale, translations, direction
- **Actions:** setLocale, getTranslation
- **Consumers:** All components via useTranslation

### NotificationContext
- **Purpose:** Notification management
- **Provider:** NotificationProvider
- **State:** notifications, unreadCount
- **Actions:** addNotification, markRead, clearAll
- **Consumers:** Notification components

---

## API Services

### API Client Configuration
- **Base:** Axios instance with interceptors
- **Features:** Request/response interceptors, error handling, token injection, retry logic
- **Configuration:** Base URL, timeout, headers

### auth.service
- **Purpose:** Authentication API calls
- **Methods:** login, logout, refreshToken, getCurrentUser
- **Endpoints:** POST /auth/login, POST /auth/logout, POST /auth/refresh-token, GET /auth/me

### inspection.service
- **Purpose:** Inspection API calls
- **Methods:** getAssigned, getById, updateStatus, getTimeline
- **Endpoints:** GET /inspections/assigned, GET /inspections/:id, PUT /inspections/:id/status, GET /inspections/:id/timeline

### assignment.service
- **Purpose:** Assignment API calls
- **Methods:** getAll, getById, accept, decline
- **Endpoints:** GET /assignments, GET /assignments/:id, PUT /assignments/:id/accept, PUT /assignments/:id/decline

### checklist.service
- **Purpose:** Checklist API calls
- **Methods:** getTemplate, getTemplateById, submitResponses, updateResponse
- **Endpoints:** GET /checklists/templates/:type, GET /checklists/templates/:id, POST /checklists/responses, PUT /checklists/responses/:id

### evidence.service
- **Purpose:** Evidence API calls
- **Methods:** uploadPhoto, updatePhoto, deletePhoto, getPresignedUrl, uploadDocument
- **Endpoints:** POST /evidence/photos, PUT /evidence/photos/:id, DELETE /evidence/photos/:id, GET /evidence/photos/:id/presigned-url, POST /evidence/documents

### notes.service
- **Purpose:** Notes API calls
- **Methods:** create, getAll, update, delete
- **Endpoints:** GET /inspections/:id/notes, POST /inspections/:id/notes, PUT /notes/:id, DELETE /notes/:id

### sync.service
- **Purpose:** Sync API calls
- **Methods:** push, pull, getStatus, resolveConflict
- **Endpoints:** POST /sync/push, GET /sync/pull, GET /sync/status, POST /sync/conflicts/:id/resolve

### location.service
- **Purpose:** Location API calls
- **Methods:** checkIn, submitLocationUpdates, getGeofence
- **Endpoints:** POST /inspections/:id/check-in, POST /inspections/:id/location-updates, GET /sites/:id/geofence

### ai.service
- **Purpose:** AI integration API calls
- **Methods:** verifyEvidence, getRecommendations, getVerificationStatus
- **Endpoints:** POST /ai/verify-evidence, POST /ai/recommendations, GET /inspections/:id/verification-status

### report.service
- **Purpose:** Report API calls
- **Methods:** generate, preview, download
- **Endpoints:** POST /reports/generate, GET /reports/:id/preview, GET /reports/:id/download

### submission.service
- **Purpose:** Submission API calls
- **Methods:** submit, getStatus, withdraw
- **Endpoints:** POST /inspections/:id/submit, GET /inspections/:id/submission-status, PUT /inspections/:id/withdraw

### route.service
- **Purpose:** Route API calls
- **Methods:** getDaily, optimize, completeStop
- **Endpoints:** GET /routes/daily, PUT /routes/:id/optimize, POST /routes/:id/complete-stop

### i18n.service
- **Purpose:** Internationalization API calls
- **Methods:** getTranslations, setLocale
- **Endpoints:** GET /i18n/translations/:locale, PUT /inspectors/:id/locale

### audit.service
- **Purpose:** Audit API calls
- **Methods:** getLogs, getInspectionLogs, exportLogs
- **Endpoints:** GET /audit/logs, GET /audit/inspections/:id/logs, POST /audit/export

---

## State Management

### Zustand Stores (Client State)

#### authStore
- **Purpose:** Authentication state
- **State:** user, token, isAuthenticated, permissions, roles
- **Actions:** setAuth, clearAuth, updatePermissions
- **Persistence:** localStorage (encrypted)

#### inspectionStore
- **Purpose:** Current inspection state
- **State:** currentInspection, checklist, evidence, notes, status
- **Actions:** setInspection, updateChecklist, addEvidence, addNote, updateStatus
- **Persistence:** sessionStorage (per session)

#### offlineStore
- **Purpose:** Offline sync state
- **State:** isOffline, queue, lastSync, conflicts
- **Actions:** setOffline, addToQueue, removeFromQueue, updateSync
- **Persistence:** IndexedDB

#### uiStore
- **Purpose:** UI state
- **State:** sidebarOpen, theme, language, notifications
- **Actions:** toggleSidebar, setTheme, setLanguage, addNotification
- **Persistence:** localStorage

#### syncStore
- **Purpose:** Sync operation state
- **State:** isSyncing, syncProgress, lastError
- **Actions:** startSync, updateProgress, setError, completeSync
- **Persistence:** None (runtime only)

### React Query (Server State)

#### Query Keys
- **Purpose:** Cache key management
- **Structure:** Hierarchical keys for invalidation
- **Examples:** ['inspections', 'assigned'], ['checklists', templateId], ['evidence', inspectionId]

#### Query Configuration
- **Purpose:** Global React Query configuration
- **Settings:** Stale time, cache time, retry logic, error handling
- **Features:** Automatic refetching, optimistic updates, background refetching

#### Mutation Configuration
- **Purpose:** Mutation configuration
- **Settings:** Retry logic, error handling, success callbacks
- **Features:** Automatic cache invalidation, rollback on error

---

## Routing

### Route Structure

```typescript
const routes = [
  // Public routes
  { path: '/login', component: LoginPage },
  { path: '/forgot-password', component: ForgotPasswordPage },
  
  // Protected routes
  {
    path: '/',
    component: Layout,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'assignments', component: AssignmentListPage },
      { path: 'assignments/:id', component: AssignmentDetailPage },
      { path: 'inspections/:id/workflow', component: InspectionWorkflowPage },
      { path: 'inspections/:id/checklist', component: ChecklistPage },
      { path: 'inspections/:id/evidence', component: EvidencePage },
      { path: 'inspections/:id/notes', component: NotesPage },
      { path: 'inspections/:id/status', component: StatusPage },
      { path: 'evidence/photo/:inspectionId', component: PhotoCapturePage },
      { path: 'evidence/document/:inspectionId', component: DocumentUploadPage },
      { path: 'evidence/gallery/:inspectionId', component: EvidenceGalleryPage },
      { path: 'sync', component: SyncPage },
      { path: 'location/checkin/:inspectionId', component: CheckInPage },
      { path: 'reports/preview/:inspectionId', component: ReportPreviewPage },
      { path: 'reports/generate/:inspectionId', component: ReportGenerationPage },
      { path: 'submissions/:inspectionId', component: SubmissionPage },
      { path: 'submissions/status/:inspectionId', component: SubmissionStatusPage },
      { path: 'history', component: InspectionHistoryPage },
      { path: 'routes', component: RoutePlanningPage },
      { path: 'settings', component: SettingsPage },
    ],
  },
  
  // Error routes
  { path: '/404', component: NotFoundPage },
  { path: '/error', component: ErrorPage },
  { path: '/network-error', component: NetworkErrorPage },
  { path: '*', component: NotFoundPage },
]
```

### Route Guards

#### AuthGuard
- **Purpose:** Protect authenticated routes
- **Logic:** Check authentication, redirect to login if not authenticated
- **Usage:** Wrapper around protected route components

#### PermissionGuard
- **Purpose:** Protect routes by permission
- **Logic:** Check user permissions, redirect if not authorized
- **Usage:** Wrapper around routes requiring specific permissions

#### OfflineGuard
- **Purpose:** Handle offline navigation
- **Logic:** Allow offline-capable routes, block others
- **Usage:** Wrapper around routes requiring connectivity

### Navigation Patterns

#### Programmatic Navigation
- **useNavigate:** Hook for programmatic navigation
- **Navigation State:** Pass state between routes
- **Back Navigation:** Browser back button handling

#### Route Parameters
- **Dynamic Routes:** Parameterized routes (e.g., :id)
- **Query Parameters:** URL query string handling
- **Hash Routing:** Optional hash-based routing

---

## Utilities

### date.utils
- **Purpose:** Date formatting and manipulation
- **Functions:** formatDate, formatDateTime, formatRelative, formatDuration, isValidDate
- **Library:** date-fns

### file.utils
- **Purpose:** File operations
- **Functions:** formatFileSize, getFileExtension, validateFileType, validateFileSize, generateHash
- **Features:** File validation, size formatting

### validation.utils
- **Purpose:** Input validation helpers
- **Functions:** validateEmail, validatePhone, validateGPS, validateUUID, validateRequired
- **Features:** Common validation patterns

### format.utils
- **Purpose:** Data formatting
- **Functions:** formatNumber, formatCurrency, formatPercent, formatAddress, truncateText
- **Features:** Locale-aware formatting

### geo.utils
- **Purpose:** Geospatial calculations
- **Functions:** calculateDistance, calculateBearing, formatCoordinates, isPointInPolygon
- **Library:** Turf.js or similar

### image.utils
- **Purpose:** Image processing
- **Functions:** compressImage, resizeImage, generateThumbnail, extractMetadata, detectBlur
- **Features:** Client-side image processing

### string.utils
- **Purpose:** String manipulation
- **Functions:** capitalize, camelCase, snakeCase, slugify, truncate, stripHtml
- **Features:** Common string operations

### constants
- **Purpose:** Application constants
- **Constants:** API endpoints, status values, priority levels, error codes, file limits
- **Features:** Centralized constant management

---

## Performance Optimization

### Code Splitting
- **Route-based:** Lazy load route components
- **Component-based:** Lazy load heavy components
- **Implementation:** React.lazy() and Suspense

### Memoization
- **React.memo:** Component memoization
- **useMemo:** Expensive calculations
- **useCallback:** Function memoization
- **Usage:** Optimize re-renders

### Virtualization
- **Lists:** react-window for long lists
- **Grids:** react-virtualized for grids
- **Usage:** Large data sets

### Image Optimization
- **Lazy Loading:** Intersection Observer
- **Responsive Images:** srcset and sizes
- **Formats:** WebP with fallbacks

### Bundle Optimization
- **Tree Shaking:** Remove unused code
- **Minification:** Production builds
- **Compression:** Gzip/Brotli

---

## Accessibility

### ARIA Attributes
- **Semantic HTML:** Proper element usage
- **ARIA Labels:** Screen reader support
- **Focus Management:** Keyboard navigation
- **Live Regions:** Dynamic content announcements

### Keyboard Navigation
- **Tab Order:** Logical tab sequence
- **Shortcuts:** Keyboard shortcuts
- **Focus Indicators:** Visible focus states

### Color Contrast
- **WCAG AA:** Minimum contrast ratios
- **Color Blindness:** Color-independent design
- **Dark Mode:** Sufficient contrast

### Screen Reader Support
- **Labels:** Descriptive labels
- **Roles:** ARIA roles
- **States:** ARIA states

---

## Testing Strategy

### Unit Tests
- **Components:** React Testing Library
- **Hooks:** Custom hook testing
- **Utils:** Jest/Vitest
- **Coverage:** Minimum 80%

### Integration Tests
- **Pages:** Page integration tests
- **Services:** API service tests
- **Contexts:** Context provider tests

### E2E Tests
- **User Flows:** Playwright scenarios
- **Critical Paths:** Authentication, inspection workflow
- **Cross-browser:** Multiple browser testing

---

## Build and Deployment

### Build Configuration
- **Vite:** Build tool
- **TypeScript:** Type checking
- **Environment:** Environment-specific configs
- **Optimization:** Production optimizations

### Deployment
- **Static Assets:** CDN deployment
- **SPA:** Single page application
- **PWA:** Progressive web app support
- **Docker:** Containerized deployment

---

## Summary

This enterprise React frontend architecture provides:

- **Component-Driven:** Reusable, composable components
- **Type Safety:** Full TypeScript coverage
- **State Management:** Zustand + React Query for optimal state handling
- **Performance:** Code splitting, memoization, virtualization
- **Accessibility:** WCAG AA compliance
- **Offline-First:** IndexedDB storage and sync capabilities
- **Responsive:** Mobile-first design
- **Testability:** Comprehensive testing strategy
- **Maintainability:** Clear structure and separation of concerns
- **Scalability:** Architecture supports growth and feature additions

The architecture is designed to integrate seamlessly with the FastAPI backend while providing an excellent user experience for field inspectors.
