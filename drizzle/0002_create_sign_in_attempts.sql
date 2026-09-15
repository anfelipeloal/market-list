CREATE TABLE "sign_in_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sign_in_attempts" ENABLE ROW LEVEL SECURITY;