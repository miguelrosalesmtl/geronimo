-- Test runs and their per-test results, submitted by the e2e test suite's API
-- key after each Playwright run. See internal/testruns and
-- docs/architecture.md (in the monorepo root, not this module) for the wire
-- contract.

-- +goose Up

CREATE TABLE public.test_runs (
    id uuid DEFAULT uuidv7() NOT NULL,
    trigger_type text NOT NULL,
    environment text NOT NULL,
    base_url text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone,
    status text NOT NULL,
    total_tests integer DEFAULT 0 NOT NULL,
    passed_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    skipped_count integer DEFAULT 0 NOT NULL,
    raw_report jsonb NOT NULL,
    created_by uuid NOT NULL,
    api_key_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_runs_trigger_type_check
        CHECK (trigger_type IN ('job', 'cronjob', 'manual')),
    CONSTRAINT test_runs_status_check
        CHECK (status IN ('passed', 'failed', 'timedout', 'interrupted'))
);

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_api_key_id_fkey
        FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE SET NULL;

-- No separate index for keyset pagination: id is uuidv7 (time-ordered) and
-- already the primary key, so "ORDER BY id DESC" / "id < $before" use that
-- index directly, same as audit_log.
CREATE INDEX test_runs_environment_idx ON public.test_runs USING btree (environment);
CREATE INDEX test_runs_status_idx ON public.test_runs USING btree (status);

CREATE TABLE public.test_results (
    id uuid DEFAULT uuidv7() NOT NULL,
    run_id uuid NOT NULL,
    title text NOT NULL,
    full_title text NOT NULL,
    project text DEFAULT ''::text NOT NULL,
    file text DEFAULT ''::text NOT NULL,
    line integer,
    status text NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    retries integer DEFAULT 0 NOT NULL,
    error_message text,
    error_stack text,
    CONSTRAINT test_results_status_check
        CHECK (status IN ('passed', 'failed', 'timedout', 'skipped', 'interrupted'))
);

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_run_id_fkey
        FOREIGN KEY (run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;

CREATE INDEX test_results_run_id_idx ON public.test_results USING btree (run_id);
CREATE INDEX test_results_status_idx ON public.test_results USING btree (status);

-- Seed the two new permissions, and grant them to the built-in admin role --
-- exactly like 00001_init.sql seeds the baseline catalog. This has to happen
-- here and not only in SyncPermissions (which upserts the very same rows,
-- idempotently, on every app boot): role_permissions.permission has a FK onto
-- permissions.key, and a bare `go test` / `goose up` run never calls
-- SyncPermissions at all, so without this the FK insert below would fail and
-- "admin holds every permission in the catalog" (see README) would quietly
-- stop being true for anyone provisioned before the app's first boot.
--
-- Only admin: member's default scope (users.read) is unaffected by this
-- resource, same as it was unaffected by adding API keys or audit.
INSERT INTO public.permissions VALUES ('testruns.create', 'Submit e2e test run results', now());
INSERT INTO public.permissions VALUES ('testruns.read', 'View e2e test run results', now());

INSERT INTO public.role_permissions VALUES ('019f631b-c4ef-7214-8bd3-85b45843f531', 'testruns.create');
INSERT INTO public.role_permissions VALUES ('019f631b-c4ef-7214-8bd3-85b45843f531', 'testruns.read');

-- +goose Down
DELETE FROM public.role_permissions WHERE permission IN ('testruns.create', 'testruns.read');
DELETE FROM public.permissions WHERE key IN ('testruns.create', 'testruns.read');
DROP TABLE IF EXISTS public.test_results, public.test_runs CASCADE;
