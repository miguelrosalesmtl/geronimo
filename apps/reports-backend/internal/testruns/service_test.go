package testruns

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/identity"
)

// TestValidateCreateRunInput needs no database -- it runs even without
// TEST_POSTGRES_DSN, unlike everything else in this file.
func TestValidateCreateRunInput(t *testing.T) {
	valid := func() CreateRunInput {
		return CreateRunInput{
			TriggerType: TriggerJob,
			Environment: "staging",
			BaseURL:     "https://staging.example.com",
			StartedAt:   time.Now(),
			Status:      StatusPassed,
			TotalTests:  1,
			PassedCount: 1,
			Results: []ResultInput{
				{Title: "logs in", FullTitle: "auth > logs in", Status: ResultPassed},
			},
		}
	}

	tests := []struct {
		name   string
		mutate func(*CreateRunInput)
	}{
		{"missing environment", func(in *CreateRunInput) { in.Environment = "" }},
		{"missing base_url", func(in *CreateRunInput) { in.BaseURL = "" }},
		{"zero started_at", func(in *CreateRunInput) { in.StartedAt = time.Time{} }},
		{"bad trigger_type", func(in *CreateRunInput) { in.TriggerType = "webhook" }},
		{"bad status", func(in *CreateRunInput) { in.Status = "ok" }},
		{"negative counts", func(in *CreateRunInput) { in.PassedCount = -1 }},
		{"counts exceed total", func(in *CreateRunInput) { in.FailedCount = 5 }},
		{"results count mismatch", func(in *CreateRunInput) { in.Results = nil }},
		{"result missing title", func(in *CreateRunInput) { in.Results[0].Title = "" }},
		{"result missing full_title", func(in *CreateRunInput) { in.Results[0].FullTitle = "" }},
		{"result bad status", func(in *CreateRunInput) { in.Results[0].Status = "flaky" }},
		{"result negative duration", func(in *CreateRunInput) { in.Results[0].DurationMS = -1 }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := valid()
			tt.mutate(&in)
			err := validateCreateRunInput(in)
			if !errors.Is(err, identity.ErrValidation) {
				t.Fatalf("validateCreateRunInput(%+v) = %v, want an error wrapping identity.ErrValidation", in, err)
			}
		})
	}

	if err := validateCreateRunInput(valid()); err != nil {
		t.Errorf("a well-formed input was rejected: %v", err)
	}
}

func sampleInput(env string, status Status, total int) CreateRunInput {
	results := make([]ResultInput, total)
	for i := range results {
		st := ResultPassed
		if status != StatusPassed && i == 0 {
			st = ResultFailed
		}
		results[i] = ResultInput{
			Title:      "test",
			FullTitle:  "suite > test",
			Project:    "ui",
			Status:     st,
			DurationMS: 100,
		}
	}
	passed, failed := total, 0
	if status != StatusPassed {
		passed, failed = total-1, 1
	}
	return CreateRunInput{
		TriggerType: TriggerJob,
		Environment: env,
		BaseURL:     "https://" + env + ".example.com",
		StartedAt:   time.Now(),
		Status:      status,
		TotalTests:  total,
		PassedCount: passed,
		FailedCount: failed,
		RawReport:   json.RawMessage(`{"stats":{}}`),
		Results:     results,
	}
}

func TestCreateRunPersistsRunAndResults(t *testing.T) {
	svc, userID := newTestService(t)
	ctx := context.Background()

	run, err := svc.CreateRun(ctx, sampleInput("staging", StatusFailed, 3), userID, nil)
	if err != nil {
		t.Fatalf("CreateRun: %v", err)
	}
	if run.ID == uuid.Nil {
		t.Fatal("CreateRun returned a zero id")
	}
	if run.CreatedBy != userID {
		t.Errorf("CreatedBy = %s, want %s", run.CreatedBy, userID)
	}

	got, err := svc.GetRun(ctx, run.ID, false)
	if err != nil {
		t.Fatalf("GetRun: %v", err)
	}
	if got.RawReport != nil {
		t.Error("GetRun without includeRaw returned raw_report")
	}
	if got.Status != StatusFailed || got.TotalTests != 3 {
		t.Errorf("GetRun = %+v, want status=failed total_tests=3", got)
	}

	withRaw, err := svc.GetRun(ctx, run.ID, true)
	if err != nil {
		t.Fatalf("GetRun(includeRaw): %v", err)
	}
	if len(withRaw.RawReport) == 0 {
		t.Error("GetRun with includeRaw=true did not return raw_report")
	}

	results, err := svc.ListResults(ctx, run.ID, ListFilter{})
	if err != nil {
		t.Fatalf("ListResults: %v", err)
	}
	if len(results) != 3 {
		t.Fatalf("len(results) = %d, want 3", len(results))
	}

	failedOnly, err := svc.ListResults(ctx, run.ID, ListFilter{Status: string(ResultFailed)})
	if err != nil {
		t.Fatalf("ListResults(failed): %v", err)
	}
	if len(failedOnly) != 1 {
		t.Fatalf("len(failedOnly) = %d, want 1", len(failedOnly))
	}
}

func TestGetRunNotFound(t *testing.T) {
	svc, _ := newTestService(t)

	_, err := svc.GetRun(context.Background(), uuid.New(), false)
	if !errors.Is(err, identity.ErrNotFound) {
		t.Fatalf("GetRun(missing) = %v, want identity.ErrNotFound", err)
	}
}

func TestListResultsOnMissingRun404s(t *testing.T) {
	svc, _ := newTestService(t)

	_, err := svc.ListResults(context.Background(), uuid.New(), ListFilter{})
	if !errors.Is(err, identity.ErrNotFound) {
		t.Fatalf("ListResults(missing run) = %v, want identity.ErrNotFound", err)
	}
}

func TestListRunsFiltersAndPaginates(t *testing.T) {
	svc, userID := newTestService(t)
	ctx := context.Background()

	for i := 0; i < PageSize+5; i++ {
		env := "staging"
		if i%2 == 0 {
			env = "production"
		}
		status := StatusPassed
		if i%3 == 0 {
			status = StatusFailed
		}
		if _, err := svc.CreateRun(ctx, sampleInput(env, status, 1), userID, nil); err != nil {
			t.Fatalf("CreateRun[%d]: %v", i, err)
		}
	}

	page1, err := svc.ListRuns(ctx, ListFilter{})
	if err != nil {
		t.Fatalf("ListRuns: %v", err)
	}
	if len(page1) != PageSize {
		t.Fatalf("len(page1) = %d, want %d", len(page1), PageSize)
	}

	page2, err := svc.ListRuns(ctx, ListFilter{Before: page1[len(page1)-1].ID})
	if err != nil {
		t.Fatalf("ListRuns(page2): %v", err)
	}
	if len(page2) != 5 {
		t.Fatalf("len(page2) = %d, want 5", len(page2))
	}
	for _, r := range page1 {
		for _, r2 := range page2 {
			if r.ID == r2.ID {
				t.Fatalf("run %s appeared on both pages", r.ID)
			}
		}
	}

	prod, err := svc.ListRuns(ctx, ListFilter{Environment: "production", Limit: 200})
	if err != nil {
		t.Fatalf("ListRuns(environment=production): %v", err)
	}
	for _, r := range prod {
		if r.Environment != "production" {
			t.Errorf("ListRuns(environment=production) returned a %s run", r.Environment)
		}
	}
	if len(prod) == 0 {
		t.Error("expected at least one production run")
	}

	failed, err := svc.ListRuns(ctx, ListFilter{Status: string(StatusFailed), Limit: 200})
	if err != nil {
		t.Fatalf("ListRuns(status=failed): %v", err)
	}
	for _, r := range failed {
		if r.Status != StatusFailed {
			t.Errorf("ListRuns(status=failed) returned a %s run", r.Status)
		}
	}
}
