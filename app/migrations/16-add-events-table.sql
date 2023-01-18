create table events (
    id bigserial primary key,
    created_at timestamp not null,
    topic text not null,
    message text not null,
    processed_at timestamp,
    processed boolean
);
