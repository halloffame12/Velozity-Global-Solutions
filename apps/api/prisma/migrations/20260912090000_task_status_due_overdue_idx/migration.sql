-- Composite index backing the overdue scan (dueDate < now, status != DONE, isOverdue = false)
-- and the status/count aggregations on the dashboard.
CREATE INDEX "Task_status_dueDate_isOverdue_idx" ON "Task"("status", "dueDate", "isOverdue");