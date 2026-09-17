-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT,
    "challengeDayId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSec" INTEGER,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "goodReps" INTEGER NOT NULL,
    "badReps" INTEGER NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "durationSec" INTEGER,

    CONSTRAINT "ExerciseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormIssue" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "severity" TEXT,

    CONSTRAINT "FormIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_startedAt_idx" ON "WorkoutSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ExerciseResult_sessionId_idx" ON "ExerciseResult"("sessionId");

-- CreateIndex
CREATE INDEX "FormIssue_resultId_idx" ON "FormIssue"("resultId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_challengeDayId_fkey" FOREIGN KEY ("challengeDayId") REFERENCES "ChallengeDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseResult" ADD CONSTRAINT "ExerciseResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormIssue" ADD CONSTRAINT "FormIssue_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ExerciseResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
