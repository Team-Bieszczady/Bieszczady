BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[document_access] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [folder_id] NVARCHAR(1000),
    [document_id] NVARCHAR(1000),
    [user_id] NVARCHAR(1000) NOT NULL,
    [level] NVARCHAR(1000) NOT NULL,
    [granted_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [document_access_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [document_access_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [document_access_folder_id_user_id_key] UNIQUE NONCLUSTERED ([folder_id],[user_id]),
    CONSTRAINT [document_access_document_id_user_id_key] UNIQUE NONCLUSTERED ([document_id],[user_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [document_access_user_id_idx] ON [dbo].[document_access]([user_id]);

-- AddForeignKey
ALTER TABLE [dbo].[document_access] ADD CONSTRAINT [document_access_folder_id_fkey] FOREIGN KEY ([folder_id]) REFERENCES [dbo].[folders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[document_access] ADD CONSTRAINT [document_access_document_id_fkey] FOREIGN KEY ([document_id]) REFERENCES [dbo].[documents]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[document_access] ADD CONSTRAINT [document_access_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[document_access] ADD CONSTRAINT [document_access_granted_by_id_fkey] FOREIGN KEY ([granted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
