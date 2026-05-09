---
name: data-pipeline-engineering
description: Designs and implements large-scale ETL and lakehouse-style batch and streaming pipelines, distributed query and processing with Spark and Hadoop-family systems, and ELK (Elasticsearch, Logstash/Beats, Kibana) for ingest, filtering, and visualization. Advises on BI connectivity (JDBC/ODBC, semantic layers, warehouse exports). Use when the user mentions ETL, data lake, Spark, Hadoop, Hive, Iceberg/Delta (as part of stack), Elasticsearch pipelines, Kibana, or BI integration to operational data stores.
license: MIT
compatibility: Google Antigravity workspace skills; Vipecoding submodule pack.
metadata:
  skillId: data-pipeline-engineering
  version: "1.0"
---

# Data pipeline engineering

## When to use
Batch or streaming ingestion, transformation, orchestration, and serving layers for analytics or operational reporting—not single-service CRUD unless it is clearly pipeline-shaped.

## Stack anchors (prefer what the repo already runs)

| Layer | Typical choices |
|-------|-----------------|
| Distributed processing | Apache Spark (batch + Structured Streaming); Hadoop MapReduce/YARN or successor runtimes only when already legacy-mandated |
| Lake / table formats | Iceberg, Delta Lake, Hudi—follow existing table standard; partition and compaction strategy explicit |
| Orchestration | Airflow, Dagster, Prefect, Argo Workflows, Oozie (legacy)—match org standard |
| ELK | Elasticsearch indices and index templates; Ingest pipelines; Logstash or Elastic Agent/Beats; Kibana Discover, Lens, dashboards, Data Views |
| Query at scale | Spark SQL; Trino/Presto on object storage when deployed; Hive metastore compatibility if present |

## MUST
- **Idempotency and late data**: watermarks, dedupe keys, or merge semantics documented; backfill and replay paths defined.
- **Schema evolution**: compatibility rules for producers/consumers; avoid silent destructive coercion in hot paths.
- **Cost and skew**: partition strategy avoids unbounded hot partitions; broadcast vs shuffle joins understood for Spark jobs.
- **Security**: least-privilege IAM/service accounts; no credentials in repo (apply `security-redlines`); field-level redaction before indexing to Elasticsearch when PII is in logs.
- **SLAs**: batch windows vs streaming freshness stated; failure alerts on lag, DLQ depth, or failed stages.

## ELK-oriented guidance
- Prefer **structured logs** upstream; map ECS or org field conventions before ad-hoc grok.
- Index lifecycle: rollover, retention, and forcemerge policies aligned with disk and search latency budgets.
- Kibana: saved searches and dashboards versioned as code (Elastic export or Terraform/OpenAPI where team standard exists).

## BI connectivity (advisory)
- Prefer **read replicas**, **materialized views**, or **curated marts** over direct operational DB hammering.
- Connectivity: JDBC/ODBC to warehouse or lake query engine; semantic layers (e.g., Cube, dbt metrics, LookML-style) when the org uses them—recommend what exists rather than new tools.

## Verification
- [ ] Data contract (schema, keys, SLAs) written or updated
- [ ] Job/resource sizing and retry policy appropriate for engine
- [ ] Monitoring on throughput, lag, failures, and consumer health
- [ ] Documentation for operators: runbook steps for common failures (apply `ops-runbook-readiness` when shipping to prod)
