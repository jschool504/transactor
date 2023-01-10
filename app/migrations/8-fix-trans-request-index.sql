drop index transaction_requests_unq;
create unique index transaction_requests_unq on transaction_requests(id, account_id, next_cursor);