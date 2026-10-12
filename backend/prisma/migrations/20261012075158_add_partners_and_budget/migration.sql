/*
  Warnings:

  - A unique constraint covering the columns `[dedupe_key]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dedupe_key]` on the table `project_events` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[project_members] ADD [partner_id] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[partners] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [nip] NVARCHAR(1000) NOT NULL CONSTRAINT [partners_nip_df] DEFAULT '',
    [city] NVARCHAR(1000) NOT NULL CONSTRAINT [partners_city_df] DEFAULT '',
    [email] NVARCHAR(1000) NOT NULL CONSTRAINT [partners_email_df] DEFAULT '',
    [contact_name] NVARCHAR(1000) NOT NULL,
    [contact_email] NVARCHAR(1000) NOT NULL,
    [contact_phone] NVARCHAR(1000) NOT NULL CONSTRAINT [partners_contact_phone_df] DEFAULT '',
    [agreement] NVARCHAR(1000) NOT NULL,
    [agreement_valid_until] DATE,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [partners_status_df] DEFAULT 'ACTIVE',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [partners_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [partners_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[partner_projects] (
    [partner_id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [partner_projects_pkey] PRIMARY KEY CLUSTERED ([partner_id],[project_id])
);

-- CreateTable
CREATE TABLE [dbo].[budget_versions] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [number] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [is_current] BIT NOT NULL CONSTRAINT [budget_versions_is_current_df] DEFAULT 0,
    [description] NVARCHAR(max) NOT NULL CONSTRAINT [budget_versions_description_df] DEFAULT '',
    [created_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [budget_versions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [submitted_by_id] NVARCHAR(1000),
    [submitted_at] DATETIME2,
    [approved_by_id] NVARCHAR(1000),
    [approved_at] DATETIME2,
    [saved_at] DATETIME2,
    CONSTRAINT [budget_versions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_versions_project_id_number_key] UNIQUE NONCLUSTERED ([project_id],[number])
);

-- CreateTable
CREATE TABLE [dbo].[budget_categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [version_id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [partner_id] NVARCHAR(1000),
    [sort_order] INT NOT NULL,
    CONSTRAINT [budget_categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_categories_version_id_key_key] UNIQUE NONCLUSTERED ([version_id],[key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_positions] (
    [id] NVARCHAR(1000) NOT NULL,
    [version_id] NVARCHAR(1000) NOT NULL,
    [category_key] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [sort_order] INT NOT NULL,
    [planned] DECIMAL(12,2) NOT NULL CONSTRAINT [budget_positions_planned_df] DEFAULT 0,
    [grant] DECIMAL(12,2) NOT NULL CONSTRAINT [budget_positions_grant_df] DEFAULT 0,
    [own_contribution] DECIMAL(12,2) NOT NULL CONSTRAINT [budget_positions_own_contribution_df] DEFAULT 0,
    CONSTRAINT [budget_positions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_positions_version_id_key_key] UNIQUE NONCLUSTERED ([version_id],[key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_columns] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [locked] BIT NOT NULL CONSTRAINT [budget_columns_locked_df] DEFAULT 0,
    [sort_order] INT NOT NULL,
    CONSTRAINT [budget_columns_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_columns_project_id_key_key] UNIQUE NONCLUSTERED ([project_id],[key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_actuals] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [position_key] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000),
    [document_folder_id] NVARCHAR(1000),
    [document_id] NVARCHAR(1000),
    CONSTRAINT [budget_actuals_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_actuals_project_id_position_key_key] UNIQUE NONCLUSTERED ([project_id],[position_key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_actual_values] (
    [actual_id] NVARCHAR(1000) NOT NULL,
    [column_key] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(max) NOT NULL,
    CONSTRAINT [budget_actual_values_pkey] PRIMARY KEY CLUSTERED ([actual_id],[column_key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_invoices] (
    [id] NVARCHAR(1000) NOT NULL,
    [actual_id] NVARCHAR(1000) NOT NULL,
    [number] NVARCHAR(1000) NOT NULL,
    [contractor] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [amount] DECIMAL(12,2) NOT NULL,
    [grant] DECIMAL(12,2) NOT NULL CONSTRAINT [budget_invoices_grant_df] DEFAULT 0,
    [own_contribution] DECIMAL(12,2) NOT NULL CONSTRAINT [budget_invoices_own_contribution_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [budget_invoices_status_df] DEFAULT 'TO_BE_PAID',
    [entered_by_id] NVARCHAR(1000) NOT NULL,
    [document_folder_id] NVARCHAR(1000),
    [document_id] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [budget_invoices_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [budget_invoices_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[budget_category_settings] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [category_key] NVARCHAR(1000) NOT NULL,
    [detailed] BIT NOT NULL CONSTRAINT [budget_category_settings_detailed_df] DEFAULT 1,
    [partner_can_edit] BIT NOT NULL CONSTRAINT [budget_category_settings_partner_can_edit_df] DEFAULT 0,
    [visible_to_partner] BIT NOT NULL CONSTRAINT [budget_category_settings_visible_to_partner_df] DEFAULT 0,
    [document_folder_id] NVARCHAR(1000),
    [document_id] NVARCHAR(1000),
    CONSTRAINT [budget_category_settings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_category_settings_project_id_category_key_key] UNIQUE NONCLUSTERED ([project_id],[category_key])
);

-- CreateTable
CREATE TABLE [dbo].[budget_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [version_id] NVARCHAR(1000),
    [version_name] NVARCHAR(1000) NOT NULL,
    [kind] NVARCHAR(1000) NOT NULL,
    [comment] NVARCHAR(max),
    [actor_id] NVARCHAR(1000) NOT NULL,
    [at] DATETIME2 NOT NULL CONSTRAINT [budget_history_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [budget_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[budget_access] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [granted_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [budget_access_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [budget_access_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [budget_access_project_id_user_id_key] UNIQUE NONCLUSTERED ([project_id],[user_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [partner_projects_project_id_idx] ON [dbo].[partner_projects]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_versions_project_id_idx] ON [dbo].[budget_versions]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_versions_created_by_id_idx] ON [dbo].[budget_versions]([created_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_versions_submitted_by_id_idx] ON [dbo].[budget_versions]([submitted_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_versions_approved_by_id_idx] ON [dbo].[budget_versions]([approved_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_categories_partner_id_idx] ON [dbo].[budget_categories]([partner_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_positions_version_id_category_key_idx] ON [dbo].[budget_positions]([version_id], [category_key]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_invoices_actual_id_idx] ON [dbo].[budget_invoices]([actual_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_invoices_entered_by_id_idx] ON [dbo].[budget_invoices]([entered_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_history_project_id_idx] ON [dbo].[budget_history]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_history_actor_id_idx] ON [dbo].[budget_history]([actor_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_access_user_id_idx] ON [dbo].[budget_access]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [budget_access_granted_by_id_idx] ON [dbo].[budget_access]([granted_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_members_partner_id_idx] ON [dbo].[project_members]([partner_id]);

-- AddForeignKey
ALTER TABLE [dbo].[partner_projects] ADD CONSTRAINT [partner_projects_partner_id_fkey] FOREIGN KEY ([partner_id]) REFERENCES [dbo].[partners]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[partner_projects] ADD CONSTRAINT [partner_projects_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_members] ADD CONSTRAINT [project_members_partner_id_fkey] FOREIGN KEY ([partner_id]) REFERENCES [dbo].[partners]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_versions] ADD CONSTRAINT [budget_versions_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_versions] ADD CONSTRAINT [budget_versions_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_versions] ADD CONSTRAINT [budget_versions_submitted_by_id_fkey] FOREIGN KEY ([submitted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_versions] ADD CONSTRAINT [budget_versions_approved_by_id_fkey] FOREIGN KEY ([approved_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_categories] ADD CONSTRAINT [budget_categories_version_id_fkey] FOREIGN KEY ([version_id]) REFERENCES [dbo].[budget_versions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_categories] ADD CONSTRAINT [budget_categories_partner_id_fkey] FOREIGN KEY ([partner_id]) REFERENCES [dbo].[partners]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_positions] ADD CONSTRAINT [budget_positions_version_id_fkey] FOREIGN KEY ([version_id]) REFERENCES [dbo].[budget_versions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_columns] ADD CONSTRAINT [budget_columns_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_actuals] ADD CONSTRAINT [budget_actuals_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_actual_values] ADD CONSTRAINT [budget_actual_values_actual_id_fkey] FOREIGN KEY ([actual_id]) REFERENCES [dbo].[budget_actuals]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_invoices] ADD CONSTRAINT [budget_invoices_actual_id_fkey] FOREIGN KEY ([actual_id]) REFERENCES [dbo].[budget_actuals]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_invoices] ADD CONSTRAINT [budget_invoices_entered_by_id_fkey] FOREIGN KEY ([entered_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_category_settings] ADD CONSTRAINT [budget_category_settings_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_history] ADD CONSTRAINT [budget_history_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_history] ADD CONSTRAINT [budget_history_actor_id_fkey] FOREIGN KEY ([actor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_access] ADD CONSTRAINT [budget_access_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_access] ADD CONSTRAINT [budget_access_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[budget_access] ADD CONSTRAINT [budget_access_granted_by_id_fkey] FOREIGN KEY ([granted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
