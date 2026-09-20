package testruns

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/database"
	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/identity"
)

// Repository is the SQL boundary for test_runs and test_results. It takes
// database.DB rather than *pgxpool.Pool directly, so a caller can run it
// standalone or inside a transaction without it knowing the difference -- see
// internal/database.DB's doc comment.
type Repository struct{}

// InsertRun writes one row to test_runs and returns it as the database
// generated it (id, created_at). RawReport is deliberately not carried on the
// returned Run -- callers already have the input they submitted if they need
// it, and returning it again would just double a potentially large payload.
func (Repository) InsertRun(ctx context.Context, db database.DB, in CreateRunInput, createdBy uuid.UUID, apiKeyID *uuid.UUID) (Run, error) {
	var run Run
	run.CreatedBy = createdBy
	run.APIKeyID = apiKeyID

	err := db.QueryRow(ctx,
		`INSERT INTO test_runs
		     (trigger_type, environment, base_url, started_at, finished_at, status,
		      total_tests, passed_count, failed_count, skipped_count, raw_report,
		      created_by, api_key_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		 RETURNING id, created_at`,
		in.TriggerType, in.Environment, in.BaseURL, in.StartedAt, in.FinishedAt, in.Status,
		in.TotalTests, in.PassedCount, in.FailedCount, in.SkippedCount, in.RawReport,
		createdBy, apiKeyID,
	).Scan(&run.ID, &run.CreatedAt)
	if err != nil {
		return Run{}, fmt.Errorf("testruns: insert run: %w", err)
	}

	run.TriggerType = in.TriggerType
	run.Environment = in.Environment
	run.BaseURL = in.BaseURL
	run.StartedAt = in.StartedAt
	run.FinishedAt = in.FinishedAt
	run.Status = in.Status
	run.TotalTests = in.TotalTests
	run.PassedCount = in.PassedCount
	run.FailedCount = in.FailedCount
	run.SkippedCount = in.SkippedCount
	return run, nil
}

// InsertResults writes every result row for a run. Results are typically a
// few dozen to a few hundred rows per run -- small enough that one INSERT per
// row, inside the same transaction as InsertRun, stays simple and fast
// enough; this is not a hot path worth a bulk-copy.
func (Repository) InsertResults(ctx context.Context, db database.DB, runID uuid.UUID, results []ResultInput) error {
	for _, res := range results {
		var line *int
		if res.Line != 0 {
			line = &res.Line
		}
		_, err := db.Exec(ctx,
			`INSERT INTO test_results
			     (run_id, title, full_title, project, file, line, status,
			      duration_ms, retries, error_message, error_stack)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			runID, res.Title, res.FullTitle, res.Project, res.File, line, res.Status,
			res.DurationMS, res.Retries, res.ErrorMessage, res.ErrorStack,
		)
		if err != nil {
			return fmt.Errorf("testruns: insert result %q: %w", res.Title, err)
		}
	}
	return nil
}

// runColumns is the column list shared by every run query below, in the
// order runRow.scan expects. raw_report is deliberately excluded -- see
// GetRun.
const runColumns = `id, trigger_type, environment, base_url, started_at, finished_at,
	status, total_tests, passed_count, failed_count, skipped_count,
	created_by, api_key_id, created_at`

func scanRun(row pgx.Row) (Run, error) {
	var run Run
	err := row.Scan(
		&run.ID, &run.TriggerType, &run.Environment, &run.BaseURL, &run.StartedAt, &run.FinishedAt,
		&run.Status, &run.TotalTests, &run.PassedCount, &run.FailedCount, &run.SkippedCount,
		&run.CreatedBy, &run.APIKeyID, &run.CreatedAt,
	)
	return run, err
}

// ListRuns returns runs newest first, matching internal/audit.List's keyset
// convention: every filter is "$n IS NULL OR <predicate>", so one prepared
// statement serves every combination.
func (Repository) ListRuns(ctx context.Context, db database.DB, f ListFilter) ([]Run, error) {
	limit := f.Limit
	if limit <= 0 || limit > 200 {
		limit = PageSize
	}

	var before, environment, status any
	if f.Before != uuid.Nil {
		before = f.Before
	}
	if f.Environment != "" {
		environment = f.Environment
	}
	if f.Status != "" {
		status = f.Status
	}

	rows, err := db.Query(ctx,
		`SELECT `+runColumns+`
		 FROM test_runs
		 WHERE ($1::uuid IS NULL OR id < $1::uuid)
		   AND ($2::text IS NULL OR environment = $2::text)
		   AND ($3::text IS NULL OR status = $3::text)
		 ORDER BY id DESC
		 LIMIT $4`,
		before, environment, status, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("testruns: list runs: %w", err)
	}
	defer rows.Close()

	out := []Run{}
	for rows.Next() {
		run, err := scanRun(rows)
		if err != nil {
			return nil, fmt.Errorf("testruns: scan run: %w", err)
		}
		out = append(out, run)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("testruns: iterate runs: %w", err)
	}
	return out, nil
}

// GetRun returns one run. raw_report is fetched separately from the columns
// every other query uses, and only when includeRaw is true -- a run's report
// can be sizeable, and nothing but the single-run detail view needs it.
func (Repository) GetRun(ctx context.Context, db database.DB, id uuid.UUID, includeRaw bool) (Run, error) {
	run, err := scanRun(db.QueryRow(ctx, `SELECT `+runColumns+` FROM test_runs WHERE id = $1`, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Run{}, fmt.Errorf("testruns: get run %s: %w", id, identity.ErrNotFound)
		}
		return Run{}, fmt.Errorf("testruns: get run %s: %w", id, err)
	}

	if includeRaw {
		if err := db.QueryRow(ctx, `SELECT raw_report FROM test_runs WHERE id = $1`, id).Scan(&run.RawReport); err != nil {
			return Run{}, fmt.Errorf("testruns: get raw report for run %s: %w", id, err)
		}
	}
	return run, nil
}

// ListResults returns one run's results, newest first, with the same keyset
// pagination as ListRuns.
func (Repository) ListResults(ctx context.Context, db database.DB, runID uuid.UUID, f ListFilter) ([]Result, error) {
	limit := f.Limit
	if limit <= 0 || limit > 200 {
		limit = PageSize
	}

	var before, status any
	if f.Before != uuid.Nil {
		before = f.Before
	}
	if f.Status != "" {
		status = f.Status
	}

	rows, err := db.Query(ctx,
		`SELECT id, run_id, title, full_title, project, file, line, status,
		        duration_ms, retries, error_message, error_stack
		 FROM test_results
		 WHERE run_id = $1
		   AND ($2::uuid IS NULL OR id < $2::uuid)
		   AND ($3::text IS NULL OR status = $3::text)
		 ORDER BY id DESC
		 LIMIT $4`,
		runID, before, status, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("testruns: list results for run %s: %w", runID, err)
	}
	defer rows.Close()

	out := []Result{}
	for rows.Next() {
		var res Result
		var line *int
		if err := rows.Scan(
			&res.ID, &res.RunID, &res.Title, &res.FullTitle, &res.Project, &res.File, &line,
			&res.Status, &res.DurationMS, &res.Retries, &res.ErrorMessage, &res.ErrorStack,
		); err != nil {
			return nil, fmt.Errorf("testruns: scan result: %w", err)
		}
		if line != nil {
			res.Line = *line
		}
		out = append(out, res)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("testruns: iterate results: %w", err)
	}
	return out, nil
}
