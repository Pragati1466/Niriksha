CREATE TABLE "ReviewAction" (
  "id" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "oldStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "comments" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReviewAction_inspectionId_createdAt_idx" ON "ReviewAction"("inspectionId", "createdAt");
CREATE INDEX "ReviewAction_reviewerId_createdAt_idx" ON "ReviewAction"("reviewerId", "createdAt");
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TrustHistory" (
  "id" TEXT NOT NULL, "inspectorId" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  "previousScore" DOUBLE PRECISION, "reasons" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TrustHistory_inspectorId_createdAt_idx" ON "TrustHistory"("inspectorId", "createdAt");
ALTER TABLE "TrustHistory" ADD CONSTRAINT "TrustHistory_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OrdiAssessment" (
  "id" TEXT NOT NULL, "inspectionId" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  "riskLevel" TEXT NOT NULL, "priority" TEXT NOT NULL, "trend" TEXT NOT NULL, "contributors" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "OrdiAssessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrdiAssessment_inspectionId_createdAt_idx" ON "OrdiAssessment"("inspectionId", "createdAt");
ALTER TABLE "OrdiAssessment" ADD CONSTRAINT "OrdiAssessment_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ReportVersion" (
  "id" TEXT NOT NULL, "inspectionId" TEXT NOT NULL, "versionType" TEXT NOT NULL, "content" TEXT NOT NULL,
  "authorId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ReportVersion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReportVersion_inspectionId_createdAt_idx" ON "ReportVersion"("inspectionId", "createdAt");
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL, "changes" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrustScore" ADD CONSTRAINT "TrustScore_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
