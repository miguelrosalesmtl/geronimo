package testruns

import "github.com/miguelrosalesmtl/geronimo/apps/reports-backend/internal/identity"

// This package reuses identity's generic sentinels (ErrValidation, ErrNotFound)
// rather than inventing its own -- internal/server/response.go already maps
// them to the right status code and error envelope in one place, and "not
// found" / "validation failed" are generic enough concepts that a second copy
// would just be two things to keep in sync.

// validationError carries a caller-facing message while still satisfying
// errors.Is(err, identity.ErrValidation), the same trick identity's own
// validationError plays against its own sentinel.
type validationError struct{ msg string }

func (e validationError) Error() string { return e.msg }
func (e validationError) Is(target error) bool {
	return target == identity.ErrValidation
}

func invalid(msg string) error { return validationError{msg: msg} }
