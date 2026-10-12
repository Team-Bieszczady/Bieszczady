BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[notifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [kind] NVARCHAR(1000) NOT NULL,
    [task_id] NVARCHAR(1000) NOT NULL,
    [actor_id] NVARCHAR(1000),
    [dedupe_key] NVARCHAR(1000),
    [read_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [notifications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
-- Filtered by hand: a SQL Server UNIQUE admits a single NULL, and only the
-- deadline sweep sets a dedupe key. Prisma cannot express the filter.
CREATE UNIQUE NONCLUSTERED INDEX [notifications_dedupe_key_key] ON [dbo].[notifications]([dedupe_key]) WHERE [dedupe_key] IS NOT NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_user_id_created_at_idx] ON [dbo].[notifications]([user_id], [created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_task_id_idx] ON [dbo].[notifications]([task_id]);

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_actor_id_fkey] FOREIGN KEY ([actor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
