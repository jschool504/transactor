create table transaction_requests (
    id bigserial primary key,
    account_id text not null,
    next_cursor text,
    open boolean
);
