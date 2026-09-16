CREATE TABLE "game_stats" (
	"game_id" varchar(36) NOT NULL,
	"player_id" varchar(36) NOT NULL,
	"s1b" integer DEFAULT 0 NOT NULL,
	"s2b" integer DEFAULT 0 NOT NULL,
	"s3b" integer DEFAULT 0 NOT NULL,
	"hr" integer DEFAULT 0 NOT NULL,
	"bb" integer DEFAULT 0 NOT NULL,
	"k" integer DEFAULT 0 NOT NULL,
	"fo" integer DEFAULT 0 NOT NULL,
	"fc" integer DEFAULT 0 NOT NULL,
	"go" integer DEFAULT 0 NOT NULL,
	"sf" integer DEFAULT 0 NOT NULL,
	"rbi" integer DEFAULT 0 NOT NULL,
	"r" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "game_stats_game_id_player_id_pk" PRIMARY KEY("game_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;