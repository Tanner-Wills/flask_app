-- Optimized schema with better constraints and indexing
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL, -- 'Partner' column will be stored here
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    device_type TEXT,
    uid TEXT NOT NULL UNIQUE,
    data_type TEXT,
    data_set TEXT,
    data_going_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Optimized indexing strategy
CREATE INDEX idx_company_id ON data_entries(company_id);
CREATE INDEX idx_uid ON data_entries(uid);
CREATE INDEX idx_data_set ON data_entries(data_set);

-- Composite indexes for common query patterns
CREATE INDEX idx_company_data_set ON data_entries(company_id, data_set);
CREATE INDEX idx_uid_company ON data_entries(uid, company_id);

-- Optional: If device_type is frequently queried
CREATE INDEX idx_device_type ON data_entries(device_type);

-- Optimized queries using JOINs instead of subqueries
SELECT de.* 
FROM data_entries de
JOIN companies c ON de.company_id = c.id
WHERE c.name = 'Company XYZ';

SELECT * FROM data_entries
WHERE uid = 'some_unique_uid';

-- Optimized count query with composite index usage
SELECT COUNT(*) 
FROM data_entries de
JOIN companies c ON de.company_id = c.id
WHERE c.name = 'Company XYZ'
AND de.data_set = 'some_data_set';

-- Alternative direct count if you have company_id
SELECT COUNT(*) FROM data_entries
WHERE company_id = ? AND data_set = ?;

-- Additional useful queries for common patterns
SELECT c.name, COUNT(de.id) as entry_count
FROM companies c
LEFT JOIN data_entries de ON c.id = de.company_id
GROUP BY c.id, c.name;

SELECT data_set, COUNT(*) as count
FROM data_entries
WHERE company_id = ?
GROUP BY data_set
ORDER BY count DESC;