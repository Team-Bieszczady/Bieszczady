/*
  Warnings:

  - Added the required column `owner_id` to the `folders` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[folders] ADD [owner_id] NVARCHAR(1000) NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[folders] ADD CONSTRAINT [folders_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
