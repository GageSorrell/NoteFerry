-- Notion-hosted file URLs expire after one hour. Keep SVG source alongside
-- those URLs so cached database cards retain their artwork between refreshes.
alter table app.data_sources
    add column cover_svg text,
    add column icon_svg text;
