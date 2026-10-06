BEGIN TRY

BEGIN TRAN;

-- A SQL Server UNIQUE constraint admits a single NULL, and every event except
-- the overdue sweep's is written without a dedupe key. Only non-NULL keys must
-- be unique. Prisma cannot express the filter, so this is written by hand.
ALTER TABLE [dbo].[project_events] DROP CONSTRAINT [project_events_dedupe_key_key];

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [project_events_dedupe_key_key] ON [dbo].[project_events]([dedupe_key]) WHERE [dedupe_key] IS NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
