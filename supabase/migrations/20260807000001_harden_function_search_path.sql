-- Pin an immutable, empty search_path on the shared updated_at trigger function
-- to resolve the `function_search_path_mutable` security advisor. The function
-- references no schema-qualified objects, so an empty search_path is safe.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
