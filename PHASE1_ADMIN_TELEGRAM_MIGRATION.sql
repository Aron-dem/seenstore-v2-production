-- =========================================================
-- SEENSTORE — Phase 1 admin + telegram support migration
-- Safe to run multiple times
-- =========================================================

BEGIN;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;

WITH generated_variants AS (
  SELECT
    p.id,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'color', c.color,
          'hex', CASE lower(c.color)
            WHEN 'black' THEN '#000000'
            WHEN 'white' THEN '#F5F5F5'
            WHEN 'grey' THEN '#9CA3AF'
            WHEN 'gray' THEN '#9CA3AF'
            WHEN 'navy' THEN '#1E3A8A'
            WHEN 'red' THEN '#E63946'
            WHEN 'olive' THEN '#6B7A41'
            WHEN 'beige' THEN '#C9B99A'
            WHEN 'blue' THEN '#3B82F6'
            WHEN 'green' THEN '#10B981'
            WHEN 'khaki' THEN '#C3B091'
            WHEN 'charcoal' THEN '#36454F'
            WHEN 'burgundy' THEN '#800020'
            WHEN 'maroon' THEN '#800000'
            WHEN 'dark brown' THEN '#5C4033'
            WHEN 'forest green' THEN '#228B22'
            ELSE NULL
          END,
          'images', CASE
            WHEN cardinality(p.colors) = 1 THEN to_jsonb(p.images)
            ELSE COALESCE(
              (
                SELECT to_jsonb(array_agg(img))
                FROM unnest(p.images) AS img
                WHERE lower(img) LIKE '%' || replace(lower(c.color), ' ', '-') || '%'
                   OR lower(img) LIKE '%' || replace(lower(c.color), ' ', '') || '%'
                   OR EXISTS (
                     SELECT 1
                     FROM regexp_split_to_table(lower(c.color), '\s+') AS token
                     WHERE length(token) > 2 AND lower(img) LIKE '%' || token || '%'
                   )
              ),
              to_jsonb(p.images)
            )
          END
        )
      ),
      '[]'::jsonb
    ) AS variants
  FROM public.products p
  CROSS JOIN LATERAL unnest(p.colors) AS c(color)
  GROUP BY p.id
)
UPDATE public.products p
SET variants = g.variants,
    updated_at = now()
FROM generated_variants g
WHERE p.id = g.id
  AND (p.variants IS NULL OR p.variants = '[]'::jsonb);

ALTER TABLE public.custom_orders
ADD COLUMN IF NOT EXISTS customer_phone text;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS call_status text NOT NULL DEFAULT 'new',
ADD COLUMN IF NOT EXISTS admin_notes text;

UPDATE public.orders
SET call_status = COALESCE(call_status, 'new')
WHERE call_status IS NULL;

COMMIT;
