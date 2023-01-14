alter table transaction_requests
    add column started_at TIMESTAMP,
    add column completed_at TIMESTAMP;