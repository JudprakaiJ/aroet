-- Phase 7: customers.city / customers.country data cleanup
--
-- The imported data had a few recurring problems we never normalised:
--   * standalone country name landed in `city` ("AUSTRALIA", "CHINA", "THAILAND")
--   * "<city>, <COUNTRY>" smashed into the city column ("Kwun Tong, HONG KONG")
--   * "<postal> <COUNTRY>" or "<COUNTRY> <postal>" ("339338 SINGAPORE", "CHINA 201600")
--   * trailing commas / whitespace (city = "WEIFANG,", "Mamplasan, Binan, ")
--   * country still null when company name obviously implies one
--
-- Every UPDATE is gated by a WHERE that only matches the dirty shape, so this
-- file is safe to re-run — a second pass is a no-op.

-- Single source of truth for the country whitelist used in the regex rules.
-- Keep the longer multi-word entries first so the (a|b|c) regex prefers them
-- ("HONG KONG" before "KONG", "UNITED STATES" before "STATES").
-- 1. Trim whitespace + empty → null
update customers set city = nullif(trim(city), '')
  where city is distinct from nullif(trim(city), '');
update customers set country = nullif(trim(country), '')
  where country is distinct from nullif(trim(country), '');

-- 2. Strip trailing commas / whitespace from city
update customers
  set city = nullif(regexp_replace(city, '[\s,]+$', ''), '')
  where city ~ '[\s,]+$';

-- 3. Standalone country in the city field → move it to country, clear city
update customers set
  country = upper(city),
  city = null
where country is null
  and upper(trim(city)) in (
    'AUSTRALIA','BELGIUM','CHINA','FRANCE','GERMANY','HONG KONG','INDIA',
    'INDONESIA','JAPAN','KOREA','MALAYSIA','PHILIPPINES','SINGAPORE',
    'SOUTH KOREA','TAIWAN','THAILAND','UK','UNITED KINGDOM','UNITED STATES',
    'USA','VIETNAM'
  );

-- 4. "<city>, <COUNTRY>" → split country off the end (country was null)
update customers set
  country = upper(regexp_replace(
    city,
    '^.*,\s*(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$',
    '\1', 'i')),
  city = nullif(trim(regexp_replace(
    city,
    ',\s*(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$',
    '', 'i')), '')
where country is null
  and city ~* ',\s*(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$';

-- 5. "<postal> <COUNTRY>" with a space (no comma) → split, e.g. "339338 SINGAPORE"
update customers set
  country = upper(regexp_replace(
    city,
    '^.*\s+(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$',
    '\1', 'i')),
  city = nullif(trim(regexp_replace(
    city,
    '\s+(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$',
    '', 'i')), '')
where country is null
  and city !~ ','
  and city ~* '^.+\s+(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s*$';

-- 6. "<COUNTRY> <postal>" — country at the front, e.g. "CHINA 201600"
update customers set
  country = upper(regexp_replace(
    city,
    '^(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s.+$',
    '\1', 'i')),
  city = nullif(trim(regexp_replace(
    city,
    '^(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s+',
    '', 'i')), '')
where country is null
  and city ~* '^(UNITED KINGDOM|UNITED STATES|SOUTH KOREA|HONG KONG|AUSTRALIA|BELGIUM|CHINA|FRANCE|GERMANY|INDIA|INDONESIA|JAPAN|KOREA|MALAYSIA|PHILIPPINES|SINGAPORE|TAIWAN|THAILAND|VIETNAM|USA|UK)\s.+$';

-- 7. Re-trim trailing commas after splits (steps 4/5/6 can leave them behind)
update customers
  set city = nullif(regexp_replace(city, '[\s,]+$', ''), '')
  where city ~ '[\s,]+$';

-- 8. Infer country from company name when it's still null (conservative — only
--    cases where the country name appears verbatim in the company name)
update customers set country = 'THAILAND'
  where country is null and name ilike '%thailand%';
update customers set country = 'VIETNAM'
  where country is null and name ilike '%vietnam%';
update customers set country = 'INDIA'
  where country is null and name ilike '%india%';
update customers set country = 'AUSTRALIA'
  where country is null and name ilike '%australia%';
update customers set country = 'CHINA'
  where country is null and (name ilike '% china %' or name ilike '%(china)%' or name ilike '% china ltd%');
update customers set country = 'USA'
  where country is null and name ilike '%of america%';
update customers set country = 'MALAYSIA'
  where country is null and name ilike '%sdn.bhd%';
update customers set country = 'MALAYSIA'
  where country is null and name ilike '%sdn. bhd%';
update customers set country = 'MALAYSIA'
  where country is null and name ilike '%sdn bhd%';

-- 9. Normalise country casing
update customers set country = upper(country)
  where country is distinct from upper(country);
