BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[budget_positions] ADD [partner_id] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_positions_partner_id_idx] ON [dbo].[budget_positions]([partner_id]);

-- AddForeignKey
ALTER TABLE [dbo].[budget_positions] ADD CONSTRAINT [budget_positions_partner_id_fkey] FOREIGN KEY ([partner_id]) REFERENCES [dbo].[partners]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

