create table users
(
	id bigint default unique_rowid() not null
		constraint "primary"
			primary key,
	username varchar,
	password varchar,
	displayname varchar,
	action jsonb
);

alter table users owner to root;

create table state_changes
(
    id        bigint default unique_rowid() not null
        constraint state_changes_pk
            primary key,
    username  varchar,
    timestamp timestamp,
    action    jsonb
);

alter table state_changes
    owner to root;
