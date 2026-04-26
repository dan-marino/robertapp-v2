ALTER TABLE "games" ADD COLUMN "time" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "opponent" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "traded" boolean DEFAULT false NOT NULL;