BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[indicators] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL CONSTRAINT [indicators_description_df] DEFAULT '',
    [target_value] INT NOT NULL,
    [current_value] INT NOT NULL CONSTRAINT [indicators_current_value_df] DEFAULT 0,
    [scope] NVARCHAR(1000) NOT NULL,
    [stage_id] NVARCHAR(1000),
    [task_id] NVARCHAR(1000),
    [owner_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [indicators_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [indicators_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[indicator_folders] (
    [indicator_id] NVARCHAR(1000) NOT NULL,
    [folder_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [indicator_folders_pkey] PRIMARY KEY CLUSTERED ([indicator_id],[folder_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicators_project_id_idx] ON [dbo].[indicators]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicators_stage_id_idx] ON [dbo].[indicators]([stage_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicators_task_id_idx] ON [dbo].[indicators]([task_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicators_owner_id_idx] ON [dbo].[indicators]([owner_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicator_folders_folder_id_idx] ON [dbo].[indicator_folders]([folder_id]);

-- AddForeignKey
ALTER TABLE [dbo].[indicators] ADD CONSTRAINT [indicators_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicators] ADD CONSTRAINT [indicators_stage_id_fkey] FOREIGN KEY ([stage_id]) REFERENCES [dbo].[stages]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicators] ADD CONSTRAINT [indicators_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicators] ADD CONSTRAINT [indicators_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicator_folders] ADD CONSTRAINT [indicator_folders_indicator_id_fkey] FOREIGN KEY ([indicator_id]) REFERENCES [dbo].[indicators]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicator_folders] ADD CONSTRAINT [indicator_folders_folder_id_fkey] FOREIGN KEY ([folder_id]) REFERENCES [dbo].[folders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

