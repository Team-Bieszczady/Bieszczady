BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[document_access] DROP CONSTRAINT [document_access_document_id_user_id_key];

-- DropIndex
ALTER TABLE [dbo].[document_access] DROP CONSTRAINT [document_access_folder_id_user_id_key];

-- CreateIndex
CREATE NONCLUSTERED INDEX [document_access_folder_id_idx] ON [dbo].[document_access]([folder_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [document_access_document_id_idx] ON [dbo].[document_access]([document_id]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
