CREATE TABLE "messenger_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"mid" text,
	"direction" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messenger_messages_mid_unique" UNIQUE("mid"),
	CONSTRAINT "messenger_messages_direction_chk" CHECK ("messenger_messages"."direction" in ('in','out')),
	CONSTRAINT "messenger_messages_kind_chk" CHECK ("messenger_messages"."kind" in ('text','image','comment','human','system'))
);
--> statement-breakpoint
CREATE TABLE "messenger_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psid" text NOT NULL,
	"display_name" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"facts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paused_until" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messenger_threads_psid_unique" UNIQUE("psid")
);
--> statement-breakpoint
ALTER TABLE "messenger_messages" ADD CONSTRAINT "messenger_messages_thread_id_messenger_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."messenger_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messenger_messages_thread_idx" ON "messenger_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "messenger_threads_inbound_idx" ON "messenger_threads" USING btree ("last_inbound_at");