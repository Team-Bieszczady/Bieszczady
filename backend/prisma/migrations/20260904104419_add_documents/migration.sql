BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[folders] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [parent_id] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [folders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [folders_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[documents] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [folder_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [kind] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [owner_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [documents_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [documents_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[document_versions] (
    [id] NVARCHAR(1000) NOT NULL,
    [document_id] NVARCHAR(1000) NOT NULL,
    [version_no] INT NOT NULL,
    [storage_key] NVARCHAR(1000) NOT NULL,
    [file_name] NVARCHAR(1000) NOT NULL,
    [mime_type] NVARCHAR(1000) NOT NULL,
    [size_bytes] INT NOT NULL,
    [change_note] NVARCHAR(1000),
    [uploaded_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [document_versions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [document_versions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [document_versions_document_id_version_no_key] UNIQUE NONCLUSTERED ([document_id],[version_no])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [folders_project_id_idx] ON [dbo].[folders]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [folders_parent_id_idx] ON [dbo].[folders]([parent_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documents_project_id_idx] ON [dbo].[documents]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documents_folder_id_idx] ON [dbo].[documents]([folder_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [document_versions_document_id_idx] ON [dbo].[document_versions]([document_id]);

-- AddForeignKey
ALTER TABLE [dbo].[folders] ADD CONSTRAINT [folders_parent_id_fkey] FOREIGN KEY ([parent_id]) REFERENCES [dbo].[folders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documents] ADD CONSTRAINT [documents_folder_id_fkey] FOREIGN KEY ([folder_id]) REFERENCES [dbo].[folders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documents] ADD CONSTRAINT [documents_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[document_versions] ADD CONSTRAINT [document_versions_document_id_fkey] FOREIGN KEY ([document_id]) REFERENCES [dbo].[documents]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[document_versions] ADD CONSTRAINT [document_versions_uploaded_by_id_fkey] FOREIGN KEY ([uploaded_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
