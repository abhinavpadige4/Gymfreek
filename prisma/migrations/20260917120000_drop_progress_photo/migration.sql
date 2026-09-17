-- Drop ProgressPhoto (out of spec: results only, never files). DROP TABLE
-- removes its index and FK constraint with it.
DROP TABLE "ProgressPhoto";
