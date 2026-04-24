CREATE TYPE "public"."game_mode" AS ENUM('Unified', 'Split');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF');--> statement-breakpoint
CREATE TYPE "public"."preference_tier" AS ENUM('Tier1', 'Tier2', 'Tier3', 'Anti');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('Present', 'Absent', 'Late');--> statement-breakpoint
CREATE TYPE "public"."gender_group" AS ENUM('M', 'F', 'All');--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"game_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"season_id" varchar(36) NOT NULL,
	"date" text NOT NULL,
	"inning_count" integer NOT NULL,
	"mode" "game_mode" DEFAULT 'Unified' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"gender" "gender" NOT NULL,
	"is_guest" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rosters" (
	"season_id" varchar(36) NOT NULL,
	"player_id" varchar(36) NOT NULL,
	CONSTRAINT "rosters_season_id_player_id_pk" PRIMARY KEY("season_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "position_preferences" (
	"player_id" varchar(36) NOT NULL,
	"position" "position" NOT NULL,
	"tier" "preference_tier" NOT NULL,
	CONSTRAINT "position_preferences_player_id_position_pk" PRIMARY KEY("player_id","position")
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"game_id" varchar(36) NOT NULL,
	"player_id" varchar(36) NOT NULL,
	"status" "rsvp_status" NOT NULL,
	CONSTRAINT "rsvps_game_id_player_id_pk" PRIMARY KEY("game_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "fielding_slots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"game_id" varchar(36) NOT NULL,
	"inning" integer NOT NULL,
	"player_id" varchar(36) NOT NULL,
	"position" "position" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batting_slots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"game_id" varchar(36) NOT NULL,
	"player_id" varchar(36) NOT NULL,
	"order_index" integer NOT NULL,
	"gender_group" "gender_group" DEFAULT 'All' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_history" (
	"player_id" varchar(36) NOT NULL,
	"season_id" varchar(36) NOT NULL,
	"position" "position" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "position_history_player_id_season_id_position_pk" PRIMARY KEY("player_id","season_id","position")
);
--> statement-breakpoint
CREATE TABLE "batting_history" (
	"player_id" varchar(36) NOT NULL,
	"season_id" varchar(36) NOT NULL,
	"game_id" varchar(36) NOT NULL,
	"order_index" integer NOT NULL,
	"gender_group" "gender_group" DEFAULT 'All' NOT NULL,
	CONSTRAINT "batting_history_player_id_season_id_game_id_pk" PRIMARY KEY("player_id","season_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_preferences" ADD CONSTRAINT "position_preferences_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fielding_slots" ADD CONSTRAINT "fielding_slots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fielding_slots" ADD CONSTRAINT "fielding_slots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batting_slots" ADD CONSTRAINT "batting_slots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batting_slots" ADD CONSTRAINT "batting_slots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batting_history" ADD CONSTRAINT "batting_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batting_history" ADD CONSTRAINT "batting_history_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batting_history" ADD CONSTRAINT "batting_history_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;