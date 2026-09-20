// Package testruns stores the results the e2e test suite submits after each
// Playwright run against the deployed target, so they can be reviewed after
// the fact instead of only being visible in an ephemeral pod's logs.
//
// The wire contract (what POST /api/v1/test-runs accepts and the GET routes
// return) is documented in docs/architecture.md at the repo root, which is
// authoritative -- keep this package in sync with it rather than the other
// way around.
package testruns

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// TriggerType is how a run was started.
type TriggerType string

const (
	TriggerJob     TriggerType = "job"
	TriggerCronjob TriggerType = "cronjob"
	TriggerManual  TriggerType = "manual"
)

func (t TriggerType) valid() bool {
	switch t {
	case TriggerJob, TriggerCronjob, TriggerManual:
		return true
	}
	return false
}

// Status is a run's overall outcome.
type Status string

const (
	StatusPassed      Status = "passed"
	StatusFailed      Status = "failed"
	StatusTimedOut    Status = "timedout"
	StatusInterrupted Status = "interrupted"
)

func (s Status) valid() bool {
	switch s {
	case StatusPassed, StatusFailed, StatusTimedOut, StatusInterrupted:
		return true
	}
	return false
}

// ResultStatus is one test's outcome. It has one more value than Status
// (skipped) -- a whole RUN is never simply "skipped", but an individual test
// within it can be.
type ResultStatus string

const (
	ResultPassed      ResultStatus = "passed"
	ResultFailed      ResultStatus = "failed"
	ResultTimedOut    ResultStatus = "timedout"
	ResultSkipped     ResultStatus = "skipped"
	ResultInterrupted ResultStatus = "interrupted"
)

func (s ResultStatus) valid() bool {
	switch s {
	case ResultPassed, ResultFailed, ResultTimedOut, ResultSkipped, ResultInterrupted:
		return true
	}
	return false
}

// Run is one Playwright suite execution, submitted whole by the e2e Job or
// CronJob after it finishes (successfully or not -- see the e2e entrypoint's
// "always submit" rule in the plan).
type Run struct {
	ID           uuid.UUID   `json:"id"`
	TriggerType  TriggerType `json:"trigger_type"`
	Environment  string      `json:"environment"`
	BaseURL      string      `json:"base_url"`
	StartedAt    time.Time   `json:"started_at"`
	FinishedAt   *time.Time  `json:"finished_at,omitempty"`
	Status       Status      `json:"status"`
	TotalTests   int         `json:"total_tests"`
	PassedCount  int         `json:"passed_count"`
	FailedCount  int         `json:"failed_count"`
	SkippedCount int         `json:"skipped_count"`
	CreatedBy    uuid.UUID   `json:"created_by"`
	APIKeyID     *uuid.UUID  `json:"api_key_id,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	// RawReport is populated only by GetRun with includeRaw=true -- never on a
	// list, where it would make every page transfer every report in full.
	RawReport json.RawMessage `json:"raw_report,omitempty"`
}

// Result is one test's outcome within a Run.
type Result struct {
	ID           uuid.UUID    `json:"id"`
	RunID        uuid.UUID    `json:"run_id"`
	Title        string       `json:"title"`
	FullTitle    string       `json:"full_title"`
	Project      string       `json:"project,omitempty"`
	File         string       `json:"file,omitempty"`
	Line         int          `json:"line,omitempty"`
	Status       ResultStatus `json:"status"`
	DurationMS   int          `json:"duration_ms"`
	Retries      int          `json:"retries"`
	ErrorMessage *string      `json:"error_message,omitempty"`
	ErrorStack   *string      `json:"error_stack,omitempty"`
}

// CreateRunInput is the POST /api/v1/test-runs request body.
type CreateRunInput struct {
	TriggerType  TriggerType     `json:"trigger_type"`
	Environment  string          `json:"environment"`
	BaseURL      string          `json:"base_url"`
	StartedAt    time.Time       `json:"started_at"`
	FinishedAt   *time.Time      `json:"finished_at"`
	Status       Status          `json:"status"`
	TotalTests   int             `json:"total_tests"`
	PassedCount  int             `json:"passed_count"`
	FailedCount  int             `json:"failed_count"`
	SkippedCount int             `json:"skipped_count"`
	RawReport    json.RawMessage `json:"raw_report"`
	Results      []ResultInput   `json:"results"`
}

// ResultInput is one entry of CreateRunInput.Results.
type ResultInput struct {
	Title        string       `json:"title"`
	FullTitle    string       `json:"full_title"`
	Project      string       `json:"project"`
	File         string       `json:"file"`
	Line         int          `json:"line"`
	Status       ResultStatus `json:"status"`
	DurationMS   int          `json:"duration_ms"`
	Retries      int          `json:"retries"`
	ErrorMessage *string      `json:"error_message"`
	ErrorStack   *string      `json:"error_stack"`
}

// ListFilter narrows a run or result listing. The zero value matches
// everything. Pagination is keyset, same convention as internal/audit: ids
// are uuidv7 (time-ordered), so "id < before" means "older than".
type ListFilter struct {
	Environment string
	Status      string
	Before      uuid.UUID
	Limit       int
}

// PageSize is how many rows one page holds, matching internal/audit's
// auditPageSize convention.
const PageSize = 20
