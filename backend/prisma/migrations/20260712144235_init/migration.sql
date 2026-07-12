-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INSPECTOR',
    "departmentId" TEXT,
    "phone" TEXT,
    "employeeId" TEXT,
    "jurisdiction" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "address" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "pincode" TEXT,
    "businessType" TEXT,
    "category" TEXT,
    "contactDetails" TEXT,
    "registrationNumber" TEXT,
    "registrationDate" DATETIME,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "checklistItems" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InspectionTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "scheduledDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "notes" TEXT,
    "confidenceScore" REAL,
    "aiAnalysis" TEXT,
    "submissionOverrideReason" TEXT,
    "submissionOverriddenAt" DATETIME,
    "locationLat" REAL,
    "locationLng" REAL,
    "locationAccuracy" REAL,
    "locationTimestamp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "checklistLabel" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "evidenceReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationFinding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceMemoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT,
    "siteId" TEXT,
    "checklistItemId" TEXT,
    "checklistLabel" TEXT,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "finding" TEXT,
    "confidence" REAL,
    "evidenceReference" TEXT,
    "actorId" TEXT,
    "reason" TEXT,
    "sourceRecordId" TEXT,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceMemoryEvent_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceMemoryEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceMemoryEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectionImage_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "evidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InspectionChecklist_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "imageEvidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Violation_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "summary" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "approved" BOOLEAN,
    "comments" TEXT,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectorId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 100,
    "totalInspections" INTEGER NOT NULL DEFAULT 0,
    "flaggedInspections" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_departmentId_idx" ON "User"("role", "departmentId");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_code_idx" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Site_departmentId_idx" ON "Site"("departmentId");

-- CreateIndex
CREATE INDEX "Site_status_idx" ON "Site"("status");

-- CreateIndex
CREATE INDEX "Site_registrationNumber_idx" ON "Site"("registrationNumber");

-- CreateIndex
CREATE INDEX "Site_businessType_idx" ON "Site"("businessType");

-- CreateIndex
CREATE INDEX "InspectionTemplate_departmentId_idx" ON "InspectionTemplate"("departmentId");

-- CreateIndex
CREATE INDEX "Inspection_inspectorId_idx" ON "Inspection"("inspectorId");

-- CreateIndex
CREATE INDEX "Inspection_siteId_idx" ON "Inspection"("siteId");

-- CreateIndex
CREATE INDEX "Inspection_templateId_idx" ON "Inspection"("templateId");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "Inspection_status_scheduledDate_idx" ON "Inspection"("status", "scheduledDate");

-- CreateIndex
CREATE INDEX "Inspection_inspectorId_status_idx" ON "Inspection"("inspectorId", "status");

-- CreateIndex
CREATE INDEX "Inspection_scheduledDate_idx" ON "Inspection"("scheduledDate");

-- CreateIndex
CREATE INDEX "Inspection_createdAt_idx" ON "Inspection"("createdAt");

-- CreateIndex
CREATE INDEX "VerificationFinding_inspectionId_idx" ON "VerificationFinding"("inspectionId");

-- CreateIndex
CREATE INDEX "VerificationFinding_createdAt_idx" ON "VerificationFinding"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceMemoryEvent_inspectionId_idx" ON "ComplianceMemoryEvent"("inspectionId");

-- CreateIndex
CREATE INDEX "ComplianceMemoryEvent_siteId_checklistItemId_outcome_occurredAt_idx" ON "ComplianceMemoryEvent"("siteId", "checklistItemId", "outcome", "occurredAt");

-- CreateIndex
CREATE INDEX "ComplianceMemoryEvent_actorId_occurredAt_idx" ON "ComplianceMemoryEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "ComplianceMemoryEvent_eventType_occurredAt_idx" ON "ComplianceMemoryEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMemoryEvent_eventType_sourceRecordId_key" ON "ComplianceMemoryEvent"("eventType", "sourceRecordId");

-- CreateIndex
CREATE INDEX "InspectionImage_inspectionId_idx" ON "InspectionImage"("inspectionId");

-- CreateIndex
CREATE INDEX "InspectionChecklist_inspectionId_idx" ON "InspectionChecklist"("inspectionId");

-- CreateIndex
CREATE INDEX "InspectionChecklist_inspectionId_status_idx" ON "InspectionChecklist"("inspectionId", "status");

-- CreateIndex
CREATE INDEX "InspectionChecklist_itemId_idx" ON "InspectionChecklist"("itemId");

-- CreateIndex
CREATE INDEX "Violation_inspectionId_idx" ON "Violation"("inspectionId");

-- CreateIndex
CREATE INDEX "Violation_severity_idx" ON "Violation"("severity");

-- CreateIndex
CREATE INDEX "Violation_inspectionId_severity_idx" ON "Violation"("inspectionId", "severity");

-- CreateIndex
CREATE INDEX "Violation_status_idx" ON "Violation"("status");

-- CreateIndex
CREATE INDEX "Violation_createdAt_idx" ON "Violation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_inspectionId_key" ON "Report"("inspectionId");

-- CreateIndex
CREATE INDEX "Report_inspectionId_idx" ON "Report"("inspectionId");

-- CreateIndex
CREATE INDEX "Review_inspectionId_idx" ON "Review"("inspectionId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_reviewedAt_idx" ON "Review"("reviewerId", "reviewedAt");

-- CreateIndex
CREATE INDEX "Review_approved_idx" ON "Review"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScore_inspectorId_key" ON "TrustScore"("inspectorId");

-- CreateIndex
CREATE INDEX "TrustScore_inspectorId_idx" ON "TrustScore"("inspectorId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
