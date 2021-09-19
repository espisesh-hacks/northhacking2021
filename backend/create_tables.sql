create table state_changes
(
	id serial
		constraint state_changes_pk
			primary key,
	username varchar,
	"when" timestamp,
	action jsonb
);
