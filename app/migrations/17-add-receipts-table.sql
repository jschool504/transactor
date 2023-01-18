create table receipts (
    id bigserial primary key,
    created_at timestamp not null,
    transaction_date timestamp not null,
    merchant text not null,
    amount bigint not null,
    raw_receipt text not null
);