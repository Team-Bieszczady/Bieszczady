BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[invoice_documents] (
    [id] NVARCHAR(1000) NOT NULL,
    [invoice_id] NVARCHAR(1000) NOT NULL,
    [document_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [invoice_documents_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [invoice_documents_invoice_id_document_id_key] UNIQUE NONCLUSTERED ([invoice_id],[document_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoice_documents_document_id_idx] ON [dbo].[invoice_documents]([document_id]);

-- AddForeignKey
ALTER TABLE [dbo].[invoice_documents] ADD CONSTRAINT [invoice_documents_invoice_id_fkey] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[invoices]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[invoice_documents] ADD CONSTRAINT [invoice_documents_document_id_fkey] FOREIGN KEY ([document_id]) REFERENCES [dbo].[documents]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
