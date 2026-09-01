update public.operational_cases
set output_json = jsonb_set(
  output_json,
  '{headline}',
  to_jsonb('1 invoice exception needs AP review'::text),
  false
)
where agent = 'logistics-invoice-reconciliation'
  and output_json ->> 'headline' = '1 invoice exception need AP review';
