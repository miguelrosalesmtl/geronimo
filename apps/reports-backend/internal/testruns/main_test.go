package testruns

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log/slog"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/database"
	"github.com/miguelrosalesmtl/geronimo/apps/reports-backend/migrations"
)

// Integration tests: they run against a real Postgres, because what they are
// checking IS the SQL (the FKs onto users/api_keys, the CHECK constraints,
// the keyset pagination).
//
// Run them with:  make test-integration
//
// Without TEST_POSTGRES_DSN they skip, so `go test ./...` still passes on a
// machine with no database. See internal/identity/main_test.go, which this
// mirrors.
var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	dsn := os.Getenv("TEST_POSTGRES_DSN")
	if dsn == "" {
		os.Exit(m.Run())
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect to TEST_POSTGRES_DSN: %v\n", err)
		os.Exit(1)
	}
	if err := pool.Ping(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "ping TEST_POSTGRES_DSN: %v\n", err)
		os.Exit(1)
	}
	testPool = pool

	// Same suite-wide advisory lock key as internal/identity and internal/server:
	// all three suites share this database and must not run concurrently against
	// it. See internal/identity/main_test.go's lockSuite for why.
	unlock := lockSuite(dsn)

	if err := applyMigrations(dsn); err != nil {
		unlock()
		fmt.Fprintf(os.Stderr, "apply migrations: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()

	unlock()
	pool.Close()
	os.Exit(code)
}

const suiteLockKey = 918273645

func lockSuite(dsn string) func() {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "lock suite: open: %v\n", err)
		os.Exit(1)
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`SELECT pg_advisory_lock($1)`, suiteLockKey); err != nil {
		fmt.Fprintf(os.Stderr, "lock suite: %v\n", err)
		os.Exit(1)
	}
	return func() {
		_, _ = db.Exec(`SELECT pg_advisory_unlock($1)`, suiteLockKey)
		_ = db.Close()
	}
}

func applyMigrations(dsn string) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	goose.SetBaseFS(migrations.FS)
	goose.SetLogger(goose.NopLogger())
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Up(db, ".")
}

func requireDB(t *testing.T) {
	t.Helper()
	if testPool == nil {
		t.Skip("set TEST_POSTGRES_DSN to run integration tests (or run `make test-integration`)")
	}
}

// newTestService returns a Service on a clean database, plus the id of a user
// row it inserted directly (this package doesn't depend on internal/identity
// to build one the "real" way -- it only needs a valid users.id to satisfy
// test_runs.created_by's foreign key).
func newTestService(t *testing.T) (*Service, uuid.UUID) {
	t.Helper()
	requireDB(t)

	ctx := context.Background()

	err := database.InTx(ctx, testPool, func(db database.DB) error {
		for _, stmt := range []string{
			`DELETE FROM test_results`,
			`DELETE FROM test_runs`,
			`DELETE FROM users WHERE email = 'testruns-fixture@example.test'`,
		} {
			if _, err := db.Exec(ctx, stmt); err != nil {
				return fmt.Errorf("%s: %w", stmt, err)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("clean database: %v", err)
	}

	var userID uuid.UUID
	err = testPool.QueryRow(ctx,
		`INSERT INTO users (email, full_name) VALUES ($1, $2) RETURNING id`,
		"testruns-fixture@example.test", "Testruns Fixture",
	).Scan(&userID)
	if err != nil {
		t.Fatalf("insert fixture user: %v", err)
	}

	svc := NewService(testPool, slog.New(slog.NewTextHandler(io.Discard, nil)))
	return svc, userID
}
