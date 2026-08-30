BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[user_module_access] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [module] NVARCHAR(1000) NOT NULL,
    [granted_at] DATETIME2 NOT NULL CONSTRAINT [user_module_access_granted_at_df] DEFAULT CURRENT_TIMESTAMP,
    [granted_by_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [user_module_access_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_module_access_user_id_module_key] UNIQUE NONCLUSTERED ([user_id],[module])
);

-- AddForeignKey
ALTER TABLE [dbo].[user_module_access] ADD CONSTRAINT [user_module_access_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_module_access] ADD CONSTRAINT [user_module_access_granted_by_id_fkey] FOREIGN KEY ([granted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
