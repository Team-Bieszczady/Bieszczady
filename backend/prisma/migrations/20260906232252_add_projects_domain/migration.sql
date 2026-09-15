BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[project_statuses] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL CONSTRAINT [project_statuses_color_df] DEFAULT 'gray',
    [active] BIT NOT NULL CONSTRAINT [project_statuses_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [project_statuses_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [project_statuses_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_statuses_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[project_types] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [active] BIT NOT NULL CONSTRAINT [project_types_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [project_types_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [project_types_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_types_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[project_recipients] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [active] BIT NOT NULL CONSTRAINT [project_recipients_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [project_recipients_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [project_recipients_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_recipients_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[projects] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [status_id] NVARCHAR(1000),
    [color] NVARCHAR(1000) NOT NULL CONSTRAINT [projects_color_df] DEFAULT 'green',
    [budget_amount] DECIMAL(12,2),
    [start_date] DATE,
    [planned_end_date] DATE,
    [archived_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [projects_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [projects_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[project_project_types] (
    [project_id] NVARCHAR(1000) NOT NULL,
    [project_type_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [project_project_types_pkey] PRIMARY KEY CLUSTERED ([project_id],[project_type_id])
);

-- CreateTable
CREATE TABLE [dbo].[project_recipient_links] (
    [project_id] NVARCHAR(1000) NOT NULL,
    [recipient_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [project_recipient_links_pkey] PRIMARY KEY CLUSTERED ([project_id],[recipient_id])
);

-- CreateTable
CREATE TABLE [dbo].[project_members] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [project_role] NVARCHAR(1000) NOT NULL,
    [joined_at] DATETIME2 NOT NULL CONSTRAINT [project_members_joined_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [project_members_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [project_members_project_id_user_id_key] UNIQUE NONCLUSTERED ([project_id],[user_id])
);

-- CreateTable
CREATE TABLE [dbo].[goals] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [goal_number] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [goals_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [goals_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [goals_project_id_goal_number_key] UNIQUE NONCLUSTERED ([project_id],[goal_number])
);

-- CreateTable
CREATE TABLE [dbo].[stages] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL CONSTRAINT [stages_description_df] DEFAULT '',
    [sort_order] INT NOT NULL,
    [start_date] DATE,
    [deadline] DATE NOT NULL,
    [original_deadline] DATE,
    [deadline_note] NVARCHAR(max),
    [completed_at] DATETIME2,
    [archived_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stages_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [stages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[activities] (
    [id] NVARCHAR(1000) NOT NULL,
    [stage_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [sort_order] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [activities_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [activities_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tasks] (
    [id] NVARCHAR(1000) NOT NULL,
    [activity_id] NVARCHAR(1000) NOT NULL,
    [owner_id] NVARCHAR(1000),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL CONSTRAINT [tasks_description_df] DEFAULT '',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_status_df] DEFAULT 'NEW',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [tasks_priority_df] DEFAULT 'MEDIUM',
    [due_date] DATE,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [tasks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[risks] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [responsible_user_id] NVARCHAR(1000),
    [description] NVARCHAR(max) NOT NULL,
    [probability] NVARCHAR(1000) NOT NULL CONSTRAINT [risks_probability_df] DEFAULT 'MEDIUM',
    [impact] NVARCHAR(1000) NOT NULL CONSTRAINT [risks_impact_df] DEFAULT 'MEDIUM',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [risks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [risks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [projects_status_id_idx] ON [dbo].[projects]([status_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_project_types_project_type_id_idx] ON [dbo].[project_project_types]([project_type_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_recipient_links_recipient_id_idx] ON [dbo].[project_recipient_links]([recipient_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [project_members_user_id_idx] ON [dbo].[project_members]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [goals_project_id_idx] ON [dbo].[goals]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stages_project_id_idx] ON [dbo].[stages]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [activities_stage_id_idx] ON [dbo].[activities]([stage_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_activity_id_idx] ON [dbo].[tasks]([activity_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tasks_owner_id_idx] ON [dbo].[tasks]([owner_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [risks_project_id_idx] ON [dbo].[risks]([project_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [risks_responsible_user_id_idx] ON [dbo].[risks]([responsible_user_id]);

-- AddForeignKey
ALTER TABLE [dbo].[projects] ADD CONSTRAINT [projects_status_id_fkey] FOREIGN KEY ([status_id]) REFERENCES [dbo].[project_statuses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_project_types] ADD CONSTRAINT [project_project_types_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_project_types] ADD CONSTRAINT [project_project_types_project_type_id_fkey] FOREIGN KEY ([project_type_id]) REFERENCES [dbo].[project_types]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_recipient_links] ADD CONSTRAINT [project_recipient_links_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_recipient_links] ADD CONSTRAINT [project_recipient_links_recipient_id_fkey] FOREIGN KEY ([recipient_id]) REFERENCES [dbo].[project_recipients]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_members] ADD CONSTRAINT [project_members_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[project_members] ADD CONSTRAINT [project_members_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[goals] ADD CONSTRAINT [goals_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stages] ADD CONSTRAINT [stages_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[activities] ADD CONSTRAINT [activities_stage_id_fkey] FOREIGN KEY ([stage_id]) REFERENCES [dbo].[stages]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_activity_id_fkey] FOREIGN KEY ([activity_id]) REFERENCES [dbo].[activities]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tasks] ADD CONSTRAINT [tasks_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[risks] ADD CONSTRAINT [risks_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[risks] ADD CONSTRAINT [risks_responsible_user_id_fkey] FOREIGN KEY ([responsible_user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
