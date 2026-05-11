DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PostType'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = (
      SELECT oid
      FROM pg_type
      WHERE typname = 'PostType'
      LIMIT 1
    )
    AND enumlabel = 'PROFESSIONAL_UPDATE'
  ) THEN
    ALTER TYPE "PostType" ADD VALUE 'PROFESSIONAL_UPDATE';
  END IF;
END
$$;
