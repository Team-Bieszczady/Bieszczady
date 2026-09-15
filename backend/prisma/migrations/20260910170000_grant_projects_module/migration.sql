-- Data migration, no schema change.
--
-- PROJECTS joined DEFAULT_USER_MODULES. Users created before this hold OVERVIEW/TASKS without
-- it, and those are tabs *inside* a project: the sidebar hides the whole tab strip without
-- PROJECTS and every project endpoint requires it, so their grants lead nowhere. Give each of
-- them the PROJECTS row they should have had.
--
-- granted_by_id is NOT NULL, so the row is attributed to whoever granted the project module
-- that made it necessary.
INSERT INTO [user_module_access] ([id], [user_id], [module], [granted_at], [granted_by_id])
SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    a.[user_id],
    'PROJECTS',
    SYSDATETIME(),
    MIN(a.[granted_by_id])
FROM [user_module_access] AS a
WHERE a.[module] IN ('OVERVIEW', 'TASKS', 'BUDGET', 'DOCUMENTS')
  AND NOT EXISTS (
      SELECT 1
      FROM [user_module_access] AS p
      WHERE p.[user_id] = a.[user_id]
        AND p.[module] = 'PROJECTS'
  )
GROUP BY a.[user_id];
