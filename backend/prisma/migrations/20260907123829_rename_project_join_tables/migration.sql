BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[project_project_types] DROP CONSTRAINT [project_project_types_project_id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[project_project_types] DROP CONSTRAINT [project_project_types_project_type_id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[project_recipient_links] DROP CONSTRAINT [project_recipient_links_project_id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[project_recipient_links] DROP CONSTRAINT [project_recipient_links_recipient_id_fkey];

-- DropTable
DROP TABLE [dbo].[project_project_types];

-- DropTable
DROP TABLE [dbo].[project_recipient_links];

-- CreateTable
CREATE TABLE [dbo].[project_types_on_projects] (
    [project_id] NVARCHAR(1000) NOT NULL,
    [project_type_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [project_types_on_projects_pkey] PRIMARY KEY CLUSTERED ([project_id],[project_type_id])
);

-- CreateTable
CREATE TABLE [dbo].[project_recipients_on_projects] (
    [project_id] NVARCHAR(1000) NOT NULL,
    [recipient_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [project_recipients_on_projects_pkey] PRIMARY KEY CLUSTERED ([project_id],[recipient_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_types_on_projects_project_type_id_idx] ON [dbo].[project_types_on_projects]([project_type_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_recipients_on_projects_recipient_id_idx] ON [dbo].[project_recipients_on_projects]([recipient_id]);

-- AddForeignKey
ALTER TABLE [dbo].[project_types_on_projects] ADD CONSTRAINT [project_types_on_projects_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_types_on_projects] ADD CONSTRAINT [project_types_on_projects_project_type_id_fkey] FOREIGN KEY ([project_type_id]) REFERENCES [dbo].[project_types]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_recipients_on_projects] ADD CONSTRAINT [project_recipients_on_projects_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_recipients_on_projects] ADD CONSTRAINT [project_recipients_on_projects_recipient_id_fkey] FOREIGN KEY ([recipient_id]) REFERENCES [dbo].[project_recipients]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

