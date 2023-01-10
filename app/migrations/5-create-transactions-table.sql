create table transactions (
    id bigserial primary key,
    account_id text not null,
    amount bigint not null,
    name text not null,
    date text not null,
    merchant_name text,
    category_id text
)
