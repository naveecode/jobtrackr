"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGES, STAGE_META, type Stage } from "@/lib/types";
import { applicationSchema, firstIssue, type ApplicationInput } from "@/lib/validation";

const empty: ApplicationInput = {
  company: "",
  role: "",
  location: "",
  url: "",
  salary: "",
  stage: "SAVED",
  source: "",
  appliedAt: "",
};

export function ApplicationForm({
  initial,
  idPrefix,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ApplicationInput>;
  idPrefix: "create" | "edit";
  submitLabel: string;
  onSubmit: (input: ApplicationInput) => Promise<string | null>;
}) {
  const [values, setValues] = useState<ApplicationInput>({ ...empty, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = applicationSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      if (!next.form) next.form = firstIssue(parsed.error);
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    const error = await onSubmit(parsed.data);
    setPending(false);
    if (error) setErrors({ form: error });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {errors.form ? (
        <p data-testid="form-error" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" error={errors.company} htmlFor={`${idPrefix}-company`}>
          <Input
            id={`${idPrefix}-company`}
            data-testid={`${idPrefix}-company`}
            value={values.company}
            onChange={(event) => set("company", event.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Field label="Role" error={errors.role} htmlFor={`${idPrefix}-role`}>
          <Input
            id={`${idPrefix}-role`}
            data-testid={`${idPrefix}-role`}
            value={values.role}
            onChange={(event) => set("role", event.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Field label="Location" error={errors.location} htmlFor={`${idPrefix}-location`}>
          <Input
            id={`${idPrefix}-location`}
            data-testid={`${idPrefix}-location`}
            value={values.location}
            onChange={(event) => set("location", event.target.value)}
            placeholder="Remote, NYC…"
          />
        </Field>
        <Field label="Source" error={errors.source} htmlFor={`${idPrefix}-source`}>
          <Input
            id={`${idPrefix}-source`}
            data-testid={`${idPrefix}-source`}
            value={values.source}
            onChange={(event) => set("source", event.target.value)}
            placeholder="Referral, LinkedIn…"
          />
        </Field>
        <Field label="Stage" error={errors.stage} htmlFor={`${idPrefix}-stage`}>
          <select
            id={`${idPrefix}-stage`}
            data-testid={`${idPrefix}-stage`}
            value={values.stage}
            onChange={(event) => set("stage", event.target.value as Stage)}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_META[stage].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Applied" error={errors.appliedAt} htmlFor={`${idPrefix}-applied`}>
          <Input
            id={`${idPrefix}-applied`}
            data-testid={`${idPrefix}-applied`}
            type="date"
            value={values.appliedAt}
            onChange={(event) => set("appliedAt", event.target.value)}
          />
        </Field>
        <Field label="Salary" error={errors.salary} htmlFor={`${idPrefix}-salary`}>
          <Input
            id={`${idPrefix}-salary`}
            data-testid={`${idPrefix}-salary`}
            value={values.salary}
            onChange={(event) => set("salary", event.target.value)}
            placeholder="$180k–$210k"
          />
        </Field>
        <Field label="Job URL" error={errors.url} htmlFor={`${idPrefix}-url`}>
          <Input
            id={`${idPrefix}-url`}
            data-testid={`${idPrefix}-url`}
            value={values.url}
            onChange={(event) => set("url", event.target.value)}
            placeholder="https://"
            inputMode="url"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" data-testid={idPrefix === "create" ? "save-application" : "save-application-edit"} disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
