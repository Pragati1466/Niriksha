ALTER TABLE "Inspection"
ADD COLUMN "submissionOverrideReason" TEXT,
ADD COLUMN "submissionOverriddenAt" TIMESTAMP(3);

CREATE TABLE "VerificationFinding" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "checklistLabel" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationFinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationFinding_inspectionId_idx" ON "VerificationFinding"("inspectionId");
CREATE INDEX "VerificationFinding_createdAt_idx" ON "VerificationFinding"("createdAt");

ALTER TABLE "VerificationFinding"
ADD CONSTRAINT "VerificationFinding_inspectionId_fkey"
FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
