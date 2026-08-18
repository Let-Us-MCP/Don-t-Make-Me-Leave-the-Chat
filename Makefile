# Don't Make Me Leave the Chat
#
# `make` builds everything a reader sees. `make check` is what CI runs.

PY      := $(shell [ -x .venv/bin/python ] && echo .venv/bin/python || echo python3)
NODE    := node

.PHONY: all site figures renders matrix check lint refs apps evals serve clean

all: figures renders matrix site

site:
	python3 tools/build_site.py

figures:
	python3 tools/build_figures.py

renders:
	$(NODE) tools/capture_figures.mjs

matrix:
	python3 tools/build_matrix.py

check: lint refs apps evals density style listings captured counts claims

lint:
	python3 tools/lint_prose.py

refs:
	python3 tools/check_refs.py

apps:
	$(NODE) tools/check_apps.mjs

evals:
	$(NODE) gallery/evals/run.js --all

density:
	python3 tools/audit_density.py

style:
	python3 tools/audit_style.py

listings:
	python3 tools/check_listings.py

captured:
	python3 tools/check_captured.py

counts:
	python3 tools/check_counts.py

# Needs proto/ (the spec clone). Skips cleanly without it, so CI stays green.
claims:
	python3 tools/check_claims.py

serve:
	$(NODE) gallery/serve.js

venv:
	python3 -m venv .venv && .venv/bin/pip install -q matplotlib

clean:
	rm -rf docs/*.html
