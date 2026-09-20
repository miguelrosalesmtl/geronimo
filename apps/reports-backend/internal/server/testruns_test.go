package server

import (
	"net/http"
	"testing"
)

func sampleRunPayload(environment, status string) map[string]any {
	resultStatus := "passed"
	failedCount := 0
	if status != "passed" {
		resultStatus = "failed"
		failedCount = 1
	}
	return map[string]any{
		"trigger_type":  "job",
		"environment":   environment,
		"base_url":      "https://" + environment + ".example.com",
		"started_at":    "2026-01-01T00:00:00Z",
		"finished_at":   "2026-01-01T00:03:00Z",
		"status":        status,
		"total_tests":   1,
		"passed_count":  1 - failedCount,
		"failed_count":  failedCount,
		"skipped_count": 0,
		"raw_report":    map[string]any{"stats": map[string]any{}},
		"results": []map[string]any{
			{
				"title":       "logs in",
				"full_title":  "auth > logs in",
				"project":     "ui",
				"file":        "tests/ui/login.spec.ts",
				"line":        12,
				"status":      resultStatus,
				"duration_ms": 842,
				"retries":     0,
			},
		},
	}
}

func TestCreateTestRunOverHTTP(t *testing.T) {
	h := newHarness(t)
	adminToken, _ := h.registerAndLogin("admin@example.com")
	h.makeAdmin("admin@example.com")

	rec := h.req(http.MethodPost, "/api/v1/test-runs", adminToken, sampleRunPayload("staging", "failed"))
	mustStatus(t, rec, http.StatusCreated)

	var created struct {
		ID          string `json:"id"`
		Environment string `json:"environment"`
		Status      string `json:"status"`
		RawReport   any    `json:"raw_report"`
	}
	decodeBody(t, rec, &created)
	if created.ID == "" {
		t.Fatal("create test run returned no id")
	}
	if created.Environment != "staging" || created.Status != "failed" {
		t.Errorf("created run = %+v, want environment=staging status=failed", created)
	}
	if created.RawReport != nil {
		t.Error("the create response should not echo raw_report back")
	}
}

func TestCreateTestRunRejectsMismatchedCounts(t *testing.T) {
	h := newHarness(t)
	adminToken, _ := h.registerAndLogin("admin@example.com")
	h.makeAdmin("admin@example.com")

	payload := sampleRunPayload("staging", "passed")
	payload["total_tests"] = 5 // results only has 1 entry

	mustStatus(t, h.req(http.MethodPost, "/api/v1/test-runs", adminToken, payload), http.StatusBadRequest)
}

func TestListAndGetTestRunsOverHTTP(t *testing.T) {
	h := newHarness(t)
	adminToken, _ := h.registerAndLogin("admin@example.com")
	h.makeAdmin("admin@example.com")

	rec := h.req(http.MethodPost, "/api/v1/test-runs", adminToken, sampleRunPayload("staging", "failed"))
	mustStatus(t, rec, http.StatusCreated)
	var created struct {
		ID string `json:"id"`
	}
	decodeBody(t, rec, &created)

	mustStatus(t, h.req(http.MethodPost, "/api/v1/test-runs", adminToken, sampleRunPayload("production", "passed")), http.StatusCreated)

	// List, filtered to the environment we care about.
	rec = h.req(http.MethodGet, "/api/v1/test-runs?environment=staging", adminToken, nil)
	mustStatus(t, rec, http.StatusOK)
	var list struct {
		Items []struct {
			ID          string `json:"id"`
			Environment string `json:"environment"`
		} `json:"items"`
		NextBefore string `json:"next_before"`
	}
	decodeBody(t, rec, &list)
	if len(list.Items) != 1 || list.Items[0].ID != created.ID {
		t.Fatalf("list(environment=staging) = %+v, want exactly the staging run", list)
	}

	// Get without include_raw: no raw_report.
	rec = h.req(http.MethodGet, "/api/v1/test-runs/"+created.ID, adminToken, nil)
	mustStatus(t, rec, http.StatusOK)
	var got struct {
		RawReport any `json:"raw_report"`
	}
	decodeBody(t, rec, &got)
	if got.RawReport != nil {
		t.Error("GET without include_raw returned raw_report")
	}

	// Get with include_raw=true: raw_report present.
	rec = h.req(http.MethodGet, "/api/v1/test-runs/"+created.ID+"?include_raw=true", adminToken, nil)
	mustStatus(t, rec, http.StatusOK)
	decodeBody(t, rec, &got)
	if got.RawReport == nil {
		t.Error("GET with include_raw=true did not return raw_report")
	}

	// Results, filtered to failures.
	rec = h.req(http.MethodGet, "/api/v1/test-runs/"+created.ID+"/results?status=failed", adminToken, nil)
	mustStatus(t, rec, http.StatusOK)
	var results struct {
		Items []struct {
			Status string `json:"status"`
		} `json:"items"`
	}
	decodeBody(t, rec, &results)
	if len(results.Items) != 1 || results.Items[0].Status != "failed" {
		t.Fatalf("results(status=failed) = %+v, want exactly one failed result", results)
	}
}

func TestGetMissingTestRun404sOverHTTP(t *testing.T) {
	h := newHarness(t)
	adminToken, _ := h.registerAndLogin("admin@example.com")
	h.makeAdmin("admin@example.com")

	mustStatus(t,
		h.req(http.MethodGet, "/api/v1/test-runs/019724c4-0000-7000-8000-000000000000", adminToken, nil),
		http.StatusNotFound)
}

// TestTestRunsRequirePermissionOverHTTP: a plain user (no roles) can neither
// submit nor browse -- testruns.create/read are gated like everything else
// under the permission-gated group.
func TestTestRunsRequirePermissionOverHTTP(t *testing.T) {
	h := newHarness(t)
	plainToken, _ := h.registerAndLogin("plain@example.com")

	mustStatus(t, h.req(http.MethodPost, "/api/v1/test-runs", plainToken, sampleRunPayload("staging", "passed")), http.StatusForbidden)
	mustStatus(t, h.req(http.MethodGet, "/api/v1/test-runs", plainToken, nil), http.StatusForbidden)
}
