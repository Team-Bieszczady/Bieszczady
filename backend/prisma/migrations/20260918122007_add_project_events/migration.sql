BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[project_events] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [actor_id] NVARCHAR(1000),
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [project_events_source_df] DEFAULT 'AUTOMATIC',
    [content] NVARCHAR(max) NOT NULL,
    [dedupe_key] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [project_events_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [project_events_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_events_dedupe_key_key] UNIQUE NONCLUSTERED ([dedupe_key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_events_project_id_created_at_idx] ON [dbo].[project_events]([project_id], [created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_events_source_created_at_idx] ON [dbo].[project_events]([source], [created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_events_actor_id_idx] ON [dbo].[project_events]([actor_id]);

-- AddForeignKey
ALTER TABLE [dbo].[project_events] ADD CONSTRAINT [project_events_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_events] ADD CONSTRAINT [project_events_actor_id_fkey] FOREIGN KEY ([actor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
