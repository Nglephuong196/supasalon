-- Create customer table
CREATE TABLE "public"."customer" (
  "id" SERIAL PRIMARY KEY,
  "name" character varying(255) NOT NULL,
  "phone" character varying(20),
  "gender" character varying(50),
  "birthday" date,
  "location" character varying(255),
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp without time zone
);

-- Grant permissions to anon
GRANT DELETE ON TABLE "public"."customer" TO "anon";
GRANT INSERT ON TABLE "public"."customer" TO "anon";
GRANT REFERENCES ON TABLE "public"."customer" TO "anon";
GRANT SELECT ON TABLE "public"."customer" TO "anon";
GRANT TRIGGER ON TABLE "public"."customer" TO "anon";
GRANT TRUNCATE ON TABLE "public"."customer" TO "anon";
GRANT UPDATE ON TABLE "public"."customer" TO "anon";

-- Grant permissions to authenticated
GRANT DELETE ON TABLE "public"."customer" TO "authenticated";
GRANT INSERT ON TABLE "public"."customer" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."customer" TO "authenticated";
GRANT SELECT ON TABLE "public"."customer" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."customer" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."customer" TO "authenticated";
GRANT UPDATE ON TABLE "public"."customer" TO "authenticated";

-- Grant permissions to service_role
GRANT DELETE ON TABLE "public"."customer" TO "service_role";
GRANT INSERT ON TABLE "public"."customer" TO "service_role";
GRANT REFERENCES ON TABLE "public"."customer" TO "service_role";
GRANT SELECT ON TABLE "public"."customer" TO "service_role";
GRANT TRIGGER ON TABLE "public"."customer" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."customer" TO "service_role";
GRANT UPDATE ON TABLE "public"."customer" TO "service_role";

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE customer_id_seq TO "anon";
GRANT USAGE, SELECT ON SEQUENCE customer_id_seq TO "authenticated";
GRANT USAGE, SELECT ON SEQUENCE customer_id_seq TO "service_role";
