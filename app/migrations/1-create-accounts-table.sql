create table accounts (
    id bigserial primary key,
    account_id text not null,
    institution text not null,
    access_token text not null
);
