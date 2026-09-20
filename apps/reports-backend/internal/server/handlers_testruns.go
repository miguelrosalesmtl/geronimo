package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/testruns"
)

// Test run submission and browsing, under /test-runs. The e2e suite's API
// key POSTs here after every Playwright run (see the e2e entrypoint's
// "always submit, even on a test failure" rule); anyone holding
// testruns.read browses what it submitted.

// handleCreateTestRun records a run and its results.
func (s *Server) handleCreateTestRun(w http.ResponseWriter, r *http.Request) {
	var in testruns.CreateRunInput
	if err := decodeJSON(w, r, &in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	ctx := r.Context()
	var apiKeyID *uuid.UUID
	if key, ok := apiKeyFrom(ctx); ok {
		apiKeyID = &key.ID
	}

	run, err := s.testruns.CreateRun(ctx, in, userFrom(ctx).ID, apiKeyID)
	if err != nil {
		s.errors.handle(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, run)
}

// testRunListFilter reads the query params shared by the list-runs and
// list-results handlers below.
func testRunListFilter(r *http.Request) (testruns.ListFilter, error) {
	q := r.URL.Query()
	f := testruns.ListFilter{
		Environment: q.Get("environment"),
		Status:      q.Get("status"),
		Limit:       testruns.PageSize,
	}
	if raw := q.Get("before"); raw != "" {
		before, err := uuid.Parse(raw)
		if err != nil {
			return testruns.ListFilter{}, err
		}
		f.Before = before
	}
	return f, nil
}

// nextBefore is the cursor for the next page: the id of the last row on this
// one, or empty when the page wasn't full -- nothing more to fetch. Same
// convention as GET /audit's next_before.
func nextBefore[T any](items []T, id func(T) uuid.UUID) string {
	if len(items) < testruns.PageSize {
		return ""
	}
	return id(items[len(items)-1]).String()
}

// handleListTestRuns returns runs newest first, filterable by environment
// and status.
//
//	?environment=staging
//	?status=failed
//	?before=<run uuid>   the next page
func (s *Server) handleListTestRuns(w http.ResponseWriter, r *http.Request) {
	filter, err := testRunListFilter(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "before must be a UUID")
		return
	}

	runs, err := s.testruns.ListRuns(r.Context(), filter)
	if err != nil {
		s.errors.handle(w, r, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items":       runs,
		"next_before": nextBefore(runs, func(run testruns.Run) uuid.UUID { return run.ID }),
	})
}

// handleGetTestRun returns one run. ?include_raw=true also returns the
// original Playwright JSON report, which a list never does.
func (s *Server) handleGetTestRun(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "runID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "runID must be a UUID")
		return
	}

	includeRaw := r.URL.Query().Get("include_raw") == "true"
	run, err := s.testruns.GetRun(r.Context(), id, includeRaw)
	if err != nil {
		s.errors.handle(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, run)
}

// handleListTestRunResults returns one run's results, newest first,
// filterable by status (e.g. ?status=failed to see just the failures).
func (s *Server) handleListTestRunResults(w http.ResponseWriter, r *http.Request) {
	runID, err := uuid.Parse(chi.URLParam(r, "runID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "runID must be a UUID")
		return
	}

	filter, err := testRunListFilter(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "before must be a UUID")
		return
	}

	results, err := s.testruns.ListResults(r.Context(), runID, filter)
	if err != nil {
		s.errors.handle(w, r, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items":       results,
		"next_before": nextBefore(results, func(res testruns.Result) uuid.UUID { return res.ID }),
	})
}
