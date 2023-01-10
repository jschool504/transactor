create table budgets (
    id bigserial primary key,
    name text not null,
    allocation bigint not null
)
