BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[invoices] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [amount] DECIMAL(12,2) NOT NULL,
    [payment_date] DATE NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [invoices_status_df] DEFAULT 'TO_PAY',
    [created_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [invoices_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [invoices_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[invoice_shares] (
    [id] NVARCHAR(1000) NOT NULL,
    [invoice_id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [amount] DECIMAL(12,2) NOT NULL,
    CONSTRAINT [invoice_shares_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [invoice_shares_invoice_id_project_id_key] UNIQUE NONCLUSTERED ([invoice_id],[project_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoices_payment_date_idx] ON [dbo].[invoices]([payment_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoices_created_by_id_idx] ON [dbo].[invoices]([created_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoice_shares_project_id_idx] ON [dbo].[invoice_shares]([project_id]);

-- AddForeignKey
ALTER TABLE [dbo].[invoices] ADD CONSTRAINT [invoices_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[invoice_shares] ADD CONSTRAINT [invoice_shares_invoice_id_fkey] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[invoices]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[invoice_shares] ADD CONSTRAINT [invoice_shares_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
