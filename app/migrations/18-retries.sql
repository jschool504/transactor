alter table events
    add column retries bigint not null default 0;
