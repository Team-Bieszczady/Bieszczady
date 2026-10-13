BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[project_member_modules] (
    [id] NVARCHAR(1000) NOT NULL,
    [member_id] NVARCHAR(1000) NOT NULL,
    [module] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [project_member_modules_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_member_modules_member_id_module_key] UNIQUE NONCLUSTERED ([member_id],[module])
);

-- AddForeignKey
ALTER TABLE [dbo].[project_member_modules] ADD CONSTRAINT [project_member_modules_member_id_fkey] FOREIGN KEY ([member_id]) REFERENCES [dbo].[project_members]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH


INSERT INTO [project_member_modules] ([id], [member_id], [module])
SELECT CONVERT(NVARCHAR(36), NEWID()), m.[id], v.[module]
FROM [project_members] AS m
CROSS JOIN (VALUES ('TASKS'), ('BUDGET'), ('DOCUMENTS')) AS v([module]);
