create table budget_reports (
    id bigserial primary key,
    created_at timestamp not null,
    category bigint not null,
    amount_spent bigint not null,
    budget_limit bigint not null,
    rollover_amount bigint not null
);
