package testruns

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/audit"
	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/database"
)

// Service holds the rules around test runs: validating what a caller submits,
// and persisting a run with its results as one atomic unit.
type Service struct {
	pool *pgxpool.Pool
	repo Repository
	log  *slog.Logger
}

// NewService builds a Service. There is no dependency on internal/identity
// here -- the HTTP layer resolves the caller (see internal/server) and hands
// this service only the ids it needs, the same separation internal/identity
// itself keeps from internal/server.
func NewService(pool *pgxpool.Pool, log *slog.Logger) *Service {
	return &Service{pool: pool, repo: Repository{}, log: log}
}

// CreateRun validates a submitted run, then persists it and every one of its
// results in a single transaction, with an audit entry recorded inside that
// same transaction -- so a run can never exist without being logged, and a
// failed insert can never leave a partial report behind.
func (s *Service) CreateRun(ctx context.Context, in CreateRunInput, createdBy uuid.UUID, apiKeyID *uuid.UUID) (Run, error) {
	if err := validateCreateRunInput(in); err != nil {
		return Run{}, err
	}

	var run Run
	err := database.InTx(ctx, s.pool, func(db database.DB) error {
		var err error
		run, err = s.repo.InsertRun(ctx, db, in, createdBy, apiKeyID)
		if err != nil {
			return err
		}

		if err := s.repo.InsertResults(ctx, db, run.ID, in.Results); err != nil {
			return err
		}

		return audit.NewRecorder(db).Record(ctx, audit.Event{
			ActorUserID: &createdBy,
			Action:      audit.ActionTestRunCreated,
			TargetType:  "test_run",
			TargetID:    run.ID.String(),
			Metadata: map[string]any{
				"environment":  run.Environment,
				"trigger_type": run.TriggerType,
				"status":       run.Status,
				"total_tests":  run.TotalTests,
				"failed_count": run.FailedCount,
			},
		})
	})
	if err != nil {
		return Run{}, err
	}

	s.log.Info("test run recorded",
		slog.String("run_id", run.ID.String()),
		slog.String("environment", run.Environment),
		slog.String("status", string(run.Status)),
		slog.Int("failed_count", run.FailedCount),
	)
	return run, nil
}

// ListRuns returns a page of runs, newest first.
func (s *Service) ListRuns(ctx context.Context, f ListFilter) ([]Run, error) {
	return s.repo.ListRuns(ctx, s.pool, f)
}

// GetRun returns one run. includeRaw controls whether the (potentially large)
// original Playwright report comes back with it.
func (s *Service) GetRun(ctx context.Context, id uuid.UUID, includeRaw bool) (Run, error) {
	return s.repo.GetRun(ctx, s.pool, id, includeRaw)
}

// ListResults returns a page of one run's results, newest first. It 404s if
// the run itself doesn't exist, rather than silently returning an empty page
// indistinguishable from "this run really had zero results".
func (s *Service) ListResults(ctx context.Context, runID uuid.UUID, f ListFilter) ([]Result, error) {
	if _, err := s.repo.GetRun(ctx, s.pool, runID, false); err != nil {
		return nil, err
	}
	return s.repo.ListResults(ctx, s.pool, runID, f)
}

// validateCreateRunInput rejects a submission whose own numbers don't add up,
// rather than trusting a caller's summary counts blindly.
func validateCreateRunInput(in CreateRunInput) error {
	if in.Environment == "" {
		return invalid("environment is required")
	}
	if in.BaseURL == "" {
		return invalid("base_url is required")
	}
	if in.StartedAt.IsZero() {
		return invalid("started_at is required")
	}
	if !in.TriggerType.valid() {
		return invalid("trigger_type must be one of: job, cronjob, manual")
	}
	if !in.Status.valid() {
		return invalid("status must be one of: passed, failed, timedout, interrupted")
	}
	if in.TotalTests < 0 || in.PassedCount < 0 || in.FailedCount < 0 || in.SkippedCount < 0 {
		return invalid("test counts must not be negative")
	}
	if in.PassedCount+in.FailedCount+in.SkippedCount > in.TotalTests {
		return invalid("passed_count + failed_count + skipped_count must not exceed total_tests")
	}
	if len(in.Results) != in.TotalTests {
		return invalid(fmt.Sprintf("results must contain exactly total_tests entries (got %d, want %d)", len(in.Results), in.TotalTests))
	}
	for i, res := range in.Results {
		if res.Title == "" {
			return invalid(fmt.Sprintf("results[%d].title is required", i))
		}
		if res.FullTitle == "" {
			return invalid(fmt.Sprintf("results[%d].full_title is required", i))
		}
		if !res.Status.valid() {
			return invalid(fmt.Sprintf("results[%d].status must be one of: passed, failed, timedout, skipped, interrupted", i))
		}
		if res.DurationMS < 0 || res.Retries < 0 {
			return invalid(fmt.Sprintf("results[%d]: duration_ms and retries must not be negative", i))
		}
	}
	return nil
}
