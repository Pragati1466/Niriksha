CREATE TABLE "ComplianceMemoryEvent" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT,
    "siteId" TEXT,
    "checklistItemId" TEXT,
    "checklistLabel" TEXT,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "finding" TEXT,
    "confidence" DOUBLE PRECISION,
    "evidenceReference" TEXT,
    "actorId" TEXT,
    "reason" TEXT,
    "sourceRecordId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceMemoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComplianceMemoryEvent_inspectionId_idx" ON "ComplianceMemoryEvent"("inspectionId");
CREATE INDEX "ComplianceMemoryEvent_siteId_checklistItemId_outcome_occurredAt_idx" ON "ComplianceMemoryEvent"("siteId", "checklistItemId", "outcome", "occurredAt");
CREATE INDEX "ComplianceMemoryEvent_actorId_occurredAt_idx" ON "ComplianceMemoryEvent"("actorId", "occurredAt");
CREATE INDEX "ComplianceMemoryEvent_eventType_occurredAt_idx" ON "ComplianceMemoryEvent"("eventType", "occurredAt");
CREATE UNIQUE INDEX "ComplianceMemoryEvent_eventType_sourceRecordId_key" ON "ComplianceMemoryEvent"("eventType", "sourceRecordId");

ALTER TABLE "ComplianceMemoryEvent" ADD CONSTRAINT "ComplianceMemoryEvent_inspectionId_fkey"
FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceMemoryEvent" ADD CONSTRAINT "ComplianceMemoryEvent_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceMemoryEvent" ADD CONSTRAINT "ComplianceMemoryEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
