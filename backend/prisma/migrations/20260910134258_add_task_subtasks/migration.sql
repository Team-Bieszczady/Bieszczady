BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[subtasks] (
    [id] NVARCHAR(1000) NOT NULL,
    [task_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [done] BIT NOT NULL CONSTRAINT [subtasks_done_df] DEFAULT 0,
    [sort_order] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [subtasks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [subtasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [subtasks_task_id_idx] ON [dbo].[subtasks]([task_id]);

-- AddForeignKey
ALTER TABLE [dbo].[subtasks] ADD CONSTRAINT [subtasks_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
